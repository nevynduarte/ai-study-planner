# 2-Week Intensive Crash Course

One project, two weeks, only what actually gets tested — then we resume the
months-long plan. The project is **this repo** (`atlas-fof`). Finishing it
*is* the crash course. Each day = one small build step + one transferable drill
+ something that runs.

Covers: **Aaru** (Data Integration), **Equi** (Founding Engineer / Applied AI),
and the broader applied-AI / data / quant roles (D.E. Shaw, Woodline).

## The 6 pillars (what "everything you need" actually is)
1. Python + SQL data fluency — pandas, joins, window functions
2. Data integration / entity resolution — messy multi-source → trusted
3. RAG / LLM app engineering — chunking, retrieval, citations, guardrails
4. Full-stack delivery — FastAPI + Next.js + Postgres
5. System design — pipeline-at-scale *and* RAG / multi-tenant
6. Narrative — turning what you built into 90-second interview answers

## Explicitly NOT doing (so it stays bounded)
No LeetCode marathons. No installing Kafka/Spark/Airflow (reason about them,
don't run them). No new languages. No DSA/ML theory rabbit holes. No
pixel-perfect UI. No infra yak-shaving. Depth only where it's tested.

## Week 1 — Data + AI core
| Day | Build (atlas-fof) | Drill | Done when |
|----|----|----|----|
| 1 | Ingest 3 feeds → `bronze` + quality log | pandas inspect | issues print to a log |
| 2 | Harmonize units/dates/taxonomies → `silver` | normalization | one typed clean table |
| 3 | Entity resolution: block→fuzzy→union-find → `gold` | the Aaru skill | score vs `ground_truth` (P/R) |
| 4 | Dedup + validation + lineage; quarantine bad rows | SQL: ROW_NUMBER, COALESCE | Northgate≠Northgate, bad rows flagged |
| 5 | FastAPI over `gold`: `/funds`, `/managers` | API + Pydantic | live `/docs` |
| 6 | RAG `/ask`: chunk + retrieve + citations | the AI-eng skill | answers cite sources |
| 7 | Hybrid + rerank + numeric guardrail; week review | RAG hardening | guardrail catches a wrong number |

## Week 2 — Full-stack + design + proof
| Day | Build | Drill | Done when |
|----|----|----|----|
| 8 | Next.js fund browser (Server Components) | SSR vs client | browse funds in browser |
| 9 | Q&A panel (Client) wired to `/ask` | full vertical slice | browser→API→gold works |
| 10 | Multi-tenancy: `tenant_id` row scoping | RBAC reasoning | 2 partners, disjoint funds |
| 11 | System-design doc: Aaru "ingest 100TB panel" | pipeline design out loud | 1 page + diagram |
| 12 | System-design doc: Equi RAG + white-label | RAG design out loud | 1 page + diagram |
| 13 | Eval set + faithfulness check; lineage trace | "how do you know it's right" | eval prints numbers |
| 14 | Polish + record yourself narrating both | behavioral story bank | demoable repo + crisp story |

## Daily rhythm (decide once, ~3 hrs)
- 15 min — read the day's row + recall yesterday
- ~2 hr — build the one deliverable
- 30 min — the drill, logged
- 15 min — write 3 sentences: "In an interview I'd describe today's work as…"

## Start here
Day 1 is stubbed and already runs: see `pipeline/DAY1.md` and `pipeline/ingest.py`.
```
python pipeline/ingest.py
```
