# Portfolio Build — 4 End-to-End Production Systems in 12 Weeks

**Revised 2026-09-11.** This plan replaces the earlier five-platform/five-week sprint.

The objective is not to accumulate project count. The objective is to build **four systems that prove complete ownership of the AI/ML lifecycle** and create enough depth to defend architecture, tradeoffs, failures, benchmarks, cost, security, and scaling decisions in an interview.

The working thesis is now:

> Nevyn has broad exposure to AI/ML software and strong quantitative/software foundations, but needs repeated end-to-end ownership of production ML/AI systems to convert fragmented experience into demonstrable engineering depth.

The portfolio therefore optimizes for **depth, evidence, repetition, and explanation**, not breadth for its own sake.

---

## Final portfolio

| Weeks | Repo | What it proves |
|---|---|---|
| 1–3 | `agent-platform` | Production GenAI / applied AI engineering: multi-tenant agents, RAG, MCP, APIs, event-driven workflows, security, evals, observability |
| 4–6 | `data-platform` | Production data + retrieval engineering: Kafka, Spark/Delta, dbt, orchestration, data quality, hybrid search, scale benchmarks |
| 7–9 | `ml-platform` | Full ML lifecycle + GPU serving: features, training, experiment tracking, registry, deployment, drift, retraining, PyTorch/XGBoost, Triton/vLLM/ONNX/TensorRT |
| 10–12 | `autonomous-swe` | Agentic SWE / forward-deployed AI: repo intelligence, AST/code search, tool use, sandboxes, multi-agent execution, tests, security, measurable task resolution |

`nevyn-lm` is **not** a fifth standalone portfolio repo. Transformer-from-scratch work moves into `ml-platform` as a model-development and serving module so it strengthens the ML lifecycle story instead of diluting the portfolio.

The systems should interoperate:

```text
                         ┌───────────────────────┐
                         │   agent-platform      │
                         │ planner / tools / UI  │
                         └───────────┬───────────┘
                                     │
                          retrieval  │  model calls
                                     │
                    ┌────────────────┴──────────────┐
                    │                               │
          ┌─────────▼─────────┐           ┌────────▼─────────┐
          │   data-platform   │           │   ml-platform    │
          │ ingest / search   │           │ train / serve    │
          └───────────────────┘           └────────┬─────────┘
                                                   │
                                                   │ local/open models
                                                   │
                                        ┌──────────▼──────────┐
                                        │ autonomous-swe      │
                                        │ optional agent tool │
                                        └─────────────────────┘
```

---

# Non-negotiable rules

## 1. Build for interview defense

For every major component you must be able to answer, without notes:

1. What does it do?
2. How does it work internally?
3. Why did I choose it?
4. What alternatives did I evaluate and why did I reject them?
5. What happens when it fails or load increases 10×?
6. What measurement supports my claim?

If you can answer only 1–2, you have familiarity. If you can answer 1–4, you are approaching solid engineering depth. If you can answer all six with evidence, the project is interview-ready.

## 2. Every project ships with the same production artifacts

```text
README.md
ARCHITECTURE.md
BENCHMARKS.md
COST.md
FAILURES.md
SECURITY.md
INTERVIEW.md
BLOG.md

docs/
  adrs/
  diagrams/
  postmortems/
  runbooks/
  threat-model/

evals/
load-tests/
tests/
terraform/
helm/
.github/workflows/
```

Use `PROJECT_INTERVIEW_TEMPLATE.md` and `PROJECT_BLOG_TEMPLATE.md` in this directory for the two portfolio-specific artifacts.

## 3. Every architectural choice gets evidence

Every meaningful choice gets an ADR:

```text
Context
Requirements
Alternatives
Decision
Consequences
Benchmark evidence
Failure implications
What would change the decision
```

Examples:

- Kafka vs SQS vs Redis Streams
- ECS vs EKS
- pgvector vs Qdrant vs OpenSearch
- LangGraph vs custom runtime
- sync request/response vs event-driven execution
- Airflow vs Dagster
- Delta vs Iceberg vs plain Parquet
- Triton vs vLLM vs FastAPI-only serving
- XGBoost vs LightGBM vs PyTorch

## 4. Beat a baseline

No model/retrieval/agent benchmark counts without a baseline.

Examples:

- vector search vs BM25 vs hybrid vs hybrid+reranker
- majority/mean/last-value predictor vs learned model
- single-agent vs planner/worker vs planner/worker/reviewer
- eager PyTorch vs `torch.compile` vs ONNX vs TensorRT
- FP32 vs BF16/FP16 vs INT8/INT4

## 5. Break the system deliberately

Every project includes failure drills and postmortems.

Required examples across the portfolio:

