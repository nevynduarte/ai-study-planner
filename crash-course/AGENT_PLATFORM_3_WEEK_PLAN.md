> Advanced reference, superseded as the active schedule on 2026-09-16. Follow [November readiness](NOVEMBER_READINESS.md) for required scope and capacity. Use the detailed exercises below selectively; they are not a mandatory three-week checklist.

# Agent Platform — 3-Week Deep Build Plan

**Project 1 of 4. Weeks 1–3.** This expands the original seven-day `agent-platform` sprint into a depth-first build. The objective is not merely to ship the architecture; it is to understand, benchmark, break, repair, and defend every important layer.

## Exit standard

At the end of Day 21, a stranger can use a deployed multi-tenant AI due-diligence analyst that retrieves evidence, queries structured data, calls tools through MCP, executes durable asynchronous workflows, pauses for approvals, streams progress, and produces cited answers. You can defend every major architecture decision without notes.

**Core flow**

```text
Next.js UI
  -> Go gateway
  -> FastAPI API
  -> Kafka/Redpanda
  -> durable worker/runtime
  -> planner + specialist agents
  -> MCP tools
  -> Postgres/pgvector + Redis + retrieval
  -> cited memo

Cross-cutting: OIDC/RBAC/RLS | evals | OTel | security | CI/CD | Terraform | cost
```

**Primary stack:** Python 3.12, FastAPI, Pydantic v2, asyncio, Go/chi, Next.js, Postgres 16, pgvector, Redis, Kafka/Redpanda, Anthropic/OpenAI SDKs, LangGraph, MCP, Docker Compose, AWS, Terraform, GitHub Actions, OpenTelemetry, Prometheus, Grafana, Tempo/Phoenix.

## Daily operating rule

Every day has four outputs: **working code, evidence, explanation, and notes**. Do not count a technology as learned because Claude Code generated working configuration.

Before ending each day:

1. Run the stated verification command.
2. Record measured results in `BENCHMARKS.md` when applicable.
3. Record every meaningful failure in `FAILURES.md`.
4. Write/update the day's ADR when a design choice was made.
5. Add a short entry to `BLOG.md`: attempted / expected / happened / broke / measured / decided / surprised me.
6. Add answers to `INTERVIEW.md` for anything introduced that day.
7. Explain the day's architecture aloud without notes for 10 minutes.

If you cannot explain a component, the day is not complete even if its tests pass.

---

# Week 1 — Build the application correctly

Goal: establish the full local vertical slice from data to retrieval to agent execution to durable workflow.

## Day 1 — Service foundation and local environment

**Learn:** process boundaries, dependency injection, health/readiness, Docker networking, configuration, migrations vs application startup.

**Build**
- Create/rebuild `agent-platform` repo structure.
- FastAPI service with `/health/live` and `/health/ready`.
- Docker Compose: API, Postgres+pgvector, Redis.
- Pydantic settings with environment validation.
- Structured JSON logging and request IDs.
- Unit test for liveness; integration test for readiness.
- Makefile/task runner for `up`, `down`, `test`, `lint`, `migrate`.

**Run**
```bash
docker compose up --build
curl localhost:8000/health/live
curl localhost:8000/health/ready
pytest -q
```

**Done when** readiness verifies Postgres and Redis independently; killing either dependency changes readiness without killing the API process; tests are green.

**Interview defense:** liveness vs readiness; why dependencies should not be checked in liveness; Docker network/DNS; connection pooling.

## Day 2 — Relational model, migrations, tenancy

**Learn:** relational modeling, constraints, transactions, indexes, RLS fundamentals.

**Build**
- Alembic or explicit SQL migrations.
- Tables: `tenants`, `users`, `documents`, `chunks`, `runs`, `run_steps`, `approvals`, `audit_events`.
- pgvector extension.
- tenant IDs on every tenant-owned row.
- unique/idempotency constraints.
- indexes justified by expected query patterns.
- seed `acme` and `globex` tenants.
- first RLS policies and isolation tests.

**Run**
```bash
python scripts/migrate.py
pytest tests/test_tenant_isolation.py -q
```

**Done when** a test deliberately attempts cross-tenant reads/writes and fails at the database layer, not only in application code.

**ADR:** `postgres-schema-and-tenancy.md`.

## Day 3 — Real ingestion and idempotency

**Learn:** parsing, deterministic identifiers, chunking, retries, transaction boundaries, reproducibility.

**Build**
- ingest TCAD/City of Austin structured data or equivalent real corpus.
- PDF ingestion with page/paragraph metadata.
- deterministic document and chunk IDs.
- 800-token baseline chunker.
- embeddings with `bge-small-en-v1.5` or justified alternative.
- batch embedding and retry behavior.
- rerunning ingestion must add zero duplicates.

