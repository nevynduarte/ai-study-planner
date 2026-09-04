# The Portfolio Build — 5 production platforms in 5 weeks

**Decided 2026-09-03.** Replaces the atlas-fof crash course. One project per
week, in the portfolio review's order. Every row names the files you create,
the command you run, and the output you must see. If a row is not startable
in 60 seconds, the row is the bug.

**What "5 weeks" assumes:** 6–8 focused hours a day, and Claude Code writes most
of the boilerplate while you make and defend the decisions. Your job each day is
the ADR, the benchmark, the failure log, and being able to explain it. If a day
runs over, the next day's row starts anyway; unfinished items go to that week's
Day 7 buffer, never into the next week.

| Week | Repo | What it proves |
|------|------|----------------|
| 1 | `agent-platform` | Multi-tenant agentic AI platform: RBAC, MCP, Kafka workers, approval gates, evals, OTel, deployed |
| 2 | `data-platform` | Kafka → Spark/Delta → bronze/silver/gold → millions of chunks, hybrid + rerank, benchmarked |
| 3 | `ml-platform` | Terraform/EKS/ArgoCD shared platform; train → registry → GPU inference (Triton/ONNX/TensorRT/vLLM) → drift → retrain |
| 4 | `autonomous-swe` | GitHub issue → sandboxed, tested PR, SWE-bench numbers |
| 5 | `nevyn-lm` | Transformer from scratch → train on your GPUs → SFT/LoRA → serve, then wire all five together |

They connect: #2 is #1's retrieval backend, #3 serves local models into #1's
router, #4 is an agent inside #1, #5 is a model in #3.

## Fixed rules
- **LeetCode stays capped:** one LeetCode 150 problem, 25-min timer, Mon/Wed/Fri.
- **Applications:** 3+ per week from the list at the bottom, starting Day 7 with the live URL.
- **Every choice gets an ADR** (template at bottom), every failure a `FAILURES.md` line. This trains the tradeoff-defense weakness and is core work, not polish.
- **Every repo ships with:** `README.md` (problem → architecture → demo → numbers → decisions), `ARCHITECTURE.md`, `BENCHMARKS.md`, `FAILURES.md`, `docs/adrs/`, `docker-compose.yml`, `.github/workflows/ci.yml`, `tests/`.
- **Cost guard:** EKS exists from Day 15; `terraform destroy` every night you are not demoing. Ceiling $150/month, actuals in `COST.md`.
- **Corpus:** Travis CAD appraisal roll CSV (traviscad.org → Data Downloads), City of Austin permits CSV (data.austintexas.gov), 50+ PDFs you collect (neighborhood plans, housing reports), SEC EDGAR 10-K PDFs for the company workflow. Broken download → EDGAR only, keep moving.

---

## Week 1 — `agent-platform` (Days 1–7)

**One sentence:** a multi-tenant AI due-diligence analyst. A tenant's users give
it a property address, company, or document set; planner and specialist agents
retrieve, run SQL, call tools over MCP, calculate, and produce an evidence-backed
memo, with approval gates, audit trail, evals, traces, and cost per tenant.

