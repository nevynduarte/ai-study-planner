-- Atlas-FoF — Postgres schema (medallion: bronze → silver → gold)
--
-- WHY medallion layering (this is a system-design talking point for BOTH roles):
--   bronze = raw, append-only, exactly as ingested. Never edited. Lets you
--            reprocess from source and audit "what did the vendor actually send."
--   silver = cleaned + typed + harmonized + entity-resolution metadata. Still
--            row-per-source-record, but now trustworthy and joinable.
--   gold   = canonical, de-duplicated business entities the app/RAG consume.
--            One row per real fund / real manager.
--
-- The seam between silver and gold IS your entity resolution. That seam is the
-- thing both interviews will push on: Aaru ("how do you resolve at scale?"),
-- Equi ("how do you serve trusted data to the app?").
--
-- Apply:  psql "$DATABASE_URL" -f schema.sql

CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector: keeps RAG inside Postgres,
                                           -- which matches Equi's "stay on Postgres" stack bias.

-- ─────────────────────────────────────────────────────────────────────────
-- BRONZE — raw landing zone. Text-typed on purpose: we ingest first, validate
-- later. `source` + `ingested_at` give us provenance/lineage from row one.
-- ─────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS bronze;

CREATE TABLE IF NOT EXISTS bronze.admin_feed (
    raw_id         BIGSERIAL PRIMARY KEY,
    fund_admin_id  TEXT,
    fund_legal_name TEXT,
    manager_name   TEXT,
    share_class    TEXT,
    strategy_code  TEXT,
    aum_musd       TEXT,
    mtd_return_pct TEXT,
    as_of_date     TEXT,
    inception_date TEXT,
    source         TEXT DEFAULT 'admin',
    ingested_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bronze.manager_selfreport (
    raw_id        BIGSERIAL PRIMARY KEY,
    record_id     TEXT,
    manager       TEXT,
    fund          TEXT,
    strategy      TEXT,
    inception     TEXT,
    reported_aum  TEXT,
    headquarters  TEXT,
    source        TEXT DEFAULT 'manager',
    ingested_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bronze.panel_thirdparty (
    raw_id        BIGSERIAL PRIMARY KEY,
    panel_id      TEXT,
    fund_name     TEXT,
    manager_name  TEXT,
    asset_class   TEXT,
    aum_usd       TEXT,
    vintage_year  TEXT,
    domicile      TEXT,
    source        TEXT DEFAULT 'panel',
    ingested_at   TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- DATA QUALITY LOG — one row per issue your pipeline detects. This table is
-- the artifact that makes "documented data-quality reasoning" demonstrable
-- (graded explicitly in the Aaru take-home framework). Never silently fix.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bronze.quality_log (
    id          BIGSERIAL PRIMARY KEY,
    source      TEXT,
    record_ref  TEXT,         -- e.g. the source id of the offending row
    field       TEXT,
    issue       TEXT,
    severity    TEXT CHECK (severity IN ('low', 'medium', 'high')),
    action      TEXT,         -- quarantined? imputed? flagged-and-kept?
    detected_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- SILVER — cleaned, typed, harmonized. Still one row per SOURCE record, but
-- columns now carry the resolution result: which canonical entity this row was
-- matched to, by what method, with what confidence. This is your audit trail
-- for the entity map (versionable/correctable — call this out in system design).
-- ─────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS silver;

CREATE TABLE IF NOT EXISTS silver.fund_records (
    id                  BIGSERIAL PRIMARY KEY,
    source              TEXT NOT NULL,
    source_record_id    TEXT NOT NULL,
    fund_name_raw       TEXT,
    fund_name_norm      TEXT,          -- normalized key used for blocking/matching
    manager_name_raw    TEXT,
    manager_name_norm   TEXT,
    strategy_canonical  TEXT,          -- harmonized to CANON_STRATEGIES
    aum_musd            NUMERIC,       -- harmonized to USD millions
    inception_date      DATE,          -- harmonized to a real DATE
    -- resolution result (the silver→gold seam):
    resolved_fund_id    TEXT,          -- FK-ish to gold.funds.fund_id once resolved
    resolved_manager_id TEXT,
    match_method        TEXT,          -- 'exact' | 'fuzzy' | 'manual' | 'unmatched'
    match_confidence    NUMERIC,       -- 0..1
    UNIQUE (source, source_record_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- GOLD — canonical entities the application + RAG read from. One row per real
-- fund / manager. `provenance` records which source records fed each field,
-- so you can always answer "where did this number come from" (lineage).
-- ─────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE IF NOT EXISTS gold.managers (
    manager_id   TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    hq           TEXT,
    founded_year INT,
    provenance   JSONB          -- {field: [source records that agreed/were chosen]}
);

CREATE TABLE IF NOT EXISTS gold.funds (
    fund_id       TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    manager_id    TEXT REFERENCES gold.managers(manager_id),
    strategy      TEXT,
    aum_musd      NUMERIC,
    inception_date DATE,
    share_classes TEXT[],
    tenant_id     TEXT,         -- L4: which white-label partner can see this fund
    provenance    JSONB
);

-- ─────────────────────────────────────────────────────────────────────────
-- RAG — document chunks + embeddings (L2). pgvector dimension 384 matches a
-- small sentence-transformer (all-MiniLM-L6-v2). Metadata on every chunk so
-- retrieval can filter by fund BEFORE semantic scoring (the finance-RAG rule).
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gold.fund_documents (
    doc_id    TEXT PRIMARY KEY,
    fund_id   TEXT REFERENCES gold.funds(fund_id),
    doc_type  TEXT,
    as_of     DATE,
    full_text TEXT
);

CREATE TABLE IF NOT EXISTS gold.doc_chunks (
    chunk_id   BIGSERIAL PRIMARY KEY,
    doc_id     TEXT REFERENCES gold.fund_documents(doc_id),
    fund_id    TEXT,                 -- denormalized for fast metadata filtering
    chunk_text TEXT,
    embedding  VECTOR(384)
);

-- IVFFlat index for approximate nearest-neighbour search. Build AFTER load.
-- CREATE INDEX ON gold.doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
