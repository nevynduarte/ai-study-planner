# agent-platform — understand it before you build it

## What it is, in plain words

A website where a company's employees type a question like *"Should we buy 8307 Garcreek Cir? Give me a memo with the numbers and the risks."* The system does not just call Claude once. It **plans** the work, **looks things up** in documents and a database, **does the math**, asks a human to **approve** anything risky (like sending an email), and hands back a memo where **every number has a footnote** pointing at the source.

Because it is for companies, it is **multi-tenant**: Acme's users can never see Globex's documents, even by accident, even if the code has a bug. And because it runs for real, every step is **recorded** (who asked, which tools ran, how many tokens it cost) so you can debug it, bill for it, and prove it works.

That is what "production agentic AI platform" means. Nothing more mysterious than that.

## Why employers care

Every Austin role you are targeting (HackerOne, Linkt, PressW, LangChain, Databricks FDE) says some version of: *"ship LLM systems to real users, with evals, observability, and guardrails, not prototypes."* This project is the evidence. The words they screen for are all in here: agents, tool use, MCP, RAG, structured outputs, multi-tenancy, RBAC, Kafka, idempotency, tracing, evals, cost per request.

## The picture

```
 Browser (Next.js)          You log in (Keycloak gives you a token that says:
      │                     "this is nevyn, tenant=acme, role=analyst")
      ▼
 ┌─────────────┐  1. checks the token, rate-limits per tenant, adds a request id
 │ Go gateway  │
 └──────┬──────┘
        ▼
 ┌─────────────┐  2. POST /runs  → writes a "RunRequested" event, returns run_id
 │ FastAPI api │     GET /runs/{id}/stream → streams progress back to the browser
 └──────┬──────┘
        ▼
 ┌─────────────┐  3. the queue. Events sit here until a worker picks them up.
 │   Kafka     │     Also the *record* of everything that happened to a run.
 └──────┬──────┘
        ▼
 ┌─────────────┐  4. the agent loop lives here, not in the API.
 │   Worker    │     planner → picks tools → calls Claude → repeats → memo
 └──┬───┬───┬──┘
    │   │   │        5. tools (exposed over MCP so any agent can use them)
    │   │   └────► calc            (safe arithmetic)
    │   └────────► sql_query       (read-only SQL on parcels/permits)
    └────────────► search_docs     (hybrid search over chunks)
                        │
                        ▼
 ┌────────────────────────────┐  6. one Postgres. Tables all carry tenant_id.
 │ Postgres + pgvector        │     Row-level security = the DB itself refuses
 │ tenants users documents    │     to return another tenant's rows.
 │ chunks(embedding, tsv)     │
 │ parcels permits runs audit │
 └────────────────────────────┘
 ┌─────────────┐  7. Redis: rate-limit counters, semantic cache, hot state
 │   Redis     │
 └─────────────┘
 ┌─────────────────────────────────┐  8. every span (API call, Kafka hop, tool call,
 │ OpenTelemetry → Tempo/Grafana   │     Claude call with tokens + $) lands here.
 │ Arize Phoenix for LLM traces    │     One run = one trace you can click through.
 └─────────────────────────────────┘
```

## Follow one request through the system

1. **You type a question and press Submit.** The browser sends `POST /runs` with your token.
2. **The Go gateway** verifies the token's signature, reads `tenant=acme`, checks Acme has not exceeded its requests-per-minute, stamps a `request_id`, forwards to FastAPI.
3. **FastAPI** does almost nothing: it inserts a `runs` row (status=queued), writes a `RunRequested` event to Kafka, and returns `{run_id}` in under 50 ms. The browser then opens `/runs/{id}/stream` and waits.
4. **A worker** consumes `RunRequested`. It sets `SET LOCAL app.tenant = 'acme'` on its DB connection so row-level security is active, then starts the agent loop.
5. **The planner agent** (Claude, with a system prompt from `prompts/planner.yaml`) turns the question into a small plan: *look up the parcel → pull last two years of appraisals → compute % change → search docs for flood/zoning risk → write memo.*
6. **Each step is a tool call.** `sql_query` runs a `SELECT` on `parcels` as a read-only DB role with a 5-second timeout. `search_docs` runs BM25 and vector search over `chunks`, fuses the rankings, reranks the top 30, returns 8 chunks with ids. `calc` evaluates `(412000-380000)/380000`. Every tool call emits a `StepFinished` event to Kafka; the API relays it to your browser, so you watch it happen.
7. **If a step needs approval** (`send_email`), the worker emits `ApprovalRequested` and stops. The browser shows an Approve button. When you click it, the worker resumes from the event log. If the worker crashed in between, a new worker rebuilds the state from the events and continues.
8. **The report agent** writes the memo as a structured object (`Answer{answer, citations:[chunk ids], confidence}`), which is validated against a Pydantic schema. If a citation id does not exist, the run fails loudly instead of inventing sources.
9. **Everything is recorded.** The `audit` table has one row per tool call. The trace in Grafana shows gateway → API → Kafka → worker → each tool → each Claude call, with tokens and dollars on each span. The tenant's monthly token budget is decremented.

## The tools, and why each one is here

