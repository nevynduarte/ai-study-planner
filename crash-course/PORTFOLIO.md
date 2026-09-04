# The Portfolio Build — 5 production systems, one at a time

**Decided 2026-09-03.** Replaces the atlas-fof crash course. The problem before was
never plan length; it was vague rows like "harmonize taxonomies → silver" that
could not be started because it was unclear what to type. Every row below names
the file you create, the command you run, and the output you must see. If a row
is not startable in 60 seconds, that row is the bug — fix the row, not yourself.

The five systems (from the portfolio review) in build order:

| # | Repo | What it proves | Roles it targets |
|---|------|----------------|------------------|
| 1 | `agent-platform` | Production RAG + agents: FastAPI, Postgres/pgvector, Redis workers, evals, OTel, deployed | HackerOne, Linkt, PressW, LangChain, Databricks FDE, Homeward |
| 2 | `ml-platform` | Train → registry → serve → monitor → drift → retrain | AMP, Evlo, Visa/PayPal MLE, Apptronik |
| 3 | `data-platform` | Kafka → Spark → bronze/silver/gold → features, with failure drills | Databricks, PRIMUS, data-heavy FDE |
| 4 | `autonomous-swe` | GitHub issue → tested PR, benchmarked | TTEC code agents, Fluidstack, agent startups |
| 5 | `nevyn-lm` | Transformer from scratch → train → serve on GPU with vLLM | AMD, Deepgram, ML-systems roles |

Only **#1 has full daily rows right now.** Rule: during the last week of each
project you write the daily rows for the next one (that is a scheduled task,
Day 24 below), so there is never a vague project waiting.

## Fixed rules (decide once)
- **~3 hours/day.** 2 hr build the day's row, 30 min drill, 15 min the log sentence. Rows are sized for that.
- **LeetCode stays capped:** one LeetCode 150 problem, 25-min timer, Mon/Wed/Fri, in the drill slot. Timer ends → read the solution, write one sentence, move on.
- **Applications start Day 8**, not after the project is done. Three per week minimum from the Austin list at the bottom. The live URL from Day 12 goes on every application after that.
- **Every architectural choice gets an ADR** (template at the bottom). Every failed attempt gets a `FAILURES.md` line. This is how "explain your tradeoffs" gets trained; it is not optional polish.
- **Stack is chosen, not debated.** Alternatives are benchmarked only where a row says to.
- **Not doing in Project 1:** Kubernetes, Terraform, Kafka, LangGraph, a custom frontend framework, training any model. Those live in Projects 2–5.

## Project 1 — `agent-platform` (Days 1–28)

**What it is, in one sentence:** an "Austin property due-diligence analyst." You give
it an address or a question; it retrieves from a corpus of Austin public records
and documents, runs tools (SQL, calculator, retrieval), and returns a cited
investment memo, with every step traced, evaluated, and costed.

**Stack (final):** Python 3.12 · FastAPI · Pydantic v2 · PostgreSQL 16 + pgvector ·
Redis 7 · `arq` workers · Anthropic SDK (direct, no framework) ·
`sentence-transformers` for embeddings (`BAAI/bge-small-en-v1.5`, runs on CPU) ·
`rank_bm25` · cross-encoder `BAAI/bge-reranker-base` · OpenTelemetry → Grafana Tempo + Prometheus (docker) ·
Next.js 15 (one page) · Docker Compose · GitHub Actions · Fly.io for deploy.

**Corpus (final):** Travis Central Appraisal District public appraisal roll export
(`traviscad.org` → Data Downloads → current-year appraisal roll CSV) for the
structured table, plus City of Austin open data portal (`data.austintexas.gov`)
"Issued Construction Permits" CSV, plus 50–100 PDFs you collect (neighborhood
plans, TCAD reports, Austin housing reports) for the unstructured side.
Fallback if a download is broken that day: use SEC EDGAR 10-K PDFs and keep
moving; the architecture does not care which documents it holds.