**Stack:** Python 3.12 · FastAPI · Pydantic v2 · Go gateway (`chi`) · Anthropic SDK runtime + LangGraph adapter · MCP · Postgres 16 + pgvector (RLS) · Redis · Kafka (Redpanda local, Upstash/MSK cloud) · Keycloak OIDC → Cognito later · OpenTelemetry → Tempo/Prometheus/Grafana · Arize Phoenix · Next.js 15 · Docker Compose · GitHub Actions · Fly.io (Day 7) → EKS (Day 15).

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 1 ✅ | Repo, compose (pgvector, redis, api), `api/main.py` `GET /health` pinging both, Dockerfile. | `docker compose up --build && curl localhost:8000/health` | `{"db":"ok","redis":"ok"}`. Done 2026-09-03. |
| 2 | **Data + tenancy.** `db/migrations/001_init.sql`: `tenants`, `users(tenant_id, role)`, `documents`, `chunks(tenant_id, embedding vector(384), tsv)`, `runs`, `audit`; `scripts/migrate.py` idempotent. `ingest/download.py` + `ingest/load_tabular.py` (TCAD + permits → `parcels`, `permits`). `ingest/pdf.py` (800-token chunks, unique `(document_id, ord)`). `ingest/embed.py` (`bge-small-en-v1.5`, batch 64) + `002_hnsw.sql`. First `BENCHMARKS.md` table: chunks/sec. | `python scripts/migrate.py && python ingest/download.py && python ingest/load_tabular.py && python ingest/pdf.py data/pdfs --tenant demo && python ingest/embed.py` | `parcels` > 100k rows, `chunks` > 500, 0 null embeddings, reruns add 0. |
| 3 | **Retrieval + agent runtime.** `retrieval/{vector,bm25,hybrid}.py` (RRF k=60, all tenant-filtered), `retrieval/rerank.py` (`bge-reranker-base`). `agent/tools.py`: `search_docs`, `sql_query` (read-only role, 5s timeout, SELECT only), `calc` (safe `ast`), `fetch_url` (allowlist), `send_email` (`requires_approval`). `agent/runtime.py`: tool loop, max 12 steps, forced-schema `Answer{answer, citations, confidence}`. `agents/*.yaml` (planner, research, sql, finance, report) with allowed tools; `prompts/*.yaml` versioned. ADR-001 `pgvector-vs-qdrant-vs-opensearch` ("evidence: Day 12"). | `python -m agent.runtime --tenant demo "Median appraised value on Garcreek Cir and change vs last year?"` | Trace shows `sql_query` → `calc` → cited answer; every citation id exists. |
| 4 | **Durable workflows on Kafka.** Redpanda in compose. `events/schema.py` (`RunRequested`, `StepStarted/Finished`, `ApprovalRequested`, `RunFinished`, all carry `tenant_id`, `run_id`). `worker/main.py` consumes `runs.requested`, emits to `runs.events`, commits offsets after `RunFinished`, idempotent per `(run_id, step_no)`. `POST /runs` (idempotency key), `GET /runs/{id}` (state from events), `GET /runs/{id}/stream` SSE, `POST /runs/{id}/approve`. `tenacity` backoff, token budget 200k, step timeout 60s, circuit breaker, `runs.dlq` + `GET /admin/dlq` + retry. Planner/executor with parallel independent nodes (asyncio). | `docker compose up`; POST; `rpk topic consume runs.events`; then `docker compose kill worker && docker compose up worker` mid-run | Steps stream live; killed run resumes from last finished step with no duplicate side effects; approval pauses and resumes. `FAILURES.md` #1. ADR-002 `event-sourced-runs`, ADR-003 `kafka-vs-sqs-vs-redis-streams`. |
| 5 | **Auth, RLS, RBAC, gateway, audit.** Keycloak in compose (realm, tenants `acme`/`globex` as groups, roles viewer/analyst/admin); `api/auth.py` JWKS validation. Postgres row-level security keyed on `current_setting('app.tenant')` set per request. `api/rbac.py` + `tests/test_rbac.py` (3 roles × 6 endpoints) + `tests/test_tenant_isolation.py`. Go gateway `gateway/`: JWT check, per-tenant Redis token bucket, request id, SSE passthrough. Audit row per mutation and tool call. Per-tenant monthly token quota + `GET /tenants/{id}/usage`. `docs/threat-model.md` (10 threats → test or Day). | `pytest tests/ && go test ./gateway/...` | Isolation and RBAC tests green; acme cannot see globex via any endpoint or raw SQL as app role; 429 at the limit; ADR-004 `go-gateway-vs-fastapi-only`. |
| 6 | **MCP, routing, LangGraph, UI.** `mcp_server/` exposing the tools (stdio + streamable HTTP); runtime becomes an MCP client via `mcp.json`, plus one third-party MCP server. `llm/router.py` (Haiku for extraction, frontier for planning/memo, `local` slot reserved for Week 3) + Redis semantic cache. `agent/langgraph_runtime.py` same graph; `evals/compare_topology.py` on 10 questions: single vs planner/executor vs LangGraph (latency, tokens, your 1–5 quality). `web/` Next.js: Keycloak login, question, live steps, citation drawers, approve button, usage page → Vercel. | `npx @modelcontextprotocol/inspector`; `python evals/compare_topology.py --all`; `npm run dev` | Tools callable over MCP; comparison table in `BENCHMARKS.md`; ADR-005 `mcp-vs-hardcoded-tools`, ADR-006 `custom-runtime-vs-langgraph`; full flow works in a browser. |
| 7 | **Evals, guardrails, OTel, deploy, ship.** `evals/questions.jsonl` (60, tagged lookup/sql/multi-step/unanswerable, with `expected_chunk_ids`); `evals/retrieval.py` (Recall@5/10, MRR, NDCG, P95 for vector/bm25/hybrid/hybrid+rerank); `evals/answer.py` LLM-judge correctness + faithfulness, `evals/human.csv` on 20, agreement ≥ 0.8, abstention on unanswerables ≥ 90%. Guardrails: injection scan with 20 poisoned chunks, SSRF allowlist, PII redaction, per-agent tool permissions; `SECURITY.md`. OTel across gateway → api → kafka → worker, span attrs `model/tokens/cost_usd/tenant_id`; Tempo/Prom/Grafana/Phoenix in compose; alerts DLQ>5, P95>30s. CI gate on Recall@10 baseline. `fly deploy` (api, worker, gateway, Postgres, Upstash Redis + Kafka). README/ARCHITECTURE/COST. **Applications 1–3** (HackerOne, PressW, Linkt). | `python evals/retrieval.py --modes all && python evals/answer.py && pytest tests/security && fly deploy` | Four-row retrieval table and judge table in `BENCHMARKS.md`; one run = one trace; public URL works from your phone; 3 applications logged in `applications.md`; `git tag v1.0`. |