- Redis unavailable
- Kafka consumer crashes mid-run
- duplicate event delivery
- Postgres connection-pool saturation
- schema-breaking input
- poisoned RAG document / prompt injection
- LLM provider returns 429/5xx
- vector-search latency spike
- GPU worker dies
- bad model deployment
- CI/CD rollback

## 6. Write while building

`BLOG.md` is updated every build session. Do not wait until the end and reconstruct a polished story from memory.

Record:

- what you attempted
- what you expected
- what happened
- what failed
- what you measured
- what you changed
- why you changed it
- what surprised you

The final website article should read like an engineering case study, not a tutorial.

---

# Project 1 — Enterprise Agentic AI Platform

## Goal

Build a production-style multi-tenant AI due-diligence/research platform where a user can ask about a property, company, or document set and watch a planner execute retrieval, SQL, calculations, and external tools before generating an evidence-backed memo.

**Primary hiring signal:** Applied AI Engineer / GenAI Engineer / Forward-Deployed AI Engineer / AI Software Engineer.

## Core flow

```text
Next.js
  ↓
Go API gateway
  ↓
FastAPI
  ↓
Kafka / durable worker
  ↓
Planner / executor
  ↓
MCP tools + SQL + retrieval + external APIs
  ↓
Postgres / pgvector / Redis
  ↓
Cited memo + audit trail
```

## Required stack

- Python 3.12
- FastAPI + Pydantic
- Go gateway
- Next.js / TypeScript
- Postgres + pgvector
- Redis
- Kafka/Redpanda locally; AWS-managed equivalent for cloud deployment
- Anthropic/OpenAI SDKs
- custom agent runtime + LangGraph comparison
- MCP
- Docker
- AWS
- Terraform
- Kubernetes/EKS by production milestone
- GitHub Actions + ArgoCD
- OpenTelemetry
- Prometheus + Grafana
- Phoenix or equivalent LLM tracing/eval tooling

## Required capabilities

### Application/backend
- REST APIs
- SSE/WebSocket streaming
- asyncio/concurrency
- structured outputs
- rate limits
- token budgets
- idempotency keys
- retries/backoff
- timeouts
- circuit breakers
- DLQ
- resumable workflows

### AI
- planner/executor architecture
- tool calling
- MCP server/client
- versioned prompts
- model routing
- semantic caching
- short- and long-term memory
- hybrid retrieval
- reranking
- citations
- offline evals
- online quality/cost/latency metrics

### Security
- OIDC
- RBAC
- tenant isolation/RLS
- audit log
- PII redaction
- prompt-injection tests
- SSRF controls
- per-agent tool permissions
- secrets/IAM

## Required benchmarks

- BM25 vs dense vs hybrid vs hybrid+reranker
- Recall@5/10
- MRR
- NDCG
- answer correctness
- faithfulness
- abstention on unanswerable queries
- P50/P95/P99 latency
- cost/query
- token/query
- cache hit rate
- single agent vs planner/executor vs LangGraph

## Required failure drills

- kill worker mid-run and verify resume without duplicate side effects
- LLM 429
- Redis outage
- poison retrieval corpus
- exceed tenant rate/token quota
- intentionally break downstream tool

## Blog target

**Building a Production Agentic AI Platform: From RAG Prototype to Multi-Tenant Distributed System**

---

# Project 2 — Production Data + Retrieval Platform

## Goal

Build the ingestion/retrieval backbone behind Project 1. It should consume files and streams, preserve raw data, validate/transform it through bronze/silver/gold layers, create searchable chunks, and expose a production retrieval API over millions of records/chunks.

**Primary hiring signal:** Data/ML Engineer / ML Platform Engineer / AI Platform Engineer / Applied AI Engineer.

## Core flow

```text
Producers / files / APIs
        ↓
Kafka
        ↓
Spark Structured Streaming
        ↓
Delta bronze
        ↓
validated silver
        ↓
dbt gold
        ↓
embeddings + lexical index
        ↓
OpenSearch + pgvector
        ↓
/search API
```

## Required stack

- Kafka/Redpanda
- PySpark / Spark Structured Streaming
- Delta Lake
- S3/MinIO
- dbt
- Dagster or Airflow
- Great Expectations or Pandera
- OpenSearch
- pgvector
- FastAPI
- Docker
- AWS
- Terraform
- Databricks notebook/workflow comparison where practical

## Required capabilities

- batch + streaming ingestion
- schema contracts
- schema evolution
- checkpoints
- watermarks / late data
- idempotency
- deduplication
- quarantine/dead-letter handling
- partitioning
- Spark shuffle/skew analysis
- lineage
- data-quality gates
- reprocessing strategy
- bronze/silver/gold
- hybrid search
- reciprocal-rank fusion
- cross-encoder reranking
- index refresh strategy
- API caching/rate limiting

## Scale target

