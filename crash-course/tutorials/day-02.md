# Day 2 — Data + tenancy

**Where you are.** Yesterday the API answered `/health` by pinging an empty Postgres and Redis. Today the database gets its shape, real Austin data goes in, PDFs get chunked, and every chunk gets a vector. By 2pm you can run one command chain and watch row counts print. Everything else this week (search, agents, tenants) sits on what you build today.

**The one idea to hold all day: every table that holds customer data has a `tenant_id` column.** Not because you need tenants today, but because adding that column later means rewriting every query. Day 5 turns it into row-level security. Today you just never forget the column.

Open a terminal in `agent-platform`, run `docker compose up -d db redis` so Postgres and Redis are up, and start.

---

## Step 1 · The schema: `db/migrations/001_init.sql`

### What you are building and why

A migration is a SQL file that changes the database shape and is applied exactly once, in order. You will end the day with two of them. Why files instead of typing `CREATE TABLE` in psql? Because a stranger cloning your repo must get the same database you have, and because CI (Day 7) needs to build a fresh database from nothing.

Six tables. Think of them in three groups:

- **Who**: `tenants`, `users`. A tenant is a customer company. A user belongs to one tenant and has a role.
- **What we know**: `documents`, `chunks`. A document is a PDF or web page; a chunk is an ~800-token slice of it with an embedding and a full-text index.
- **What happened**: `runs`, `audit`. A run is one question asked; audit is one row per tool call. Both empty today, filled Day 4.

Plus two data tables that hold the Austin public records, `parcels` and `permits`, which Step 3 loads.

### Do this

Create `db/migrations/001_init.sql`:

```sql
-- 001_init.sql — core schema. Every customer-data table carries tenant_id.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE tenants (
    id          text PRIMARY KEY,                -- e.g. 'acme', 'demo', 'public'
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id          bigserial PRIMARY KEY,
    tenant_id   text NOT NULL REFERENCES tenants(id),
    email       text NOT NULL,
    role        text NOT NULL CHECK (role IN ('viewer','analyst','admin')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE documents (
    id          bigserial PRIMARY KEY,
    tenant_id   text NOT NULL REFERENCES tenants(id),
    source      text NOT NULL,                   -- 'pdf', 'html', 'edgar'
    title       text NOT NULL,
    uri         text NOT NULL,                   -- file path or URL
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, uri)
);

CREATE TABLE chunks (
    id          bigserial PRIMARY KEY,
    document_id bigint NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id   text NOT NULL REFERENCES tenants(id),
    ord         int NOT NULL,                    -- position within the document
    text        text NOT NULL,
    embedding   vector(384),                     -- bge-small-en-v1.5 output size; NULL until Step 5
    tsv         tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
    UNIQUE (document_id, ord)
);
CREATE INDEX chunks_tsv_idx ON chunks USING gin (tsv);
CREATE INDEX chunks_tenant_idx ON chunks (tenant_id);

CREATE TABLE runs (
    id          uuid PRIMARY KEY,
    tenant_id   text NOT NULL REFERENCES tenants(id),
    user_id     bigint REFERENCES users(id),
    question    text NOT NULL,
    status      text NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued','running','waiting_approval','succeeded','failed')),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit (
    id          bigserial PRIMARY KEY,
    tenant_id   text NOT NULL REFERENCES tenants(id),
    user_id     bigint,
    run_id      uuid,
    action      text NOT NULL,                   -- 'tool:sql_query', 'run:approve', ...
    resource    text,
    payload_hash text,
    ts          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_tenant_ts_idx ON audit (tenant_id, ts DESC);

-- Public Austin records. tenant_id = 'public' so the same access rules apply everywhere.
CREATE TABLE parcels (
    tenant_id       text NOT NULL REFERENCES tenants(id) DEFAULT 'public',
    prop_id         text PRIMARY KEY,
    situs_address   text,
    situs_city      text,
    situs_zip       text,
    owner_name      text,
    legal_desc      text,
    land_sqft       numeric,
    year_built      int,
    appraised_value numeric,
    market_value    numeric,
    tax_year        int
);
CREATE INDEX parcels_address_idx ON parcels (situs_address);

CREATE TABLE permits (
    tenant_id       text NOT NULL REFERENCES tenants(id) DEFAULT 'public',
    permit_num      text PRIMARY KEY,
    permit_type     text,
    description     text,
    address         text,
    issued_date     date,
    status          text,
    valuation       numeric
);
CREATE INDEX permits_address_idx ON permits (address);

INSERT INTO tenants (id, name) VALUES ('public','Public records'), ('demo','Demo tenant');
```