---

## Week 2 — `data-platform` (Days 8–14)

**One sentence:** an enterprise ingestion + retrieval backbone that takes streams
and files of any type through bronze/silver/gold on Delta Lake and serves
hybrid search over millions of chunks, and becomes Week 1's `search_docs`.

**Stack:** Kafka (Redpanda) · PySpark structured streaming · Delta Lake · Dagster · MinIO (S3 API) · OpenSearch + pgvector (benchmarked) · `bge-reranker-base` · FastAPI · Docker Compose · GitHub Actions. Databricks Free edition for one notebook-based Spark UI comparison on Day 11.

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 8 | Repo. Compose: `redpanda`, `minio`, `spark-master`, `spark-worker`, `dagster`, `opensearch`, `db` (pgvector). `producers/{parcels,permits,edgar,pdf}.py` publish rows/files to topics `raw.parcels`, `raw.permits`, `raw.docs` (docs as S3 keys). `jobs/bronze.py`: Spark structured streaming → Delta `bronze/<topic>` on MinIO with checkpointing. | `docker compose up && python producers/parcels.py && spark-submit jobs/bronze.py` | `bronze/parcels` Delta table has > 100k rows; restart the job, it resumes from the checkpoint with 0 duplicates. |
| 9 | `jobs/silver.py`: typed schemas, dedup by natural key + `event_ts`, late events (watermark 1h) into `silver/*`; schema evolution with `mergeSchema`; quarantine table for bad rows with reason. `jobs/gold.py`: `gold/parcels_current`, `gold/permits_by_parcel`, `gold/doc_chunks` (parsing + 800-token chunking as a Spark UDF). Dagster assets + schedule wiring the three. Lineage visible in Dagster. | `dagster dev`; materialize all | Gold tables populated; add a column to a producer and rerun: silver evolves, nothing breaks; quarantine has rows with reasons. ADR-007 `delta-vs-parquet-vs-iceberg`. |
| 10 | `jobs/embed.py`: Spark batch embeddings (`bge-small`, mapPartitions, batch 256) → `gold/doc_chunks_emb`. Generate synthetic docs to reach **5M chunks**. Writers: `index/to_opensearch.py` (BM25 + kNN), `index/to_pgvector.py` (HNSW). Record indexing throughput and index build time for both. | `spark-submit jobs/embed.py && python index/to_opensearch.py && python index/to_pgvector.py` | 5M chunks in both stores; throughput table in `BENCHMARKS.md`. |
| 11 | `search/` FastAPI: `/search` with modes vector / bm25 / hybrid / hybrid+rerank / query-decomposition / HyDE, metadata filters, tenant filter. `evals/` 100 questions with expected chunks. Run all modes on both stores at 5M: Recall@10, MRR, NDCG, P50/P95, $/query estimate. Open the same gold table in Databricks Free, run one aggregation, compare the Spark UI plan with local. | `python evals/run.py --stores all --modes all` | Full matrix in `BENCHMARKS.md`. ADR-001 in Week 1 updated with this evidence and a switch threshold. ADR-008 `opensearch-vs-pgvector-at-5M`. |
| 12 | **Break it.** Drills, one hour each, postmortem each in `docs/postmortems/`: duplicate messages (producer re-sends 10%), kill a Spark worker mid-batch, backpressure (producer 10× faster than consumer), skewed key (one parcel with 1M events), corrupt Parquet file, schema change without `mergeSchema`. Measure at-least-once vs exactly-once (Delta idempotent writes with `txnAppId/txnVersion`). | Scripts in `drills/` | Six postmortems; at least three code changes; exactly-once proven with a count. |
| 13 | Repoint Week 1's `search_docs` MCP tool at this service; Week 1 evals rerun. Data-quality checks as Dagster asset checks (row counts, null rates, freshness) with alerts. OTel on the search API + Spark metrics into Prometheus; Grafana dashboard: lag, batch duration, rows/sec, P95 search. CI: unit tests for transforms with `chispa`, small end-to-end on a 1k-row fixture. | `python ../agent-platform/evals/retrieval.py` | Week 1 Recall@10 same or better; dashboard has data; CI green. |
| 14 | README/ARCHITECTURE/COST/SCALING (what changes at 100M chunks, 1TB/day). Demo video 90s. Case study page. `git tag v1.0`. **Applications 4–6** (Databricks FDE, PRIMUS, Homeward). Buffer for red items. | — | Everything linked from README; 3 applications logged. |