**Measure**
- docs/sec
- chunks/sec
- embeddings/sec
- total storage
- duplicate count after second run

**Done when** real structured data + >=500 document chunks are queryable and a complete rerun produces zero duplicate logical records.

## Day 4 — Retrieval baselines

**Learn:** BM25, dense retrieval, HNSW, cosine similarity, metadata filters, retrieval evaluation.

**Build**
- `retrieval/bm25.py`
- `retrieval/vector.py`
- small hand-labeled `evals/retrieval.jsonl` (>=30 queries initially)
- metrics: Recall@5/10, MRR, NDCG, P50/P95 latency.

**Experiment:** BM25 vs vector-only.

**Done when** `BENCHMARKS.md` contains the first actual retrieval table, not claims.

**ADR:** begin `vector-store-choice.md`: pgvector vs FAISS vs Qdrant vs OpenSearch.

## Day 5 — Hybrid retrieval and reranking

**Learn:** reciprocal-rank fusion, cross-encoder reranking, latency/quality tradeoff.

**Build**
- hybrid BM25+dense via RRF.
- cross-encoder reranker.
- metadata filtering.
- retrieval API endpoint.

**Experiment**
```text
BM25
vector
hybrid
hybrid + reranker
```
Record quality and P95 latency for all four.

**Done when** you can state which mode wins on your corpus, by how much, and at what latency cost.

## Day 6 — Tool layer and direct LLM runtime

**Learn:** tool schemas, structured outputs, validation, tool permissions, model failure modes.

**Build**
- direct Anthropic/OpenAI SDK runtime; no orchestration framework yet.
- tools: `search_docs`, `sql_query`, `calc`, `fetch_url`.
- read-only SQL role, SELECT-only enforcement, statement timeout.
- Pydantic schemas for tool input/output and final answer.
- max steps, token budget, timeout.
- citations validated against actual chunk IDs/page metadata.

**Run** a question requiring retrieval + SQL + calculation.

**Done when** the trace shows multiple tools and the final structured answer cites verifiable evidence.

**ADR:** `direct-sdk-before-framework.md`.

## Day 7 — Week 1 integration + oral defense

**Build/repair only.** No major new technology.

- integration tests for ingest -> retrieval -> agent answer.
- malformed tool output tests.
- model timeout simulation.
- SQL rejection tests.
- benchmark rerun from clean state.
- architecture diagram v1.

**Failure drill:** kill Redis during a request and document what actually fails.

**Oral review (record yourself):** 30 minutes explaining data model, ingestion, retrieval, tool execution and current failure modes.

**Week 1 gate:** you can rebuild locally from README, demonstrate a cited multi-tool answer, and defend BM25/vector/hybrid/reranker choices with measured evidence.

---

# Week 2 — Turn it into a production system

Goal: durable execution, concurrency, authentication, authorization, MCP, framework comparison, frontend, observability.

## Day 8 — Kafka and event contracts

**Learn:** broker/partition/consumer group/offset semantics, at-least-once delivery, ordering, schemas.

**Build**
- Redpanda locally.
- typed events: `RunRequested`, `StepStarted`, `StepFinished`, `ApprovalRequested`, `RunFinished`, `RunFailed`.
- every event includes `event_id`, `tenant_id`, `run_id`, timestamp, schema version.
- producer/consumer smoke tests.

**Experiment:** deliberately publish duplicate events.

**ADR:** `kafka-vs-sqs-vs-redis-streams.md`.

## Day 9 — Durable worker, idempotency and DLQ

**Learn:** delivery semantics, side-effect safety, retries/backoff, poison messages, state machines.

**Build**
- worker consumes run requests.
- idempotent `(run_id, step_no)` persistence.
- commit offsets only after durable state.
- exponential backoff + jitter.
- DLQ with retry/admin inspection.
- idempotency key on `POST /runs`.

**Failure drill:** kill worker halfway through a multi-step run and restart it.

**Done when** it resumes without duplicate side effects.

## Day 10 — Async concurrency, streaming and backpressure

**Learn:** asyncio task lifecycle, bounded concurrency, backpressure, SSE vs WebSockets, cancellation.

**Build**
- parallel independent tool nodes with bounded semaphore.
- per-tool timeout.
- SSE `GET /runs/{id}/stream`.
- cancellation endpoint.
- queue-depth metric.

**Load test:** compare sequential vs bounded-parallel execution at multiple concurrent-user levels.

**Measure:** throughput, P50/P95/P99, error rate, queue depth.