Use real Austin/Travis data plus generated/duplicated corpora to reach a level that exposes real systems behavior. Target up to **5 million searchable chunks** where local/cloud cost makes sense; document when a smaller reproducible benchmark is used instead.

## Required benchmarks

- ingest rows/sec
- streaming lag
- Spark stage/task timing
- shuffle size
- indexing throughput
- index build time
- vector vs lexical storage size
- query QPS
- P50/P95/P99 search latency
- Recall@K
- MRR
- NDCG
- reranking lift
- cost per million ingested records / million indexed chunks

## Required failure drills

- Kafka consumer restart
- duplicate event replay
- malformed schema
- late event
- Spark worker failure
- OpenSearch unavailable
- pgvector latency degradation
- full reprocessing from bronze

## Blog target

**What Happens Before RAG: Building a Multi-Million-Chunk Production Retrieval Pipeline**

---

# Project 3 — End-to-End ML Platform + GPU Serving

## Goal

Prove complete ownership of the traditional ML lifecycle **and** modern model-serving infrastructure.

This project must start with a real predictive problem, not with infrastructure. Suggested domain: Austin/Travis property data, permits, valuation change, renovation probability, or another measurable target derived from the shared data platform.

**Primary hiring signal:** Machine Learning Engineer / ML Platform Engineer / MLOps Engineer / AI Infrastructure Engineer.

## Core lifecycle

```text
raw data
  ↓
feature pipeline
  ↓
training dataset
  ↓
baseline
  ↓
XGBoost / LightGBM / PyTorch
  ↓
experiment tracking
  ↓
model registry
  ↓
validation gates
  ↓
batch + online deployment
  ↓
monitoring
  ↓
drift detection
  ↓
retraining
```

## Required stack

- scikit-learn
- XGBoost
- LightGBM
- PyTorch
- MLflow
- feature/versioned datasets
- Postgres/S3
- Kafka where online features/events are useful
- FastAPI
- Docker
- Kubernetes/EKS
- KServe or equivalent model-serving control plane
- NVIDIA Triton
- ONNX Runtime
- TensorRT where compatible
- vLLM for LLM-serving comparison
- Terraform
- ArgoCD
- Prometheus/Grafana

## Required ML lifecycle capabilities

- train/validation/test splitting
- leakage prevention
- reproducible features
- baseline models
- hyperparameter experiments
- model comparison
- artifact/version management
- registry stages
- validation gates
- canary release
- rollback
- online vs batch inference
- model/data drift
- performance degradation alarms
- retraining trigger
- model-card style documentation

## GPU/inference experiments

Compare when practical:

- eager PyTorch
- `torch.compile`
- ONNX Runtime
- TensorRT
- FP32
- BF16/FP16
- INT8 / INT4 where meaningful
- batch size
- dynamic batching
- cold start
- concurrency

Track:

- latency
- throughput
- GPU utilization
- VRAM
- cost/request
- accuracy delta

## Transformer-from-scratch module (`nevyn-lm` folded here)

Implement a small decoder-only transformer you can explain line by line:

- tokenizer
- embeddings
- causal self-attention
- RoPE
- RMSNorm
- GQA
- SwiGLU
- residual blocks
- KV cache
- output head
- sampling

Then:

```text
pretrain small model
  ↓
SFT
  ↓
LoRA / QLoRA
  ↓
quantize
  ↓
serve
  ↓
benchmark against a comparable open model
```

The goal is not frontier performance. The goal is architectural comprehension plus integration into the same registry/deployment/monitoring path as every other model.

## Required failure drills

- bad feature release
- model registry points to wrong artifact
- GPU pod death
- inference OOM
- drift threshold exceeded
- bad canary
- rollback
- training job interrupted and resumed

## Blog target

**From Notebook to Production: Building an ML Platform with Training, Deployment, Drift and GPU Inference**

---

# Project 4 — Autonomous Software Engineering Platform

## Goal

Build an agentic engineering system that takes a GitHub issue, understands a repository, proposes a plan, edits code in an isolated environment, executes validation, receives review feedback, and opens a tested PR.

**Primary hiring signal:** Applied AI / Agentic Systems / Forward-Deployed AI / AI Software Engineer.

## Core flow

```text
GitHub issue
    ↓
webhook / intake
    ↓
repo indexer
    ↓
AST + symbol + semantic search
    ↓
planner
    ↓
coding workers
    ↓
Docker sandbox
    ↓
tests + lint + typecheck + security scan
    ↓
review agent
    ↓
PR
```

## Required stack

- Python
- GitHub API + webhooks
- tree-sitter
- LSP where useful
- Postgres
- Redis
- Kafka/queue
- embeddings + lexical code search
- MCP/tool interfaces
- Anthropic/OpenAI/local model routing
- Docker sandboxing
- Kubernetes for worker isolation/scale experiment
- GitHub Actions
- OpenTelemetry

