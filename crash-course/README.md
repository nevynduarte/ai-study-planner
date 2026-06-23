# Atlas-FoF

A fund-of-funds data platform built with serious data-integration rigor — a
single project that doubles as deep interview prep for **two** roles:

- **Aaru — Software Engineer, Data Integration** → the ingestion/integration
  layer (entity resolution, schema harmonization, data-quality logging,
  medallion architecture, lineage).
- **Equi — Founding Engineer, Applied AI Lead** → the application/AI layer
  (FastAPI + Next.js, RAG-with-citations over fund documents, pgvector,
  multi-tenant white-label).

The seam between them — a **gold** layer of trusted, resolved fund/manager
entities that the app and RAG consume — is the highest-leverage system-design
talking point for both interviews.

> Investment data really is messy multi-source data. The same fund and manager
> show up under different IDs and names across a fund-admin feed, a manager
> self-report, and a third-party panel. Resolving that is the Aaru skill; serving
> it through a RAG app is the Equi skill. Same codebase, two narratives.

## Architecture

```
 3 messy "vendor" feeds          INTEGRATION (Aaru)              APP + AI (Equi)
 ┌────────────────────┐   ┌──────────────────────────────┐  ┌────────────────────┐
 │ admin_feed.csv     │   │ bronze: raw landing          │  │ FastAPI            │
 │ manager_report.json│──►│ silver: cleaned + harmonized │─►│  /funds /managers  │─► Next.js
 │ panel_thirdparty   │   │   ER: block→fuzzy→union-find │  │  /ask (RAG)        │   App Router
 └────────────────────┘   │ gold: trusted funds/managers │  │  pgvector+hybrid   │
 ┌────────────────────┐   │ quality_log + lineage        │  │  rerank+guardrail  │
 │ fund_documents.json│──►│ chunk + embed ──────────────►│  │  citations         │
 └────────────────────┘   └──────────────────────────────┘  └────────────────────┘
   Postgres + pgvector  •  bronze/silver/gold  •  GCP-ready (Cloud Run + Cloud SQL)
```

## Stack
Postgres + pgvector · Python (pandas + FastAPI/Pydantic) · TypeScript/Next.js
App Router · GCP deployment story (Cloud Run + Cloud SQL + Cloud Storage).

## Quickstart
```bash
# 1. Generate the synthetic messy universe (stdlib only — no install needed)
python pipeline/generate_data.py

# 2. (L1+) create a Postgres with pgvector and apply the schema
psql "$DATABASE_URL" -f schema.sql

# 3. install pipeline/backend deps when you reach L1/L2
pip install -r requirements.txt
```

## What the generator intentionally breaks (so L1 has real work)
- **Entity resolution:** same fund/manager under different IDs + name spellings
  (casing, whitespace, `LLC` suffixes, abbreviations like `Mgmt`/`Cap.`, prefix
  codes like `BW`/`NG`, roman→arabic numerals, and a fat-finger typo).
- **Over-merge trap:** `Northgate Capital` and `Northgate Advisors` are
  *different* firms — your matcher must not collapse them.
- **Schema harmonization:** AUM in three units (USD millions / `"$X.XB"` strings
  / raw dollars); dates in ISO / US / long / year-only; three strategy
  taxonomies (`LSE` / `Long/Short Equity` / `Equity Hedge`).
- **Data quality:** negative AUM, a future (2027) vintage year, ~15% panel
  coverage gaps, 3 noise funds that exist in no other source, a duplicate row,
  and manager-inflated self-reported AUM.
- **Answer key:** `data/ground_truth.csv` maps every source record to its
  canonical fund/manager. **Don't read it from L1 logic** — use it only to
  *score* your resolution afterward (precision/recall), like a take-home grader.

## Build roadmap — you build L1→L6 (this is the learning)

Each layer maps to a specific interview round. Acceptance criteria below double
as "what good looks like" if an interviewer pushes.

- **L0 — Data generation** ✅ *(scaffolded)* — `pipeline/generate_data.py`, `schema.sql`.
- **L1 — Integration pipeline** *(Aaru take-home + system design)*
  Ingest 3 feeds → `bronze`. Normalize/type/harmonize → `silver`. Resolve
  entities: **blocking** (normalized first token / strategy) → **fuzzy match**
  (rapidfuzz: token-sort + Jaro-Winkler) → **union-find clustering** for
  transitive closure → write `gold.funds`/`gold.managers` with `provenance`.
  Log every issue to `quality_log`; quarantine bad rows, never silently drop.
  ▸ *Done when:* you score resolution vs `ground_truth.csv` and report
  precision/recall, `Northgate Capital`≠`Northgate Advisors`, and all bad/noise
  rows are quarantined with a logged reason.
- **L2 — Backend API** *(Equi live-build + RAG system design)*
  FastAPI over `gold`: `/funds` (filters), `/managers`, `/ask` RAG endpoint —
  pgvector retrieval, **metadata-filter by fund before scoring**, hybrid
  dense+keyword, lightweight rerank, **citations on every answer**, numeric
  verification guardrail.
  ▸ *Done when:* `/ask` never returns a figure that isn't in a cited chunk.
- **L3 — Frontend** *(Equi live-build)*
  Next.js App Router: fund browser (Server Components) + Q&A panel with
  citations (Client Component). Narrate Server vs Client choices as you build.
  ▸ *Done when:* full vertical slice works browser → API → gold.
- **L4 — Multi-tenancy / RBAC** *(Equi white-label system design)*
  `tenant_id` row-level scoping so a partner sees only its funds.
  ▸ *Done when:* two tenants see disjoint fund sets through the same API.
- **L5 — System-design docs** *(both system-design rounds)*
  `docs/aaru-100tb-ingest.md` (scale L1 to a 100TB demographic panel) and
  `docs/equi-rag-and-whitelabel.md` (scale L2–L4). Each with a diagram.
- **L6 — Eval + lineage + deploy** *(both final/deep rounds)*
  RAG golden-answer eval set + faithfulness check; data-quality dashboard;
  lineage trace ("where did this NAV come from"); optional GCP deploy.

## Repo layout
```
atlas-fof/
├── README.md
├── schema.sql                  medallion + pgvector schema
├── requirements.txt
├── pipeline/
│   └── generate_data.py        L0 — synthetic messy data + answer key
├── data/
│   ├── raw/                    generated feeds + documents (gitignored)
│   └── ground_truth.csv        answer key (gitignored — score, don't peek)
├── backend/                    L2 (FastAPI) — you build
├── frontend/                   L3 (Next.js) — you build
└── docs/                       L5 system-design write-ups — you build
```