### Week 1 — Skeleton that runs end to end

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 1 | `mkdir agent-platform && cd agent-platform && git init`. Create `pyproject.toml` (uv), `docker-compose.yml` with services `db` (`pgvector/pgvector:pg16`), `redis` (`redis:7`), `api`. `api/main.py` with FastAPI `GET /health` returning `{"db": "ok", "redis": "ok"}` after actually pinging both. `Dockerfile` for api. | `docker compose up --build` then `curl localhost:8000/health` | Both say `ok`. First commit pushed to a public GitHub repo. |
| 2 | `db/migrations/001_init.sql`: tables `documents(id, source, title, uri, created_at)`, `chunks(id, document_id, ord, text, embedding vector(384), tsv tsvector)`, `runs(id, question, status, created_at)`. `api/db.py` using `psycopg` pool. `scripts/migrate.py` applies migrations in order and records them in `schema_migrations`. | `python scripts/migrate.py` twice | Second run prints `0 applied` (idempotent). `\dt` in psql shows 4 tables. |
| 3 | `ingest/download.py`: downloads the TCAD roll CSV and the permits CSV into `data/raw/` (skips if present). `ingest/load_tabular.py`: loads both into Postgres tables `parcels` and `permits` with `COPY`. | `python ingest/download.py && python ingest/load_tabular.py` | `SELECT count(*) FROM parcels` > 100,000. Log line prints row counts and elapsed seconds. |
| 4 | `ingest/pdf.py`: `pypdf` → text → chunks of ~800 tokens with 100 overlap (`tiktoken` to count). Writes `documents` + `chunks` rows, `tsv` via `to_tsvector('english', text)`. Put 20 PDFs in `data/pdfs/`. | `python ingest/pdf.py data/pdfs/` | `SELECT count(*) FROM chunks` > 500. Re-running does not duplicate (unique on `(document_id, ord)`). |
| 5 | `ingest/embed.py`: batch-embeds every chunk with null embedding using `bge-small`, batch size 64, writes back. Create HNSW index in migration `002_hnsw.sql`. | `python ingest/embed.py` | `SELECT count(*) FROM chunks WHERE embedding IS NULL` = 0. Time per 1k chunks written in `BENCHMARKS.md` (first table). |
| 6 | `retrieval/vector.py` (`<=>` cosine top-k), `retrieval/bm25.py` (Postgres `ts_rank` top-k), `retrieval/hybrid.py` (reciprocal rank fusion, k=60). `GET /search?q=&mode=vector|bm25|hybrid` returns chunks with scores. | `curl "localhost:8000/search?q=flood+plain+setback&mode=hybrid"` | Three modes return different rankings for the same query; you can say why in one sentence in the log. |
| 7 | `llm/answer.py`: Anthropic SDK, system prompt demands citations as `[chunk:id]`, structured output via a Pydantic `Answer{answer, citations: list[int], confidence}` using tool-use forced schema. `POST /ask {question}` → retrieve hybrid top-8 → answer. Week review: write ADR-001 `pgvector-vs-dedicated-vector-db`. | `curl -X POST localhost:8000/ask -d '{"question":"..."}'` | Answer JSON validates; every citation id exists in `chunks`. ADR-001 committed. |