| Tool | What it is | Why it is in this project | What you could use instead |
|------|------------|---------------------------|----------------------------|
| **FastAPI** | Python web framework | Fast to write, typed with Pydantic, async, auto-generates API docs | Flask, Django, Go net/http |
| **Pydantic** | Data validation | Forces Claude's output into a schema you can trust | Marshmallow, raw dicts (don't) |
| **Go gateway (chi)** | Small compiled HTTP service in front of the API | Jobs ask for a typed second language; a gateway is the natural place for auth + rate limiting because it is fast and simple | Nginx/Envoy, or do it all in FastAPI |
| **Anthropic SDK** | Direct calls to Claude | You understand the loop when you write it yourself | LangGraph (you add it Day 6 to compare) |
| **LangGraph** | Agent-graph framework | To have a real opinion about frameworks vs. hand-rolled | CrewAI, AutoGen |
| **MCP** | Model Context Protocol, a standard way to expose tools to any agent | Tools become reusable across your five projects and by other people's agents | Hard-coded Python functions |
| **Postgres** | Relational database | One store for everything; transactions; row-level security for tenants | MySQL, DynamoDB |
| **pgvector** | Postgres extension for vector similarity search | Keeps embeddings next to the rows they belong to; no second database | Qdrant, Pinecone, OpenSearch (you benchmark on Day 12 of Week 2) |
| **Redis** | In-memory key-value store | Rate-limit counters and a cache need sub-millisecond reads | Memcached |
| **Kafka (Redpanda)** | Append-only event log / queue | Decouples "accept the request" from "do the work"; the log doubles as the run's history so crashes are recoverable | SQS, Redis Streams, Celery on RabbitMQ |
| **Keycloak → Cognito** | Identity provider (login, tokens) | You must not write your own auth; these issue signed JWTs with tenant and role claims | Auth0, Okta |
| **Row-level security** | Postgres feature: policies decide which rows a session can see | Tenant isolation enforced by the database, not by remembering `WHERE tenant_id=` everywhere | App-level filters (weaker) |
| **OpenTelemetry** | Standard for traces/metrics/logs | One trace across gateway, API, Kafka, worker, tools | Vendor SDKs (Datadog) |
| **Tempo + Prometheus + Grafana** | Trace store, metrics store, dashboards | Open source, runs in Docker Compose | Datadog, Honeycomb |
| **Arize Phoenix** | LLM-specific tracing and evals UI | Shows prompts, completions, tokens per span | LangSmith |
| **bge-small / bge-reranker** | Embedding model and cross-encoder reranker (run locally on CPU) | Free, fast, good enough; reranking is the single biggest retrieval quality win | OpenAI embeddings, Cohere rerank |
| **Docker Compose** | Runs all services locally with one command | Reproducibility; a stranger can run it | Running each service by hand |
| **Fly.io → EKS** | Hosting | Fly first because it is one command; EKS in Week 3 because jobs ask for Kubernetes | Render, Railway, ECS |
| **Next.js** | React framework | One page: login, ask, watch steps, approve, read memo | Plain React + Vite |

## What the week produces

By Day 7 you have a public URL where a stranger can log in as a demo tenant, ask a question, watch the agent work step by step, approve an action, and read a cited memo. The repo has a benchmark table (retrieval quality by method, judge agreement, cost per run) and seven Architecture Decision Records explaining why each major choice was made. Three applications go out with that URL.

## Words you will hear this week

- **Agent loop**: call the model → it asks for a tool → run the tool → give the result back → repeat until it answers.
- **Tool use / function calling**: the model returns JSON saying "call `sql_query` with this SQL" instead of prose.
- **Structured output**: forcing the model to return a specific JSON shape (via a tool schema) so code can rely on it.
- **RAG**: retrieval-augmented generation. Find relevant text first, then let the model answer from it with citations.
- **BM25**: classic keyword search scoring. Great for exact names and numbers.
- **Embedding / vector search**: turn text into a list of numbers; similar meaning → nearby vectors. Great for paraphrases, bad for exact IDs.
- **Hybrid + RRF**: run both, merge the rankings (reciprocal rank fusion). Usually beats either alone.
- **Reranker**: a slower, smarter model that re-scores the top 30 candidates. Big quality jump for small latency cost.
- **Event sourcing**: the list of events *is* the state. Rebuild current state by replaying them.
- **Idempotency**: doing the same thing twice has the same effect as once. Needed because queues redeliver.
- **Dead-letter queue (DLQ)**: where messages go after they fail too many times, so a human can look.
- **Circuit breaker**: stop calling a failing dependency for a while instead of hammering it.
- **Multi-tenancy / RLS / RBAC**: many customers on one system / the database hides other tenants' rows / roles decide who can do what.
- **Span / trace**: one timed operation / the tree of spans for one request.
- **ADR**: Architecture Decision Record. One page: context, options, decision, tradeoff, evidence.

## The day-by-day in one line each

1. Skeleton runs: API answers `/health` after really pinging Postgres and Redis. ✅
2. Data + tenancy: schema with `tenant_id` everywhere, load parcels/permits, chunk PDFs, embed them.
3. Retrieval + agent: three search modes, reranker, four tools, the agent loop, structured cited answers.
4. Durable workflows: Kafka events, worker, streaming, retries, budgets, DLQ, approval gate; kill the worker and watch it resume.
5. Auth + isolation: Keycloak tokens, row-level security, RBAC tests, Go gateway, audit log, quotas, threat model.
6. MCP + routing + UI: tools over MCP, model router with cache, LangGraph comparison, Next.js front end.
7. Prove it and ship: evals with numbers, guardrails, tracing dashboards, deploy, README, first three applications.
