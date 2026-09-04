# data-platform — understand it before you build it

## What it is, in plain words

Week 1's agent searched a few hundred PDF chunks in one Postgres table. Real companies have **millions** of documents, spreadsheets, emails, and database rows arriving **continuously**, from many sources, in inconsistent shapes. This project is the machine that swallows all of that, cleans it in stages, and serves fast, high-quality search over it.

Think of it as a water treatment plant. Raw water comes in from rivers (Kafka topics). It sits in a settling tank exactly as it arrived (**bronze**). It is filtered and typed (**silver**). It is bottled into the exact shapes downstream consumers want (**gold**). Then a tap (**the search API**) serves it. Week 1's `search_docs` tool gets repointed at this tap on Day 13.

## Why employers care

Databricks FDE, PRIMUS, and every data-heavy AI role ask for Spark, streaming, Delta/lakehouse, and "data pipelines at scale." Most AI candidates have never processed more than a CSV. Being able to say *"I indexed 5 million chunks, here is recall and P95 by method, here is what happened when I killed a Spark worker mid-batch"* puts you in a different bucket.

## The picture

```
  SOURCES                    STREAM              PROCESSING (Spark)            STORAGE (Delta on MinIO/S3)
  parcels CSV  ──producer──► raw.parcels ──┐
  permits CSV  ──producer──► raw.permits ──┼──► bronze job ──► bronze/*   (exactly as received + ingest ts)
  EDGAR PDFs   ──producer──► raw.docs ─────┘        │
  your PDFs    ──producer──► (S3 key in msg)        ▼
                                             silver job ──► silver/*   (typed, deduped, late events
                                                    │                    handled, bad rows → quarantine)
                                                    ▼
                                             gold job   ──► gold/parcels_current
                                                    │       gold/permits_by_parcel
                                                    │       gold/doc_chunks  (parsed + chunked text)
                                                    ▼
                                             embed job  ──► gold/doc_chunks_emb  (vectors)
                                                    │
                          ┌─────────────────────────┴──────────────────────┐
                          ▼                                                ▼
                   OpenSearch                                         pgvector
                   (BM25 + kNN index)                                 (HNSW index)
                          └──────────────────┬─────────────────────────────┘
                                             ▼
                                   search API (FastAPI)
                                   /search?mode=vector|bm25|hybrid|hybrid+rerank|decompose|hyde
                                             ▲
                                   Week 1 agent's search_docs tool

  Dagster schedules and tracks every job above (lineage: which output came from which input).
  Prometheus/Grafana watch: Kafka lag, batch duration, rows/sec, search P95.
```

## Follow one record through the system

1. **A producer** reads one row of the permits CSV and publishes it as a JSON message to Kafka topic `raw.permits`. Kafka appends it to a partition and keeps it (it is a log, not a mailbox).
2. **The bronze job** is a Spark *structured streaming* query. It reads new messages, adds `ingest_ts` and `source`, and appends them unchanged to the Delta table `bronze/permits`. It writes a **checkpoint** so if it dies, it restarts exactly where it left off, and Delta's transaction log means a half-written batch is never visible.
3. **The silver job** reads bronze, casts every column to a real type (dates as dates, money as decimals), **deduplicates** by permit id keeping the latest `event_ts`, handles **late events** with a one-hour watermark, sends rows that fail validation to `quarantine` with a reason, and handles a new column appearing (**schema evolution**) without crashing.
4. **The gold job** joins permits to parcels and writes `gold/permits_by_parcel`, the exact shape the agent's `sql_query` tool wants. For documents, it parses PDFs and chunks text into ~800-token pieces → `gold/doc_chunks`.
5. **The embed job** runs the embedding model inside Spark across all workers (`mapPartitions`, batch 256) and writes vectors → `gold/doc_chunks_emb`. Then two writers push the chunks into **OpenSearch** (keyword + vector index) and **pgvector** (vector index), so you can compare them.
6. **A search request** arrives: `/search?q=flood plain setback&mode=hybrid+rerank`. The API runs BM25 and vector search in parallel, fuses the two rankings, reranks the top 30 with the cross-encoder, and returns 8 chunks with scores and metadata.
7. **Dagster** ran steps 2 to 5 on a schedule, recorded which inputs produced which outputs, and ran **asset checks** (row counts, null rates, freshness). If permits stop arriving, an alert fires.

## The tools, and why each one is here