### Week 2 — Agents, workers, deploy, first applications

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 8 | `agent/tools.py`: three tools with JSON schemas: `search_docs(query)`, `sql_query(sql)` (read-only role, statement timeout 5s, `SELECT` only), `calc(expression)` (safe `ast` evaluator). `agent/loop.py`: tool-use loop, max 10 steps, returns final `Answer` + `steps[]`. **Send application #1–3 tonight** (HackerOne, PressW, Linkt). | `python -m agent.loop "What is the median appraised value on Garcreek Cir and how did it change vs last year?"` | Trace shows `sql_query` then `calc` then final answer. 3 applications submitted, logged in `applications.md`. |
| 9 | Make `/ask` async: `POST /runs` inserts `runs` row, enqueues `arq` job; `GET /runs/{id}` returns status + result; `GET /runs/{id}/stream` SSE streams steps as they happen. `worker/main.py` runs the agent. Add `worker` service to compose. | `docker compose up`; POST then curl the stream | You watch steps arrive live in the terminal. API returns in <50 ms because the work is in the worker. |
| 10 | Reliability: retries with exponential backoff on Anthropic 429/529 (`tenacity`), per-run token budget (abort past 200k tokens), step timeout, idempotency key on `POST /runs` (same key → same run id). Write `FAILURES.md` entry #1 for whatever broke while testing this. | Force a 429 by setting `ANTHROPIC_API_KEY` to a bad key for one call | Retry log lines appear; run ends in `status=failed` with a reason, not a stack trace. Duplicate POST returns the same id. |
| 11 | Observability: OpenTelemetry SDK, FastAPI + psycopg + httpx instrumentation, custom spans per agent step with attributes `model`, `input_tokens`, `output_tokens`, `cost_usd`. Add `otel-collector`, `tempo`, `prometheus`, `grafana` to compose. | `docker compose up`; open `localhost:3000` | One run shows as one trace in Tempo with a span per tool call. A Grafana panel shows `cost_usd` per run. |
| 12 | **Deploy.** `fly launch` for api + worker (two process groups), Fly Postgres with pgvector, Upstash or Fly Redis. Secrets via `fly secrets set`. Load a 5k-chunk seed. | `fly deploy` then `curl https://<app>.fly.dev/health` | Public URL answers `/ask` from your phone. URL added to `README.md` and to every application from now on. |
| 13 | Next.js one-page UI in `web/`: textbox, submit → `POST /runs`, render streamed steps and final memo with citation links that open the chunk text. Deploy to Vercel or Fly static. | `npm run dev` then the deployed URL | A stranger can type a question and watch the agent work. |
| 14 | Week review. ADR-002 `arq-vs-celery-vs-temporal`, ADR-003 `direct-sdk-vs-langgraph`. Record yourself 5 min: "walk me through what happens when I press submit." | Listen to the recording | You can go API → queue → worker → tools → trace → DB without notes. 3 more applications sent. |

### Week 3 — Evals, hardening, numbers

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 15 | `evals/questions.jsonl`: 60 questions you write, each with `expected_chunk_ids` (retrieval truth) and `expected_answer` (short). Half are lookups, half need SQL. `evals/retrieval.py` computes Recall@5, Recall@10, MRR for vector, bm25, hybrid. | `python evals/retrieval.py` | A table prints. Paste it into `BENCHMARKS.md`. Hybrid should win; if it does not, that is a `FAILURES.md` entry and tomorrow's first hour. |
| 16 | `retrieval/rerank.py` with `bge-reranker-base` over hybrid top-30 → top-8. Re-run evals with `mode=hybrid+rerank`. Measure added latency (P50/P95 over the 60 questions). | `python evals/retrieval.py --modes all` | `BENCHMARKS.md` has the four-row table with Recall@10 and P95 ms. You can state the tradeoff in one sentence. |
| 17 | `evals/answer.py`: LLM-as-judge (Claude) scores correctness and faithfulness 0–1 against `expected_answer` and the cited chunks. Also `evals/human.csv`: you hand-score 20 of them. Compute judge/human agreement. | `python evals/answer.py` | Agreement ≥ 0.8, or you tune the judge prompt until it is. Numbers in `BENCHMARKS.md`. |
| 18 | Guardrails: prompt-injection scan on ingested chunks (regex + a small classifier prompt) with an `evals/injection/` set of 20 poisoned chunks; SQL tool blocks anything not `SELECT`; PII redaction on output (`presidio` or regex for SSN/phone). `SECURITY.md` lists each control and its test. | `pytest tests/security` | All 20 poisoned chunks flagged; a `DROP TABLE` attempt is refused with a logged event. |
| 19 | Model routing: `llm/router.py` sends `search_docs` summarization and simple lookups to Haiku, planning/final memo to the frontier model. Re-run the 60 evals; record cost per run before/after and quality delta. | `python evals/answer.py --router on` | `BENCHMARKS.md` gets a "cost per run" row: before, after, quality change. ADR-004 `model-routing`. |
| 20 | Load test: `k6` or `locust` script `loadtest/run.js` hitting `POST /runs` at 5, 20, 50 concurrent. Record P95, error rate, worker queue depth from Grafana. Fix the first thing that falls over (probably DB pool size). `FAILURES.md` entry. | `k6 run loadtest/run.js` | Table of concurrency vs P95 vs error rate in `BENCHMARKS.md`. One fix committed with a before/after number. |
| 21 | Failure drills (pick 3, one hour each): kill Redis mid-run; kill Postgres; make Anthropic return 529 for 2 minutes. For each write `docs/postmortems/00N.md`: what happened, what the user saw, what you changed. | `docker compose stop redis` during a run | Three postmortems. At least one produced a code change (e.g. run resumes after Redis returns). 3 more applications sent. |