### Understand every non-obvious line

- `CREATE EXTENSION IF NOT EXISTS vector` turns on pgvector. The Docker image `pgvector/pgvector:pg16` ships it; a plain Postgres image would fail here.
- `vector(384)` is the embedding column. 384 is not arbitrary: it is the output size of `bge-small-en-v1.5`. If you switch models, the column type changes, so that decision is now recorded in the schema.
- `tsv tsvector GENERATED ALWAYS AS (...) STORED` makes Postgres compute the full-text index representation itself on every insert. You never maintain it by hand. The `gin` index on it is what makes keyword search fast on Day 3.
- `UNIQUE (document_id, ord)` is the idempotency guard for Step 4. Re-ingesting a PDF tries to insert the same `(document, position)` pair and is rejected, instead of duplicating chunks.
- `runs.id uuid` rather than `bigserial`: on Day 4 the client generates the id (idempotency key) before the row exists, and a client cannot generate a sequence number.
- `parcels.tenant_id DEFAULT 'public'` looks redundant. It is there so that on Day 5, one row-level-security policy (`tenant_id = current_setting('app.tenant') OR tenant_id = 'public'`) covers every table with no special cases.

### Check

```
docker compose exec db psql -U app -d app -c "\dt"
```

should show nothing yet. The file exists; Step 2 applies it.

---

## Step 2 · Applying migrations: `scripts/migrate.py`

### What you are building and why

A 40-line script that applies every `db/migrations/*.sql` in filename order and remembers which ones it has applied in a `schema_migrations` table. Run it twice, and the second run does nothing. That property, **idempotency**, is the same idea you will meet again on Day 4 with Kafka and on Day 5 with tool calls: doing something twice must equal doing it once.

You could use Alembic. You are not, because a migration runner is small enough to own, and owning it means you can explain it.

### Do this

Create `scripts/__init__.py` (empty) and `scripts/migrate.py`:

```python
"""Apply db/migrations/*.sql in order, once each. Safe to re-run."""
import os
import sys
from pathlib import Path

import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
MIGRATIONS = Path(__file__).resolve().parent.parent / "db" / "migrations"


def main() -> int:
    files = sorted(p for p in MIGRATIONS.glob("*.sql"))
    with psycopg.connect(DATABASE_URL) as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            " filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
        )
        applied = {r[0] for r in conn.execute("SELECT filename FROM schema_migrations")}
        todo = [p for p in files if p.name not in applied]
        for path in todo:
            sql = path.read_text(encoding="utf-8")
            with conn.transaction():
                conn.execute(sql)
                conn.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))
            print(f"applied {path.name}")
        print(f"{len(todo)} applied, {len(applied)} already present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Understand it

- `sorted(glob)` is the ordering. That is why filenames start with `001_`, `002_`. Alphabetical order is the whole scheduler.
- `with conn.transaction():` wraps each migration and its bookkeeping row in one transaction. If the SQL fails halfway, neither the partial schema change nor the "applied" record survives. Postgres can roll back DDL; MySQL cannot, which is one reason people choose Postgres.
- The `applied` set is read once before the loop. Small detail, but it means the script does one query for bookkeeping instead of one per file.
- The connection string comes from `DATABASE_URL`. Inside Docker it will be `db:5432`; from your laptop it is `localhost:5432`. Same script, no edits.

### Check

```
uv run python scripts/migrate.py
uv run python scripts/migrate.py
```

First run prints `applied 001_init.sql` then `1 applied, 0 already present`. Second run prints `0 applied, 1 already present`. Then:

```
docker compose exec db psql -U app -d app -c "\dt"
```

Nine tables (six core, two data, one `schema_migrations`). If `psycopg` is missing, `uv add "psycopg[binary]"` and retry.

---

## Step 3 · Loading Austin records: `ingest/download.py` and `ingest/load_tabular.py`

### What you are building and why

Two scripts. The first fetches two public CSVs into `data/raw/` and skips the download if the file is already there (so re-running costs nothing). The second loads them into `parcels` and `permits` with Postgres `COPY`, which is 50 to 100 times faster than inserting rows one at a time.

Why real data instead of a toy CSV? Because on Day 3 the agent will answer "what is the median appraised value on Garcreek Cir," and the answer should be true.

### Get the URLs

- **Permits**: the City of Austin open-data portal dataset "Issued Construction Permits" (data.austintexas.gov, dataset id `3syk-w9eu`). The CSV export URL is `https://data.austintexas.gov/api/views/3syk-w9eu/rows.csv?accessType=DOWNLOAD`. It is large (over 1 GB); the script below limits rows with the Socrata `$limit` parameter instead, using the JSON API: `https://data.austintexas.gov/resource/3syk-w9eu.csv?$limit=200000`.
- **Parcels**: Travis Central Appraisal District publishes the appraisal roll under Data Downloads on traviscad.org as a zipped export. The exact filename changes yearly, so put the URL you find in `ingest/sources.json`. If the download is broken or the format fights you for more than 20 minutes, use the fallback in the script: it generates 120,000 synthetic parcels so the day is not blocked. Write a `FAILURES.md` line and move on. The architecture does not care.

### Do this

`ingest/__init__.py` (empty). `ingest/sources.json`:

```json
{
  "permits": "https://data.austintexas.gov/resource/3syk-w9eu.csv?$limit=200000",
  "parcels": "PASTE_TCAD_APPRAISAL_ROLL_CSV_URL_HERE"
}
```

`ingest/download.py`:

```python
"""Download source CSVs into data/raw/ (skips files that already exist)."""
import json
import sys
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
SOURCES = json.loads((ROOT / "ingest" / "sources.json").read_text())


def fetch(name: str, url: str) -> Path:
    out = RAW / f"{name}.csv"
    if out.exists():
        print(f"{name}: already have {out} ({out.stat().st_size/1e6:.1f} MB)")
        return out
    if url.startswith("PASTE_"):
        print(f"{name}: no URL configured, skipping")
        return out
    print(f"{name}: downloading {url}")
    with httpx.stream("GET", url, timeout=600, follow_redirects=True) as r:
        r.raise_for_status()
        RAW.mkdir(parents=True, exist_ok=True)
        with open(out, "wb") as f:
            for chunk in r.iter_bytes(1 << 20):
                f.write(chunk)
    print(f"{name}: saved {out} ({out.stat().st_size/1e6:.1f} MB)")
    return out


if __name__ == "__main__":
    for name, url in SOURCES.items():
        fetch(name, url)
    sys.exit(0)
```

`ingest/load_tabular.py`:

```python
"""Load data/raw/*.csv into parcels and permits with COPY. Re-runnable (truncates first)."""
import csv
import os
import random
import sys
import time
from pathlib import Path

import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
RAW = Path(__file__).resolve().parent.parent / "data" / "raw"

# Map our column -> candidate source column names (first match wins). Adjust after inspecting the CSV header.
PERMIT_COLS = {
    "permit_num":  ["permit_number", "permit_num"],
    "permit_type": ["permit_type_desc", "permit_type"],
    "description": ["description", "work_class"],
    "address":     ["original_address1", "project_name"],
    "issued_date": ["issue_date", "issued_date"],
    "status":      ["status_current", "status"],
    "valuation":   ["total_job_valuation", "valuation"],
}
PARCEL_COLS = {
    "prop_id":         ["prop_id", "PROP_ID"],
    "situs_address":   ["situs_address", "SITUS_ADDRESS", "situs"],
    "situs_city":      ["situs_city", "SITUS_CITY"],
    "situs_zip":       ["situs_zip", "SITUS_ZIP"],
    "owner_name":      ["owner_name", "OWNER_NAME", "py_owner_name"],
    "legal_desc":      ["legal_desc", "LEGAL_DESC"],
    "land_sqft":       ["land_sqft", "LAND_SQFT", "land_acres"],
    "year_built":      ["year_built", "YEAR_BUILT", "yr_built"],
    "appraised_value": ["appraised_val", "APPRAISED_VAL", "appraised_value"],
    "market_value":    ["market_value", "MARKET_VALUE", "market"],
    "tax_year":        ["tax_year", "TAX_YEAR", "year"],
}


def pick(header: list[str], candidates: list[str]) -> int | None:
    lower = [h.strip().lower() for h in header]
    for c in candidates:
        if c.lower() in lower:
            return lower.index(c.lower())
    return None


def copy_csv(conn, table: str, path: Path, colmap: dict[str, list[str]]) -> int:
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader)
        idx = {ours: pick(header, cands) for ours, cands in colmap.items()}
        missing = [k for k, v in idx.items() if v is None]
        if missing:
            print(f"{table}: WARNING columns not found, will be NULL: {missing}")
        cols = list(colmap.keys())
        n = 0
        with conn.cursor() as cur:
            with cur.copy(f"COPY {table} ({', '.join(cols)}) FROM STDIN") as cp:
                for row in reader:
                    vals = []
                    for k in cols:
                        i = idx[k]
                        v = row[i].strip() if i is not None and i < len(row) else ""
                        vals.append(v if v != "" else None)
                    cp.write_row(vals)
                    n += 1
        return n


def synth_parcels(conn, n: int = 120_000) -> int:
    streets = ["Garcreek Cir", "Oak Meadow Dr", "Manor Rd", "S Congress Ave", "E 7th St", "Burnet Rd", "Riverside Dr", "William Cannon Dr"]
    random.seed(7)
    with conn.cursor() as cur, cur.copy(
        "COPY parcels (prop_id, situs_address, situs_city, situs_zip, owner_name, legal_desc, land_sqft, year_built, appraised_value, market_value, tax_year) FROM STDIN"
    ) as cp:
        for i in range(n):
            st = random.choice(streets)
            base = random.randint(180_000, 1_400_000)
            cp.write_row([f"S{i:07d}", f"{random.randint(100, 12999)} {st}", "Austin", f"787{random.randint(1,59):02d}",
                          f"Owner {i}", f"LOT {random.randint(1,40)} BLK {random.randint(1,12)}",
                          random.randint(4000, 20000), random.randint(1950, 2024), base, int(base * random.uniform(0.95, 1.1)), 2026])
    return n


def main() -> int:
    with psycopg.connect(DATABASE_URL) as conn:
        for table, colmap, fname in (("permits", PERMIT_COLS, "permits.csv"), ("parcels", PARCEL_COLS, "parcels.csv")):
            t0 = time.time()
            conn.execute(f"TRUNCATE {table}")
            path = RAW / fname
            if path.exists():
                n = copy_csv(conn, table, path, colmap)
            elif table == "parcels":
                print("parcels: no CSV, generating synthetic rows (log this in FAILURES.md)")
                n = synth_parcels(conn)
            else:
                n = 0
            conn.commit()
            print(f"{table}: {n:,} rows in {time.time()-t0:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Understand it

- `COPY ... FROM STDIN` streams rows into Postgres in one round trip. `INSERT` per row would be a network round trip each; for 200k rows that is minutes versus seconds. This is the single most useful Postgres loading fact.
- The column-map approach exists because you do not control the source CSV's headers, and they change. `pick()` finds the first matching name; anything missing loads as NULL and prints a warning instead of crashing. Inspect a header with `head -1 data/raw/permits.csv` and adjust the candidates.
- `TRUNCATE` first makes the loader re-runnable: run it twice, get the same table, not double rows. That is idempotency again, the cheap way.
- The synthetic fallback is not cheating. It keeps today's dependency chain (Steps 4 to 6 and Day 3) unblocked. You log it as a failure and swap in the real roll later.

### Check

```
uv add httpx
uv run python ingest/download.py && uv run python ingest/load_tabular.py
docker compose exec db psql -U app -d app -c "SELECT count(*) FROM parcels; SELECT count(*) FROM permits;"
```

Parcels over 100,000. Permits over 100,000 if the download worked. Note the seconds printed; that number goes in BENCHMARKS.md in Step 6.

---

## Step 4 · Chunking PDFs: `ingest/pdf.py`

### What you are building and why

Search does not work on whole documents. A 60-page neighborhood plan mentions flood plains on page 41; you want the model to see that paragraph, not the whole plan. So you split every document into overlapping pieces of roughly 800 tokens. A token is what the model counts, not a word, so you count with `tiktoken` rather than splitting on spaces.

Why 800 with 100 overlap? 800 tokens is a few paragraphs: big enough to carry a complete thought, small enough that eight of them fit in a prompt with room to spare. The 100-token overlap means a sentence cut at a boundary appears whole in at least one chunk. On Day 7 you will measure whether different sizes work better; today you pick sensible defaults and move.

### Do this

Put at least 20 PDFs in `data/pdfs/`. Good free sources: City of Austin neighborhood plans and housing reports (austintexas.gov, search "neighborhood plan pdf"), TCAD annual reports, and any SEC 10-K (sec.gov/edgar) as company documents.

```
uv add pypdf tiktoken
```

`ingest/pdf.py`:

```python
"""Parse PDFs, chunk to ~800 tokens with 100 overlap, store documents + chunks. Re-runnable."""
import argparse
import os
import sys
from pathlib import Path