**ADR:** `sse-vs-websockets.md`.

## Day 11 — Human approval and resumable workflows

**Learn:** durable state machines, HITL, exactly-once side effects as an application property.

**Build**
- approval-required `send_email` or equivalent side-effect tool.
- `ApprovalRequested` state.
- `POST /runs/{id}/approve` and reject.
- expiry/timeouts.
- audit record.

**Failure drill:** restart API + worker while a run waits for approval; it must still resume correctly.

## Day 12 — OIDC, RBAC, RLS and Go gateway

**Learn:** JWT/JWKS, authentication vs authorization, defense in depth, rate limiting.

**Build**
- Keycloak locally; Cognito-compatible architecture for cloud.
- roles: viewer/analyst/admin.
- JWT validation.
- endpoint RBAC.
- DB RLS activated per request.
- Go/chi gateway: JWT check, request ID, Redis token bucket, SSE passthrough.
- audit every mutation/tool call.

**Tests:** role x endpoint matrix; tenant isolation; expired/bad token; rate limit.

**ADR:** `go-gateway-vs-fastapi-only.md`.

## Day 13 — MCP and agent topology comparison

**Learn:** MCP primitives/transports, tool discovery, framework abstraction cost, planner/executor patterns.

**Build**
- expose internal tools through MCP.
- runtime becomes MCP client.
- add one safe third-party MCP server.
- implement same workflow three ways: direct single-agent, custom planner/executor, LangGraph.

**Experiment:** >=20 representative questions.

**Measure:** correctness/quality rubric, tokens, cost, latency, failure rate.

**ADRs:** `mcp-vs-hardcoded-tools.md`, `custom-runtime-vs-langgraph.md`.

## Day 14 — Memory + Next.js vertical slice

**Learn:** session state vs durable memory, summarization, privacy, streaming UX.

**Build**
- short-term turn buffer in Redis.
- long-term facts in Postgres under RLS.
- summarization/compaction budget.
- forget/expiry semantics.
- memory isolation tests.
- Next.js demo: login, ask question, live steps, citations, approval button, usage view.

**ADR:** `agent-memory-model.md`.

**Week 2 gate:** browser -> gateway -> API -> Kafka -> worker -> agents/tools -> cited result works; kill/restart behavior is demonstrated; cross-tenant tests pass; topology comparison has real numbers.

---

# Week 3 — Prove production readiness and publish it

Goal: rigorous evals, security, observability, cloud/IaC, failure engineering, cost/performance and communication.

## Day 15 — Evaluation dataset and regression harness

**Learn:** retrieval vs answer evaluation, faithfulness, judge calibration, regression gates.

**Build**
- expand to >=75 evaluation questions tagged lookup/sql/multi-step/unanswerable/adversarial.
- expected evidence IDs for retrieval questions.
- retrieval metrics.
- answer correctness + faithfulness rubric.
- human-labeled subset >=20.
- compare LLM judge with human labels.
- abstention metric.

**CI gate:** prevent material regression against selected baseline.

**Done when** evaluation can be rerun with one command and produces a versioned report.

## Day 16 — Security and threat model

**Learn:** prompt injection, SSRF, SQL/tool abuse, tenant leakage, secret management, least privilege.

**Build**
- `SECURITY.md` and threat model.
- poisoned-document injection suite.
- URL allowlist/private-IP blocking.
- PII redaction where appropriate.
- per-agent tool allowlists.
- secret scanning/dependency scanning.
- payload/input limits.

**Attack the system:** at least 20 adversarial cases.

**Measure:** attack success/block/abstain counts; document residual risks.

## Day 17 — OpenTelemetry and SLOs

**Learn:** logs vs metrics vs traces, RED metrics, trace propagation through async/event systems, SLI/SLO design.

**Build**
- OTel gateway -> API -> Kafka -> worker -> LLM/tool spans.
- Prometheus/Grafana + Tempo or Phoenix.
- span attributes for model, tokens, cost, tenant, tool.
- dashboards: request rate, errors, P50/P95/P99, queue depth, LLM latency, retrieval latency, token/cost, DLQ.
- define explicit SLOs and alert thresholds.

**Done when** one run is traceable end-to-end across the async boundary.

## Day 18 — AWS + Terraform + CI/CD

**Learn:** VPC/network boundaries, IAM, managed vs self-managed services, deployment/rollback, IaC state.

**Build**
- Terraform modules for network, compute, DB/cache/broker choices, IAM, secrets, observability as practical.
- container registry.
- staging deployment.
- GitHub Actions: lint/test/security/build/deploy.
- migrations in deployment path.
- rollback procedure.