### Week 4 — Ship it as a case study, then hand off to Project 2

| Day | Build (exact) | Run | Done when |
|-----|---------------|-----|-----------|
| 22 | GitHub Actions: `ci.yml` runs `ruff`, `pytest`, and `evals/retrieval.py` against a seeded test DB in a service container; fails if Recall@10 drops below the committed baseline. `cd.yml` deploys to Fly on `main`. | Open a PR with a deliberate retrieval regression | CI goes red on the regression, green after revert. Badges on README. |
| 23 | `README.md` in the order: one-line problem → architecture diagram (Mermaid) → live demo link → the benchmark table → 5 key decisions with ADR links → run locally in 3 commands. `ARCHITECTURE.md` with the request lifecycle and every service. | Send README to one friend | They can say what it does in 90 seconds without you talking. |
| 24 | **Write Project 2's daily rows** into this file (28 rows, same three columns, same concreteness bar). Also `COST.md`: monthly cost of running this at 100 and 10,000 runs/day. | Read every Project 2 row and ask "can I start this in 60 seconds?" | Any "no" gets rewritten today. |
| 25 | 90–120 s screen recording: question in, steps streaming, memo with citations, Grafana trace. Case-study page on your site: problem / system / numbers / demo / repo. | Publish the page | Page live. Link in README. |
| 26 | Résumé: replace the vaguest Bridges bullet with a numbers bullet from `BENCHMARKS.md`. LinkedIn same. Pin the repo. Update `applications.md` to link the case study for all open applications. | Reread résumé aloud | Every number on it is one you measured. |
| 27 | Mock interview from the six levels (below) on your own system, recorded, 45 min. List every question you could not answer at level 5 or 6. | Listen | Each gap is either an experiment you run today or a `FAILURES.md` line explaining why not. |
| 28 | Buffer day: finish anything red above. Then `git tag v1.0`. Start Project 2 Day 1 tomorrow. | `git tag v1.0 && git push --tags` | Tag exists. 12+ applications sent over the four weeks. |

## Projects 2–5 — milestones only (daily rows get written on each prior Day 24)

Each is 4 weeks. Same four-week shape: W1 skeleton that runs end to end, W2 the
hard core, W3 evals/benchmarks/failure drills, W4 ship + case study + write the
next project's rows.