## Required capabilities

- incremental repository indexing
- file/symbol/AST retrieval
- semantic + lexical retrieval
- dependency/context construction
- task decomposition
- parallel agent execution
- tool permissions
- isolated execution
- test execution
- linting/type checking
- vulnerability scanning
- diff summarization
- reviewer feedback loop
- token/time budgets
- approval gates
- PR creation
- telemetry

## Evaluation

Use a mix of small real OSS issues and SWE-bench-style tasks.

Compare:

- single coding agent
- planner + worker
- planner + worker + reviewer

Measure:

- issue resolution rate
- tests passed
- compilation/typecheck success
- regressions
- iterations/task
- tokens/task
- dollars/task
- wall-clock/task
- retrieval hit quality

## Required failure drills

- poisoned repository instruction
- test hangs
- sandbox resource exhaustion
- invalid patch
- reviewer loops indefinitely
- GitHub API failure
- duplicate webhook delivery

## Blog target

**Can an Agent Reliably Fix Software? Building and Evaluating an Autonomous Coding System**

---

# 12-week execution cadence

Each project gets three weeks. Do not force artificial completion at seven days.

## Week A — Functional vertical slice

Ship the smallest end-to-end path that genuinely works.

Required:
- architecture sketch
- local environment
- core API/data/model path
- basic tests
- baseline benchmark
- first ADRs
- first `BLOG.md` entries
- first `INTERVIEW.md` answers

## Week B — Productionization

Add the systems behavior employers care about.

Required:
- auth/security where applicable
- asynchronous/durable execution
- observability
- retries/idempotency
- CI/CD
- infrastructure-as-code
- cloud deployment
- cost tracking
- load tests

## Week C — Break, benchmark, explain, publish

Required:
- failure drills
- postmortems
- final benchmark matrix
- architecture alternatives
- 10× scale discussion
- security review
- polished public demo
- recruiter-friendly README
- complete `INTERVIEW.md`
- first publishable draft of `BLOG.md`

Do not move on because the calendar says so if the project cannot yet be defended. Move on when the core proof is complete; explicitly defer low-value polish.

---

# Cross-project skill coverage

The overlap is deliberate. Repeated use is how the stack becomes fluent rather than memorized.

## Software/backend

Python · Go · TypeScript · FastAPI · REST · SSE/WebSockets · asyncio · Pydantic · SQL · Postgres · Redis

## Cloud/infrastructure

AWS · Docker · Kubernetes · EKS · Terraform · GitHub Actions · ArgoCD · IAM · OIDC

## Distributed systems

Kafka · queues · event-driven design · retries · backoff · idempotency · DLQs · circuit breakers · rate limiting · caching

## AI engineering

OpenAI/Anthropic · tool calling · structured outputs · agents · LangGraph · MCP · RAG · embeddings · reranking · memory · guardrails · evals

## ML engineering

PyTorch · scikit-learn · XGBoost · LightGBM · MLflow · feature pipelines · training/serving skew · model registry · drift · retraining

## Data engineering

Spark · Delta · dbt · Dagster/Airflow · Kafka · Postgres · OpenSearch · pgvector · quality gates · lineage

## Inference

vLLM · Triton · ONNX Runtime · TensorRT · quantization · batching · GPU utilization

## Production discipline

tests · CI/CD · observability · OpenTelemetry · Prometheus · Grafana · security · load testing · SLOs · incident response · cost analysis

---

# Recruiter-facing completion gate

A project is not portfolio-ready until it has all of the following:

- live demo or reproducible local demo
- architecture diagram
- quantified result above the fold
- baseline comparison
- tests passing in CI
- deployment/infrastructure story
- meaningful observability screenshots/data
- at least three ADRs with real alternatives
- at least three failure drills with postmortems
- cost discussion
- security/threat discussion
- 10× scaling discussion
- completed `INTERVIEW.md`
- publishable `BLOG.md`

The README opens with:

1. the problem
2. a GIF/screenshot/live link
3. the quantified result
4. the architecture
5. the most interesting decisions

A recruiter should understand why the project matters in under 60 seconds. An engineer should be able to drill into it for an hour.

---

# Application strategy while building

Do **not** wait twelve weeks to apply.

- Project 1 deployed + documented: add it to résumé/site immediately.
- Project 2 complete: strengthen applications to data/AI platform roles.
- Project 3 complete: aggressively target MLE/ML platform roles.
- Project 4 complete: add stronger Applied AI/FDE/agentic roles.

Portfolio work and applications run in parallel.

The purpose of these projects is not to pretend you already have years of production ownership. It is to create concrete evidence that you can reason about, build, operate, measure, and explain production systems end to end.