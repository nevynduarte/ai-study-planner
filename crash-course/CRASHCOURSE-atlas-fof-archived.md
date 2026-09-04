# 3-Week Project-First Sprint

**Priority order, decided 2026-08-31: the project comes first, every day.**
One project, three weeks. The project is **`atlas-fof`**. Weeks 1–2 build it
(interview-ready); Week 3 ships it publicly (portfolio flagship: deployed,
benchmarked, documented, on GitHub pinned + website case study). Each day =
one small build step + one short drill + something that runs.

LeetCode is a fixed side-dish, never the main course: **one problem, 25 min
on a timer, 3×/week (Mon/Wed/Fri), from the LeetCode 150 practice bank** — in
the drill slot on those days. If the timer runs out, read the solution, write
one sentence on the trick, move on. It never eats build time.

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
| 6 | RAG `/ask`: contextual-retrieval chunks + **structured output** (`instructor`) + citations | structured outputs (the #1 pattern) | typed answers cite sources |
| 7 | Hybrid + rerank + numeric guardrail; week review | RAG hardening | guardrail catches a wrong number |

## Week 2 — Full-stack + design + proof
| Day | Build | Drill | Done when |
|----|----|----|----|
| 8 | Next.js fund browser (Server Components) | SSR vs client | browse funds in browser |
| 9 | Q&A panel (Client) wired to `/ask` | full vertical slice | browser→API→gold works |
| 10 | Multi-tenancy: `tenant_id` row scoping | RBAC reasoning | 2 partners, disjoint funds |
| 11 | System-design doc: Aaru "ingest 100TB panel" | pipeline design out loud | 1 page + diagram |
| 12 | System-design doc: Equi RAG + white-label | RAG design out loud | 1 page + diagram |
| 13 | **3-layer evals** (offline CI / online / human) + faithfulness check; lineage | calibrate LLM-judge to humans | eval prints numbers; judge ≥80% agree |
| 14 | Polish + record yourself narrating both | behavioral story bank | demoable repo + crisp story |

## Week 3 — Ship it (portfolio flagship)
This is the week that turns "interview project" into "public proof." Standards
from the portfolio review: deployed, benchmarked, documented — one excellent
repo beats five half-finished ones.

| Day | Ship step | Done when |
|----|----|----|
| 15 | Split/clean `atlas-fof` into its own public repo; Dockerfile + `docker-compose up` works from scratch | fresh clone runs in ≤3 commands |
| 16 | GitHub Actions CI: lint + tests + the offline eval suite as a gate | green badge on the README |
| 17 | Eval numbers as the headline: retrieval ablation (naive vector vs hybrid vs hybrid+rerank), Recall@K / faithfulness / latency table in `BENCHMARKS.md` | one table a hiring manager quotes back to you |
| 18 | `README.md` (problem → architecture → demo → numbers → decisions) + `ARCHITECTURE.md` with diagram | a stranger gets it in 90 seconds |
| 19 | Deploy the live demo (Worker/Fly/Railway — cheapest thing that stays up) + seed data | public URL works from your phone |
| 20 | 90–120s demo video + website case study page (problem/system/results/demo/repo) | case study live on your site |
| 21 | Pin the repo, update résumé + LinkedIn bullet with the real numbers, **send first applications** | ≥3 applications out |

## Daily rhythm (decide once, ~3 hrs)
- 15 min — read the day's row + recall yesterday
- ~2 hr — **build the one deliverable (this always happens first and never gets skipped)**
- 30 min — the drill (Mon/Wed/Fri: one LeetCode 150 problem, 25-min timer; other days: the row's drill), logged
- 15 min — write 3 sentences: "In an interview I'd describe today's work as…"

## Start here (restarted 2026-08-31 — Day 1 is today, no guilt about June)
Day 1 is stubbed and already runs: see `pipeline/DAY1.md` and `pipeline/ingest.py`.
```
python pipeline/ingest.py
```