**2. `ml-platform` (Austin property valuation + rent prediction).** Stack: PyTorch,
LightGBM, MLflow (tracking + registry), FastAPI serving, Evidently for drift,
Docker, Terraform + AWS ECS (Terraform enters here), GitHub Actions. Milestones:
W1 feature pipeline from the Project 1 `parcels` table + baseline linear model in
MLflow · W2 LightGBM + small NN, validation gate, registry promotion, online
`/predict` · W3 inject drift, detect it, auto-retrain job, canary two versions,
benchmark table · W4 deploy with Terraform, case study.

**3. `data-platform`.** Stack: Kafka (Redpanda in docker), PySpark, Delta Lake,
Dagster, S3 (MinIO locally), Terraform. Milestones: W1 Kafka producer from the
permits CSV → Spark structured streaming → bronze · W2 silver/gold with schema
evolution and late events · W3 break it: duplicate messages, worker death,
backpressure; exactly-once vs at-least-once measured · W4 feature/embedding
outputs feed Projects 1 and 2, case study.

**4. `autonomous-swe`.** Stack: GitHub App webhook, tree-sitter indexing, Docker
sandbox per task, Anthropic SDK, Postgres, Redis. Milestones: W1 issue → clone →
index → plan · W2 edit → run tests → iterate → open PR · W3 run 50 SWE-bench Lite
tasks, report resolved %, cost, iterations; single agent vs planner/executor ·
W4 case study.

**5. `nevyn-lm`.** Stack: PyTorch, FlashAttention, DDP on your local GPUs, W&B,
vLLM for serving, Prometheus. Milestones: W1 tokenizer + GPT with RoPE, RMSNorm,
GQA, SwiGLU, tests against a reference · W2 train ~125M params on a public
corpus with mixed precision and checkpoint/resume · W3 SFT + LoRA, then serve
with your own KV-cache server vs vLLM, benchmark tokens/s and P95 across FP16/INT8 ·
W4 plug into Project 1's router as a local model, case study.

## The six levels (use on every project, every Day 27)
1. What did you build?
2. How does it work, request by request?
3. Why this architecture?
4. Why not alternative X?
5. What breaks at 10× scale?
6. How do you know? (If the answer is "I think," go run the experiment.)

## ADR template (`docs/adrs/ADR-00N-<slug>.md`)
```
# ADR-00N: <decision>
Context: what forced a choice
Requirements: the 3–5 things that actually mattered
Options: A / B / C, one line each
Decision: which, in one sentence
Why: the two reasons that decided it
Tradeoff: what you gave up
Evidence: benchmark, link to BENCHMARKS.md row, or "none yet"
Would change if: the concrete condition
```

## `FAILURES.md` line format
`YYYY-MM-DD · tried X · saw Y (number if any) · changed to Z · result`

## Austin applications list (from the job watch, 2026-09-03)
Apply in this order, 3+/week, starting Day 8:
1. HackerOne — Software Engineer, Applied AI ($166–203k)
2. PressW — Senior Applied AI Engineer ($140–175k)
3. Linkt — Applied AI Engineer ($100–200k + equity)
4. Homeward — Senior SWE, Applied AI ($160k)
5. Databricks — AI Engineer, Forward Deployed ($153–210k)
6. Expedia — Enterprise AI Engineer III ($117–187k)
7. LangChain — Deployed Engineer ($150–215k, reach)
8. Fluidstack — SWE, Applied AI ($173–250k, reach)
9. Dayjob — Founding FDE (new grads ok)
10. AMP — ML Engineer ($162–170k) — after Project 2 starts
11. TTEC Digital — Conversational AI Engineer, Code Agents ($135–155k)
12. PRIMUS — AI/ML Data Engineer ($150–200k)
Plus the $100–140k band broadly (Apple entry ML, KLA, UT Austin) for the floor.
Track every one in `applications.md`: date, role, link, status, materials used.

## Start here (Day 1 is 2026-09-04)
```
mkdir agent-platform && cd agent-platform && git init
uv init && uv add fastapi uvicorn psycopg[binary,pool] redis
```
Then Day 1's row. Twenty minutes gets you to a running `/health`.