---

## Week 3 — `ml-platform` (Days 15–21)

**One sentence:** the shared Kubernetes platform (Terraform, EKS, ArgoCD) plus a
full ML lifecycle: features from Week 2 gold → training → registry → validation
gates → GPU inference on your own NVIDIA machines and AWS → drift → retrain,
with model routing back into Week 1.

**Stack:** Terraform · EKS (spot) + your local GPU machines joined as workers (k3s agent or `kubeadm join` over Tailscale) · Helm · ArgoCD + Argo Rollouts · KEDA · ECR · Secrets Manager · Cognito · MLflow · LightGBM/XGBoost · PyTorch · Ray Train · KServe with Triton · ONNX Runtime · TensorRT · vLLM · Evidently · Prometheus/Grafana.

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 15 | **Shared platform.** `platform/terraform/`: VPC, EKS (one spot `t3.medium` group), RDS pg16 (pgvector), ElastiCache, S3, ECR, Secrets Manager, Cognito, remote state (S3 + DynamoDB). `terraform apply`. Helm-install OTel collector, Prometheus, Grafana, KEDA, ArgoCD, Argo Rollouts. Join one local GPU machine as a node over Tailscale (label `gpu=true`), install NVIDIA device plugin. `COST.md` per-resource estimate. | `terraform apply && kubectl get nodes` | Cloud node + your GPU node both `Ready`; `nvidia-smi` runs in a pod on the GPU node. ADR-009 `eks-vs-ecs`, ADR-010 `hybrid-local-gpu-nodes`. |
| 16 | Helm charts for Week 1 (gateway, api, worker with KEDA on Kafka lag) and Week 2 (search API). ArgoCD app-of-apps on a `deploy/` directory; CI builds images to ECR and bumps values; Argo Rollouts canary 10→100% on the api. Cognito replaces Keycloak (OIDC config only). Migrate Fly → EKS; retire Fly. Runbooks: deploy, rollback, rotate secret, scale, drain DLQ, DB restore. | Merge a trivial PR | Rollout happens with no manual `kubectl`; rollback via Argo in < 2 min; Week 1 URL now on the ALB. |
| 17 | **ML lifecycle.** `ml-platform` repo. `features/build.py` from Week 2 gold (`parcels_current` + permits) → feature table in Delta. `train/{linear,lightgbm,xgboost,mlp}.py` for appraised-value and rent prediction, MLflow tracking (params, metrics, artifacts), `train/validate.py` gate (RMSE/MAE vs baseline, leakage check, feature-drift check) → registry promotion `staging`→`production`. Ray Train job on the cluster for the MLP. | `python train/lightgbm.py && python train/validate.py --promote` | MLflow shows 4 runs; one model in `production`; a deliberately leaked feature fails the gate. ADR-011 `boosting-vs-nn-tabular`. |
| 18 | **Serving.** KServe InferenceService for the LightGBM model (CPU) and a YOLOv11 + CLIP image pipeline on the GPU node via Triton (`models/` repo with `config.pbtxt`, dynamic batching). Export YOLO to ONNX and TensorRT. `serve/bench.py`: PyTorch eager vs `torch.compile` vs ONNX Runtime vs TensorRT at FP32/FP16/INT8, batch 1/8/32: throughput, P50/P95/P99, GPU util, VRAM. | `python serve/bench.py --all` | Benchmark matrix in `BENCHMARKS.md`; a one-sentence recommendation with a threshold. ADR-012 `triton-vs-kserve-raw-vs-fastapi`. |
| 19 | **Monitoring + retrain.** Evidently jobs comparing live inference inputs to training features (data drift) and rolling error vs delayed truth (concept drift) → Prometheus metrics → alert. `retrain/pipeline.py` triggered by the alert: retrain, validate gate, canary two versions with Argo Rollouts, auto-rollback if canary RMSE worse. `drills/inject_drift.py`. | `python drills/inject_drift.py` | Drift alert fires within 10 min; retrain runs; canary promoted or rolled back with logged numbers. Postmortem. |
| 20 | **Local LLM serving.** vLLM on the GPU node serving `Qwen2.5-7B-Instruct` (or the largest that fits) with an OpenAI-compatible endpoint; Prometheus metrics (tokens/s, TTFT, queue). Week 1 router `local` slot → this endpoint for extraction/classification; rerun Week 1 evals with `--router local`: cost and quality delta. `serve/llm_bench.py`: FP16 vs AWQ INT4, concurrency 1/8/32. | `python serve/llm_bench.py && python ../agent-platform/evals/answer.py --router local` | Cost-per-run row before/after in Week 1 `BENCHMARKS.md`; LLM benchmark table here. ADR-013 `vllm-vs-tgi-vs-ollama`. |
| 21 | Load test the serving path (k6, 100 rps); GPU node down drill; postmortems. README/ARCHITECTURE/COST/SCALING, demo video, case study. `git tag v1.0`. **Applications 7–9** (AMP, Apptronik, Evlo). `terraform destroy` if no demo tomorrow (re-apply Day 22 morning; keep it to one command). | — | Everything linked; 3 applications. |