Use managed services pragmatically; do not force EKS solely to check a keyword. If EKS is used, document why it wins for this project; otherwise compare it explicitly with ECS/Fargate.

**ADR:** `eks-vs-ecs.md`.

**Cost guard:** destroy expensive ephemeral resources when not demoing.

## Day 19 — Load test and performance engineering

**Learn:** bottleneck identification, saturation, connection pools, caching, batching, rate limits, capacity planning.

**Build/test**
- k6/Locust load tests.
- scenarios: read-heavy retrieval, multi-tool run creation, streaming concurrent runs.
- find first bottleneck rather than guessing.
- make one optimization and rerun identical test.

**Measure before/after:** throughput, P50/P95/P99, error rate, CPU/memory, DB pool, queue depth, token cost.

**Done when** `BENCHMARKS.md` contains a defensible before/after optimization result.

## Day 20 — Failure day: break everything

Run controlled incidents and write short postmortems/runbooks.

At minimum:
1. Redis unavailable.
2. Postgres pool saturation.
3. Kafka/Redpanda unavailable or consumer stopped.
4. LLM provider 429/timeouts.
5. retrieval latency spike.
6. worker death mid-run.
7. bad application deployment.
8. expired/invalid auth key path.

For each: detection -> user impact -> containment -> recovery -> prevention.

**Done when** `docs/postmortems/` and `docs/runbooks/` contain evidence, not hypothetical prose.

## Day 21 — Ship, write, defend

**No major new infrastructure.** Finish the product and evidence.

Required artifacts:
- `README.md`
- `ARCHITECTURE.md`
- `BENCHMARKS.md`
- `COST.md`
- `FAILURES.md`
- `SECURITY.md`
- `INTERVIEW.md`
- `BLOG.md`
- `docs/adrs/`
- `docs/runbooks/`
- `docs/postmortems/`
- `evals/`
- `load-tests/`
- `tests/`
- `terraform/`
- `.github/workflows/`

README opening order:
1. problem/hook
2. 30–60 second demo GIF/video/live URL
3. quantified result
4. architecture diagram
5. only then implementation detail

**Final oral defense:** 60–90 minutes, recorded, no notes. Answer:
- Why this architecture?
- Why Postgres/pgvector?
- Why Kafka rather than SQS?
- Why Go gateway?
- Why MCP?
- Why/when LangGraph?
- What guarantees do you actually provide around duplicate processing?
- What happens if Redis/Kafka/Postgres/model provider fails?
- How did you measure retrieval quality?
- How did you validate LLM evals?
- What is your P95 and bottleneck?
- What does one run cost?
- What is the biggest security risk?
- What changes at 10x users, data and traffic?
- What would you remove if maintaining this with a three-person team?

Tag `v1.0` only when you can answer these from your own implementation and evidence.

---

# Required ADR set

At minimum:

1. Postgres schema + tenancy/RLS
2. vector store: pgvector vs FAISS/Qdrant/OpenSearch
3. direct SDK before orchestration framework
4. Kafka vs SQS vs Redis Streams
5. SSE vs WebSockets
6. Go gateway vs FastAPI-only
7. MCP vs hardcoded/internal tool adapters
8. custom planner/executor vs LangGraph
9. agent memory model
10. EKS vs ECS/Fargate
11. model routing/caching strategy
12. evaluation strategy

ADR format:

```text
Context
Requirements
Alternatives
Decision
Consequences
Benchmark/evidence
Conditions that would change the decision
```

# Final quantitative scorecard

The project is incomplete until these have measured values:

| Area | Required evidence |
|---|---|
| Ingestion | docs/chunks/embeddings per second; duplicate rerun result |
| Retrieval | Recall@5/10, MRR, NDCG, P95 across BM25/vector/hybrid/rerank |
| Agent topology | quality/correctness, latency, tokens, cost, failure rate |
| Reliability | worker-kill recovery and duplicate-side-effect result |
| Evaluation | correctness, faithfulness, abstention, judge/human agreement |
| Security | adversarial test outcomes |
| API/system | throughput, P50/P95/P99, error rate under load |
| Observability | trace coverage + alert/SLO demonstration |
| Cost | cost per representative run + monthly demo estimate |
| Scaling | evidence-backed first bottleneck + 10x design |

# The real objective

This project is successful when the strongest interview statement is no longer “I used FastAPI, Kafka, RAG, LangGraph and AWS.” It becomes:

> “I built and operated the entire system. Here is why each component exists, here are the alternatives I tested, here are the measurements, here is what broke, and here is what I would change at the next order of magnitude.”