| Tool | What it is | Why it is in this project | What you could use instead |
|------|------------|---------------------------|----------------------------|
| **Kafka (Redpanda locally)** | Distributed append-only log | Sources produce independently; consumers read at their own pace; replayable | Kinesis, Pulsar, SQS (not replayable) |
| **Apache Spark / PySpark** | Distributed data engine | Processes data larger than one machine's memory across workers; the industry default; Databricks is Spark | DuckDB/Polars (single machine), Flink (streaming-first) |
| **Structured streaming** | Spark's streaming API | Same code for batch and stream; checkpointing gives exactly-once to Delta | Kafka Streams, Flink |
| **Delta Lake** | Table format on top of Parquet files with a transaction log | ACID writes on object storage, time travel, schema evolution, `MERGE` | Apache Iceberg, Hudi, plain Parquet (no transactions) |
| **MinIO** | S3-compatible object store you run locally | Same API as S3 so nothing changes when you move to AWS | Local disk (does not teach you S3 semantics) |
| **Bronze / silver / gold** | A naming convention (medallion architecture) | Makes "how clean is this table" obvious; reprocessing is possible because bronze is untouched | Staging/core/marts naming (dbt style) |
| **Dagster** | Orchestrator with an asset model | Schedules jobs, shows lineage, runs data-quality checks, retries | Airflow (task-based), Prefect |
| **OpenSearch** | Search engine (Elasticsearch fork) with BM25 and kNN | Purpose-built for text search at scale; the thing to compare pgvector against | Elasticsearch, Vespa, Qdrant |
| **pgvector** | Postgres vector extension | Simplest option; the question is *when* it stops being enough. You measure that at 5M chunks. | Qdrant, Milvus, Pinecone |
| **bge-small / bge-reranker** | Embedding model / cross-encoder reranker | Same as Week 1, now run distributed inside Spark | OpenAI embeddings, Cohere rerank |
| **chispa** | Assertion helpers for Spark DataFrames in pytest | Unit-test transforms on small fixtures | Hand-written comparisons |
| **Databricks Free** | Hosted Spark with a notebook UI | Recruiters at Databricks want to see you have touched the product; you compare one job's Spark UI plan | Skip if it eats more than an hour |

## What the week produces

A repo where `docker compose up` brings up Kafka, Spark, MinIO, Dagster, OpenSearch, and Postgres; producers stream three datasets; bronze/silver/gold tables appear on schedule with lineage in Dagster; 5 million chunks are indexed in two stores; a benchmark matrix compares six retrieval modes across both stores (recall, MRR, NDCG, P95, cost per query); six postmortems document what happened when you broke it; and Week 1's agent now searches through this system.

## Words you will hear this week

- **Partition**: a slice of a Kafka topic or a Spark dataset processed independently. More partitions → more parallelism.
- **Consumer group / offset**: which consumers share a topic / how far each has read.
- **Checkpoint**: where a streaming job records its progress so it can resume.
- **Exactly-once vs at-least-once**: each record affects output once / may be processed twice and you must make that harmless (idempotent writes).
- **Watermark / late event**: how long to wait for stragglers before finalizing a time window / a record that arrives after its window closed.
- **Schema evolution**: new or changed columns arriving without breaking the pipeline.
- **Shuffle**: Spark moving data between workers for a join or groupBy. The expensive part.
- **Skew**: one key having far more rows than others, so one worker does all the work.
- **Backpressure**: producers outrunning consumers; lag grows; something must slow down or scale out.
- **Parquet**: columnar file format; Delta and Iceberg are transaction logs on top of it.
- **HNSW**: the graph index that makes vector search fast. Build time and memory are the cost.
- **Recall@K / MRR / NDCG**: did the right chunk appear in the top K / how high was the first right one / quality of the whole ranking.
- **Query decomposition / HyDE**: split a complex question into sub-queries / have the model write a hypothetical answer and search with *that*.
- **Lineage**: which inputs produced this output, and when.

## The day-by-day in one line each

8. Skeleton: compose brings up the whole stack; producers publish; bronze streaming job lands 100k rows and survives a restart with zero duplicates.
9. Silver + gold: typing, dedup, late events, quarantine, schema evolution, Dagster assets with lineage.
10. Scale: embed inside Spark, reach 5M chunks, index into OpenSearch and pgvector, record throughput.
11. Search API + benchmark matrix: six modes × two stores; one Databricks comparison.
12. Break it: six drills with postmortems; prove exactly-once with a count.
13. Repoint Week 1's tool here; data-quality checks; dashboards; CI on transforms.
14. README, scaling doc, video, case study, three applications.