---

## Week 4 — `autonomous-swe` (Days 22–28)

**One sentence:** a GitHub App that turns an issue into a tested pull request
using indexed code, planning, sandboxed execution, review, and budgets, measured
on SWE-bench, and registered as an agent inside Week 1.

**Stack:** GitHub App (webhooks, installation tokens) · tree-sitter + `pyright`/LSP · Postgres + pgvector (code index) · Kafka (from Week 1) · Docker-in-Kubernetes sandboxes (one Job per task, gVisor if available) · Anthropic SDK + Week 3 local model via router · MCP (exposes itself as a tool to Week 1).

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 22 | Repo. GitHub App (`webhook/` FastAPI receiving `issues.labeled` with label `agent`). `index/`: clone, tree-sitter symbol extraction (Python + TS), embeddings per symbol/file, incremental by commit SHA. `search/`: symbol lookup + semantic + import-graph neighbors. | Label an issue on a test repo | Webhook event logged; index for a 50k-line repo builds in < 5 min; `search "where is auth validated"` returns the right file. |
| 23 | `planner/`: issue → plan (`files_to_touch`, `tests_to_run`, `acceptance`). `sandbox/`: Kubernetes Job per task from a repo image, mounts the checkout, network off, 30-min limit. `coder/`: edit loop (apply diff → run tests → read failures → revise), max 8 iterations, token + $ budget. Lint + type check + `bandit` before PR. | `python run.py --issue <url>` | A real small issue (e.g. rename + test) produces a green PR. `FAILURES.md` entries for every loop that did not converge. |
| 24 | `reviewer/` agent: reads the diff, checks acceptance criteria, flags risk, posts a review comment; human approval gate before PR opens (reuse Week 1's approval event). Cost, tokens, iterations recorded per task in Postgres; Grafana panel. | Run 5 issues | 5 PRs with review comments and a cost per task on the dashboard. |
| 25 | **Benchmark.** SWE-bench Lite harness (`benchmarks/swebench.py`) on 100 tasks in parallel Jobs on the cluster. Report: resolved %, tests passed, iterations, tokens, $/task, wall time. | `python benchmarks/swebench.py --n 100` | Results table in `BENCHMARKS.md`. Publish the raw JSONL. |
| 26 | **Ablations** on the same 100: single agent vs planner/executor; full-file context vs retrieval; frontier vs local model for the coder; with vs without reviewer. | `python benchmarks/swebench.py --ablate all` | Ablation table; ADR-014 `agent-topology-for-code`, ADR-015 `retrieval-vs-full-context` with numbers. |
| 27 | Register as an MCP server so Week 1's planner can delegate `implement_change` tasks; Week 1 approval gate applies. Failure drills: sandbox OOM, flaky tests, repo with no tests. Postmortems. | Ask Week 1 "add a `/version` endpoint to agent-platform" | Week 1 opens a PR on itself through Week 4. |
| 28 | README/ARCHITECTURE/COST/SECURITY (sandbox threat model), demo video, case study. `git tag v1.0`. **Applications 10–12** (TTEC code agents, Fluidstack, LangChain). | — | 3 applications. |

---

## Week 5 — `nevyn-lm` + integration (Days 29–35)

**One sentence:** a GPT built from scratch, trained on your GPUs with the real
training stack, post-trained, served two ways and benchmarked, then plugged
into Week 3 and Week 1 so all five systems are one platform.

**Stack:** PyTorch · FlashAttention 2 · DDP across your local GPUs (FSDP if 2+ cards) · `sentencepiece` or your own BPE · W&B · bf16 · LoRA (`peft`) · DPO (`trl`) · vLLM · Triton · `lm-eval-harness`.

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 29 | Repo. `model/`: BPE tokenizer trained on the corpus; `Embedding`, RoPE, RMSNorm, GQA attention with causal mask + KV cache, SwiGLU MLP, residual blocks, tied LM head, sampling (temperature/top-p). `tests/`: each module vs a reference (HF Llama config at tiny size, max abs diff < 1e-4). | `pytest tests/` | All green. `docs/why.md` started: why RoPE, why RMSNorm, why GQA (one paragraph each, with the VRAM arithmetic). |
| 30 | `train/`: data loader over a public corpus (FineWeb-Edu sample, ~2B tokens), AdamW, cosine LR with warmup, grad accumulation, grad clipping, bf16 autocast, gradient checkpointing, DDP, checkpoint/resume, W&B. Launch a **125M** model. | `torchrun --nproc_per_node=N train/run.py --config configs/125m.yaml` | Loss curve in W&B; kill and resume once; `BENCHMARKS.md`: tokens/sec/GPU, MFU estimate, VRAM breakdown (weights/grads/optimizer/activations). |
| 31 | Training continues. Meanwhile `serve/own_server.py`: your inference server with KV cache, continuous batching, streaming. `serve/bench.py`: tokens/s, TTFT, P50/P95, VRAM at concurrency 1/8/32, FP16 vs INT8 (`torch.ao`/bitsandbytes). | `python serve/bench.py --server own` | Table. Explain compute-bound vs memory-bandwidth-bound with your own numbers. |
| 32 | Stop pretraining at the token budget. `lm-eval-harness` on a few tasks (sanity, not glory). `post/sft.py` on an instruction set (Alpaca-style, 20k) with LoRA; `post/dpo.py` on a preference set (UltraFeedback sample). Eval before/after on 50 held-out prompts with the Week 1 judge. | `python post/sft.py && python post/dpo.py && python evals/judge.py` | Before/after table; adapters saved as MLflow artifacts in Week 3's registry. |
| 33 | Serve the SFT/DPO model with **vLLM** (convert to HF format) and with Triton; rerun `serve/bench.py --server vllm` and compare to your server. Speculative decoding attempt with the 125M as draft for the 7B in Week 3 (record whether it helps). | `python serve/bench.py --all` | Three-way table (own / vLLM / Triton). ADR-016 `own-server-vs-vllm` with numbers. `docs/why.md` complete (KV cache at long context, FlashAttention, quantization effects, LR/batch stability observations). |
| 34 | **Integration.** Week 3 router registers `nevyn-lm` as a model; Week 1 router uses it for classification; Week 1 evals rerun with it. One end-to-end demo: login → question → Week 2 retrieval → Week 4 opens a PR → Week 3 serves local models → Week 5 model in the mix, one trace across all of it. Top-level `nevyn-ai-platform/README.md` with the ecosystem diagram linking the five repos. | Run the demo, record it | One trace spans all five systems. |
| 35 | Website: five case studies + platform overview. Résumé: every vague bullet replaced with a measured number. Pin the five repos. Mock interview on the six levels for each repo (10 min each, recorded); gaps into `FAILURES.md`. **Applications 13–15** (Visa, Expedia, Dayjob) and update every open application. `terraform destroy`. | — | 15+ applications sent over 5 weeks; all five repos tagged `v1.0`. |

---

## The six levels (every Day 7 recording)
1. What did you build? 2. How does it work, request by request? 3. Why this architecture? 4. Why not X? 5. What breaks at 10×? 6. How do you know? If the answer is "I think," run the experiment.

## ADR template (`docs/adrs/ADR-0NN-<slug>.md`)
```
# ADR-0NN: <decision>
Context / Requirements (3–5) / Options (one line each) / Decision (one sentence)
Why (two reasons) / Tradeoff / Evidence (BENCHMARKS.md row or "none yet, revisit Day N")
Would change if: <concrete condition>
```

## `FAILURES.md` line
`YYYY-MM-DD · tried X · saw Y (number if any) · changed to Z · result`

## Austin applications (job watch, 2026-09-03), 3+/week from Day 7
1. HackerOne — SWE, Applied AI ($166–203k) · 2. PressW — Sr Applied AI ($140–175k) · 3. Linkt — Applied AI ($100–200k+eq) · 4. Databricks — FDE ($153–210k) · 5. PRIMUS — AI/ML Data Eng ($150–200k) · 6. Homeward — Sr SWE Applied AI ($160k) · 7. AMP — MLE ($162–170k) · 8. Apptronik — Sr SWE ML Infra · 9. Evlo — MLE ($120–180k) · 10. TTEC — Code Agents ($135–155k) · 11. Fluidstack — SWE Applied AI ($173–250k) · 12. LangChain — Deployed Engineer ($150–215k) · 13. Visa — MLE Sr Consultant ($173–277k) · 14. Expedia — Enterprise AI Eng III ($117–187k) · 15. Dayjob — Founding FDE · plus the $100–140k band for the floor. Track in `applications.md`.

## Where you are
Day 1 done 2026-09-03 (`agent-platform` public, health green).
**Day 2 is next** (2026-09-04): data + tenancy in `agent-platform`.