import psycopg
import tiktoken
from pypdf import PdfReader

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
ENC = tiktoken.get_encoding("cl100k_base")
CHUNK_TOKENS, OVERLAP = 800, 100


def chunk_text(text: str) -> list[str]:
    ids = ENC.encode(text)
    out, start = [], 0
    while start < len(ids):
        end = min(start + CHUNK_TOKENS, len(ids))
        out.append(ENC.decode(ids[start:end]))
        if end == len(ids):
            break
        start = end - OVERLAP
    return out


def ingest_pdf(conn, path: Path, tenant: str) -> tuple[int, int]:
    reader = PdfReader(str(path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    if len(text.strip()) < 200:
        print(f"  skip {path.name}: no extractable text (scanned? needs OCR)")
        return 0, 0
    with conn.transaction():
        doc_id = conn.execute(
            "INSERT INTO documents (tenant_id, source, title, uri) VALUES (%s, 'pdf', %s, %s) "
            "ON CONFLICT (tenant_id, uri) DO UPDATE SET title = EXCLUDED.title RETURNING id",
            (tenant, path.stem, str(path)),
        ).fetchone()[0]
        n_new = 0
        for ord_, piece in enumerate(chunk_text(text)):
            r = conn.execute(
                "INSERT INTO chunks (document_id, tenant_id, ord, text) VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (document_id, ord) DO NOTHING RETURNING id",
                (doc_id, tenant, ord_, piece),
            ).fetchone()
            n_new += 1 if r else 0
    return doc_id, n_new


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--tenant", default="demo")
    a = ap.parse_args()
    pdfs = sorted(Path(a.folder).glob("*.pdf"))
    total = 0
    with psycopg.connect(DATABASE_URL) as conn:
        for p in pdfs:
            _, n = ingest_pdf(conn, p, a.tenant)
            total += n
            print(f"  {p.name}: {n} new chunks")
        n_chunks = conn.execute("SELECT count(*) FROM chunks WHERE tenant_id=%s", (a.tenant,)).fetchone()[0]
    print(f"{len(pdfs)} PDFs, {total} new chunks this run, {n_chunks} total for tenant {a.tenant}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Understand it

- `chunk_text` works on token ids, not characters, then decodes each window back to text. That guarantees every chunk is at most 800 tokens no matter how the text is written.
- `ON CONFLICT (tenant_id, uri) DO UPDATE ... RETURNING id` is an "upsert": insert the document, or if it exists, hand back its id. Combined with `ON CONFLICT (document_id, ord) DO NOTHING` on chunks, a second run inserts zero new chunks. That is the "rerun adds 0" check from the plan.
- Scanned PDFs have no text layer; `extract_text()` returns empty strings. The script skips them and tells you. OCR is a rabbit hole; do not enter it today.
- `--tenant demo` puts the chunks under the demo tenant. On Day 5, a user from another tenant will be unable to see them, and you will have a test proving it.

### Check

```
uv run python ingest/pdf.py data/pdfs --tenant demo
uv run python ingest/pdf.py data/pdfs --tenant demo
```

First run: a few hundred to a few thousand chunks. Second run: `0 new chunks this run`. Then `SELECT count(*) FROM chunks;` should be above 500.

---

## Step 5 · Embeddings: `ingest/embed.py` and `db/migrations/002_hnsw.sql`

### What you are building and why

An embedding turns a chunk of text into 384 numbers such that texts with similar meaning land close together. Tomorrow's vector search is "find the chunks whose 384 numbers are closest to the question's 384 numbers." Today you compute and store them.

The model is `BAAI/bge-small-en-v1.5`: small (33M parameters), runs fine on CPU, and good enough that the reranker on Day 3 does the rest. The embedding runs in batches of 64 because the model's cost is dominated by per-call overhead; one text per call would be ten times slower.

The second migration adds an **HNSW index**. Without it, "find the nearest vectors" compares against every row (fine at 1,000 chunks, unusable at 5 million). HNSW builds a navigable graph so lookups touch a few hundred vectors instead. You will feel the difference in Week 2 at scale.

### Do this

```
uv add sentence-transformers
```

`db/migrations/002_hnsw.sql`:

```sql
-- 002_hnsw.sql — approximate nearest-neighbour index for vector search (cosine distance).
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw
    ON chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

`ingest/embed.py`:

```python
"""Embed every chunk whose embedding is NULL, in batches. Prints throughput for BENCHMARKS.md."""
import os
import sys
import time

import psycopg
from sentence_transformers import SentenceTransformer

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
MODEL = "BAAI/bge-small-en-v1.5"
BATCH = 64


def main() -> int:
    model = SentenceTransformer(MODEL)
    done, t0 = 0, time.time()
    with psycopg.connect(DATABASE_URL) as conn:
        while True:
            rows = conn.execute(
                "SELECT id, text FROM chunks WHERE embedding IS NULL ORDER BY id LIMIT %s", (BATCH,)
            ).fetchall()
            if not rows:
                break
            vecs = model.encode([t for _, t in rows], normalize_embeddings=True, batch_size=BATCH)
            with conn.cursor() as cur:
                cur.executemany(
                    "UPDATE chunks SET embedding = %s::vector WHERE id = %s",
                    [(list(map(float, v)), i) for (i, _), v in zip(rows, vecs)],
                )
            conn.commit()
            done += len(rows)
            if done % (BATCH * 10) == 0:
                print(f"  {done} chunks, {done/(time.time()-t0):.1f} chunks/s")
        remaining = conn.execute("SELECT count(*) FROM chunks WHERE embedding IS NULL").fetchone()[0]
    dt = time.time() - t0
    print(f"embedded {done} chunks in {dt:.1f}s = {done/max(dt,1e-9):.1f} chunks/s on CPU; {remaining} remaining (should be 0)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Understand it

- `WHERE embedding IS NULL ... LIMIT 64` in a loop is a resumable work queue in one query. Kill the script, restart it, it picks up where it stopped. No state file.
- `normalize_embeddings=True` makes every vector length 1, so cosine similarity becomes a plain dot product. The index in 002 uses `vector_cosine_ops` to match.
- `%s::vector` casts a Python list into pgvector's type. Without the cast Postgres sees an array and complains.
- `m = 16, ef_construction = 64` are HNSW build parameters: graph connectivity and build-time search width. Defaults are fine now; they are the knobs you will turn in Week 2 when you benchmark recall against build time.
- First run downloads the model (about 130 MB) to `~/.cache`. In the Dockerfile, later, you will bake it in so containers do not download on start.

### Check

```
uv run python scripts/migrate.py        # applies 002
uv run python ingest/embed.py
docker compose exec db psql -U app -d app -c "SELECT count(*) FROM chunks WHERE embedding IS NULL;"
```

Zero. Copy the `chunks/s` number.

---

## Step 6 · First benchmark table: `BENCHMARKS.md`

### Why this is a build step and not paperwork

Every job description you are targeting says "evaluate," "measure," "benchmark." The habit is to write down a number every time you produce one, in a table a hiring manager can read in ten seconds. The first table is small on purpose. By Day 7 this file has retrieval quality, judge agreement, and cost per run; by Week 5 it is the spine of your résumé bullets.

### Do this

Replace `BENCHMARKS.md`:

```markdown
# Benchmarks

All numbers measured on this repo, on the hardware named. Re-run commands are given so anyone can reproduce them.

## Ingestion (Day 2) — <your CPU model>, Postgres 16 in Docker

| Stage | Rows / chunks | Time | Throughput | Command |
|-------|---------------|------|------------|---------|
| Load parcels (COPY) | <n> | <s> s | <rows/s> rows/s | `python ingest/load_tabular.py` |
| Load permits (COPY) | <n> | <s> s | <rows/s> rows/s | same |
| Chunk PDFs (800 tok / 100 overlap) | <n chunks> from <k> PDFs | <s> s | — | `python ingest/pdf.py data/pdfs --tenant demo` |
| Embed (bge-small-en-v1.5, batch 64, CPU) | <n chunks> | <s> s | <chunks/s> chunks/s | `python ingest/embed.py` |

Notes: parcels source = <TCAD roll YYYY | synthetic fallback, see FAILURES.md>. Permits source = data.austintexas.gov 3syk-w9eu, $limit=200000.
```

Fill every angle-bracket with the number your terminal printed. Put your CPU model in (Task Manager → Performance → CPU). Commit.

---

## Run · the one command chain that proves the day

```
uv run python scripts/migrate.py && uv run python ingest/download.py && uv run python ingest/load_tabular.py && uv run python ingest/pdf.py data/pdfs --tenant demo && uv run python ingest/embed.py
```

Then the four checks from the plan row:

```
docker compose exec db psql -U app -d app -c "SELECT count(*) FROM parcels;"                         -- > 100000
docker compose exec db psql -U app -d app -c "SELECT count(*) FROM chunks;"                          -- > 500
docker compose exec db psql -U app -d app -c "SELECT count(*) FROM chunks WHERE embedding IS NULL;"  -- 0
uv run python ingest/pdf.py data/pdfs --tenant demo                                                   -- 0 new chunks
```

If a check fails, that is not a bad day, that is the day's content: fix it, and write down what happened in the next block.

Commit: `git add -A && git commit -m "Day 2: schema with tenant_id, migrations, TCAD/permits load, PDF chunking, embeddings + HNSW"` and push.

---

## Defend · 30 minutes that make tomorrow's interview answer

1. **FAILURES.md.** At least one line, in the format `2026-09-04 · tried X · saw Y · changed to Z · result`. Candidates: the TCAD URL, a CSV header mismatch, a scanned PDF, the first embedding run being slow before you raised the batch size. If truly nothing broke, write the thing you were unsure about and how you resolved it.
2. **Three sentences** in your log: "In an interview I'd describe today's work as…" Aim for: what you built, one decision and why, one number.
3. **Ask yourself the six levels** on one decision, out loud: Why is `tsv` a generated column? Why `COPY`? Why 800 tokens? What breaks at 5 million chunks? How do you know? If any answer is "I think," write it down as an experiment for Week 2, Day 11.

Tomorrow (Day 3) the search modes and the agent loop get built on top of exactly these tables. Log the session with "Day 2 done" so the site advances.
