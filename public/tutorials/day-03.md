# Day 3 — Retrieval + agent runtime

**Where you are.** Day 1 gave you a running API over Postgres and Redis. Day 2 gave the database its shape and filled it: over 100k parcels, over 500 chunks, every chunk with a 384-number embedding and a full-text index. Today those tables get read for the first time. You build three ways to search chunks, a reranker that picks the best 8, five tools with hard safety limits, and the loop that lets Claude call those tools and hand back a cited answer. Day 4 moves this loop into a Kafka worker; today it runs from the command line.

**The one idea to hold all day: the model never gets to say a number it did not get from a tool.** Every tool result gets an evidence id. The final answer must cite those ids. The runtime checks each id exists and fails the run if one does not. Retrieval quality, the safe SQL role, the step cap, the forced schema: all of them serve that one property.

Open a terminal in `agent-platform`, run `docker compose up -d db redis`, then `uv add anthropic pyyaml` and set `ANTHROPIC_API_KEY` in your `.env`. Start.

---

## Step 1 · Three search modes: `retrieval/vector.py`, `retrieval/bm25.py`, `retrieval/hybrid.py`

### What you are building and why

Two searches that fail in opposite ways, and a third that merges them. **Vector search** embeds the question with the same `bge-small` model from Day 2 and asks pgvector for the nearest chunks by cosine distance. It is good at paraphrase ("houses that might flood" finds "100-year floodplain") and bad at exact tokens: a parcel id or "Garcreek" is not a concept the embedding space knows. **BM25** is the classic keyword score: term frequency, weighted by how rare the term is across the corpus, normalised by document length. It nails exact names and numbers and misses synonyms.

Postgres does not ship true BM25. Its `ts_rank_cd` function is a cover-density keyword ranker: same family, no length normalisation. You name the file `bm25.py` because that is the role it plays in the architecture, and you record the difference in the ADR so an interviewer sees you know it. A drop-in true BM25 (ParadeDB's `pg_search`) is a Week 2 experiment.

**Hybrid** runs both, then fuses with **Reciprocal Rank Fusion (RRF)**. Each chunk's fused score is the sum over lists of `1 / (k + rank)`. With `k = 60`, first place in one list is worth about 0.016, tenth place 0.014. The point of RRF is that it ignores raw scores, which are not comparable between a cosine similarity and a ts_rank, and only looks at position. Chunks that appear near the top of both lists win. Every function takes a `tenant` and filters on it; Day 5's row-level security will enforce the same thing from inside the database, but today you filter in SQL so the tenant boundary is never implicit.

### Do this

Create `retrieval/__init__.py` (empty). Then `retrieval/vector.py`:

```python
"""Vector search over chunks.embedding (cosine, HNSW). Tenant-filtered."""
from functools import lru_cache

import psycopg
from sentence_transformers import SentenceTransformer

MODEL = "BAAI/bge-small-en-v1.5"


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    return SentenceTransformer(MODEL)


def embed_query(text: str) -> list[float]:
    return [float(x) for x in _model().encode(text, normalize_embeddings=True)]


def vector_search(conn: psycopg.Connection, tenant: str, query: str, k: int = 30) -> list[tuple[int, float]]:
    """Returns [(chunk_id, similarity)] best first."""
    vec = embed_query(query)
    with conn.transaction():
        conn.execute("SET LOCAL hnsw.ef_search = 100")
        rows = conn.execute(
            "SELECT id, 1 - (embedding <=> %s::vector) AS sim "
            "FROM chunks WHERE tenant_id = %s AND embedding IS NOT NULL "
            "ORDER BY embedding <=> %s::vector LIMIT %s",
            (vec, tenant, vec, k),
        ).fetchall()
    return [(r[0], float(r[1])) for r in rows]
```

`retrieval/bm25.py`:

```python
"""Keyword search over chunks.tsv (Postgres full text, ts_rank_cd). Tenant-filtered."""
import psycopg


def bm25_search(conn: psycopg.Connection, tenant: str, query: str, k: int = 30) -> list[tuple[int, float]]:
    """Returns [(chunk_id, score)] best first. websearch_to_tsquery tolerates raw user text."""
    rows = conn.execute(
        "SELECT id, ts_rank_cd(tsv, q) AS score "
        "FROM chunks, websearch_to_tsquery('english', %s) q "
        "WHERE tenant_id = %s AND tsv @@ q "
        "ORDER BY score DESC LIMIT %s",
        (query, tenant, k),
    ).fetchall()
    return [(r[0], float(r[1])) for r in rows]
```

`retrieval/hybrid.py`:

```python
"""Hybrid search: BM25 + vector fused with Reciprocal Rank Fusion (k=60).
CLI: python -m retrieval.hybrid --tenant demo --mode hybrid "flood plain"
"""
import argparse
import os
import sys
from dataclasses import dataclass

import psycopg

from retrieval.bm25 import bm25_search
from retrieval.vector import vector_search

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
RRF_K = 60


@dataclass
class Hit:
    id: int
    document_id: int
    title: str
    text: str
    score: float


def rrf(rankings: list[list[int]], k: int = RRF_K) -> dict[int, float]:
    fused: dict[int, float] = {}
    for ranking in rankings:
        for rank, chunk_id in enumerate(ranking, start=1):
            fused[chunk_id] = fused.get(chunk_id, 0.0) + 1.0 / (k + rank)
    return fused


def _hydrate(conn, tenant: str, scored: list[tuple[int, float]]) -> list[Hit]:
    if not scored:
        return []
    ids = [i for i, _ in scored]
    rows = conn.execute(
        "SELECT c.id, c.document_id, d.title, c.text FROM chunks c "
        "JOIN documents d ON d.id = c.document_id "
        "WHERE c.id = ANY(%s) AND c.tenant_id = %s",
        (ids, tenant),
    ).fetchall()
    by_id = {r[0]: r for r in rows}
    return [Hit(id=i, document_id=by_id[i][1], title=by_id[i][2], text=by_id[i][3], score=s)
            for i, s in scored if i in by_id]


def hybrid_search(conn, tenant: str, query: str, k: int = 30, mode: str = "hybrid") -> list[Hit]:
    if mode == "bm25":
        scored = bm25_search(conn, tenant, query, k)
    elif mode == "vector":
        scored = vector_search(conn, tenant, query, k)
    else:
        b = [i for i, _ in bm25_search(conn, tenant, query, k)]
        v = [i for i, _ in vector_search(conn, tenant, query, k)]
        fused = rrf([b, v])
        scored = sorted(fused.items(), key=lambda x: -x[1])[:k]
    return _hydrate(conn, tenant, scored)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--tenant", default="demo")
    ap.add_argument("--mode", choices=["bm25", "vector", "hybrid"], default="hybrid")
    ap.add_argument("-k", type=int, default=5)
    a = ap.parse_args()
    with psycopg.connect(DATABASE_URL) as conn:
        for h in hybrid_search(conn, a.tenant, a.query, k=a.k, mode=a.mode):
            print(f"{h.score:.4f}  doc:{h.id}  {h.title[:40]:40}  {h.text[:80]!r}")
    sys.exit(0)
```

### Understand every non-obvious line

- `1 - (embedding <=> %s::vector)`: `<=>` is pgvector's cosine *distance*. Subtracting from 1 gives similarity so bigger is better, matching the sign convention of the keyword score. The `ORDER BY` uses the raw distance so the HNSW index is used; ordering by the subtracted expression would not.
- `SET LOCAL hnsw.ef_search = 100`: how many graph nodes the index visits per query. Default is 40. Higher means better recall and slower queries. `LOCAL` scopes it to the transaction, so the setting cannot leak to the next query on a pooled connection.
- `websearch_to_tsquery` instead of `to_tsquery`: it accepts free text with quotes and minus signs and never throws a syntax error on user input. `to_tsquery('Garcreek Cir')` fails because it expects operators between terms.
- `tsv @@ q` in `WHERE` is what makes the `gin` index from Day 2 fire. `ts_rank_cd` on its own is a full scan.
- `1.0 / (k + rank)` with `k = 60`: the constant flattens the curve so a chunk ranked 1st and 30th does not swamp one ranked 5th and 5th. The original RRF paper found 60 works across collections; you will measure whether it matters for yours on Day 7.
- `_hydrate` filters `c.tenant_id = %s` again even though both searches already did. Cheap, and it means a bug in one search path cannot leak a chunk id into another tenant's answer.
- `lru_cache` on the model loader: the model takes 2 to 3 seconds to load. Cache it once per process, not once per query.

### Check

```
uv run python -m retrieval.hybrid --tenant demo --mode bm25 "floodplain"
uv run python -m retrieval.hybrid --tenant demo --mode vector "houses that might flood"
uv run python -m retrieval.hybrid --tenant demo --mode hybrid "floodplain"
```

Each prints up to 5 lines: score, `doc:<id>`, title, first 80 characters. The vector query should return floodplain chunks even though the word "flood" is not the query. Failure: `ModuleNotFoundError: retrieval` means you ran from the wrong directory or forgot `__init__.py`. Run from the repo root.

---

## Step 2 · The reranker: `retrieval/rerank.py`

### What you are building and why

The searches in Step 1 are **bi-encoders**: question and chunk are embedded separately and compared with a dot product. Fast, because chunk vectors are precomputed, but the model never sees the question and the chunk together. A **cross-encoder** reads both in one pass and outputs a relevance score. It is far more accurate and far slower, so you use it only on the 30 candidates hybrid search already found, and keep 8.

The model is `BAAI/bge-reranker-base`, 278M parameters, runs on CPU at roughly 30 to 60 pairs per second. The brief calls reranking "the single biggest retrieval quality win." It is also the number you will prove on Day 7: hit rate at 8 with and without the reranker.

### Do this

`retrieval/rerank.py`:

```python
"""Cross-encoder reranking of hybrid candidates. CLI: python -m retrieval.rerank --tenant demo "query" """
import argparse
import os
import sys
import time
from functools import lru_cache

import psycopg
from sentence_transformers import CrossEncoder

from retrieval.hybrid import Hit, hybrid_search

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
MODEL = "BAAI/bge-reranker-base"


@lru_cache(maxsize=1)
def _model() -> CrossEncoder:
    return CrossEncoder(MODEL, max_length=512)


def rerank(query: str, hits: list[Hit], top_n: int = 8) -> list[Hit]:
    if not hits:
        return []
    scores = _model().predict([(query, h.text) for h in hits], batch_size=16)
    rescored = [Hit(h.id, h.document_id, h.title, h.text, float(s)) for h, s in zip(hits, scores)]
    rescored.sort(key=lambda h: -h.score)
    return rescored[:top_n]


def search(conn, tenant: str, query: str, top_n: int = 8, candidates: int = 30) -> list[Hit]:
    """The one function tools call: hybrid -> rerank -> top_n."""
    return rerank(query, hybrid_search(conn, tenant, query, k=candidates), top_n)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--tenant", default="demo")
    a = ap.parse_args()
    with psycopg.connect(DATABASE_URL) as conn:
        t0 = time.time()
        cands = hybrid_search(conn, a.tenant, a.query, k=30)
        t1 = time.time()
        top = rerank(a.query, cands, 8)
        t2 = time.time()
    print(f"hybrid {len(cands)} candidates in {1000*(t1-t0):.0f} ms, rerank in {1000*(t2-t1):.0f} ms")
    for h in top:
        print(f"{h.score:+.3f}  doc:{h.id}  {h.title[:40]:40}  {h.text[:80]!r}")
    sys.exit(0)
```

### Understand it

- `max_length=512`: the reranker truncates question plus chunk to 512 tokens. Your chunks are 800 tokens, so the tail of every chunk is invisible to the reranker. That is a real, known loss; write it down as a Day 7 experiment (chunk 400 versus 800).
- Scores are raw logits, not probabilities. Negative is normal. Only the ordering matters, which is why the CLI prints them with a sign.
- `top_n = 8`: 8 chunks at up to 800 tokens is about 6,400 tokens of context per `search_docs` call. With a 12-step cap, worst case is under 80k tokens of retrieved text per run. That arithmetic is your cost ceiling.
- `search()` is the only function the tool layer imports. Retrieval internals can change without touching `agent/tools.py`.
- The first run downloads about 1.1 GB. Do it now, not at 4pm.

### Check

```
uv run python -m retrieval.rerank --tenant demo "what zoning restrictions apply to accessory dwelling units"
```

One timing line, then 8 hits. Expect reranking of 30 candidates in 500 to 1,500 ms on a laptop CPU. Write both numbers down for BENCHMARKS.md. Failure: if the download stalls, set `HF_HUB_ENABLE_HF_TRANSFER=0` and retry, or temporarily return `hits[:top_n]` from `rerank()` and log it in FAILURES.md.

---

## Step 3 · Read-only role and value history: `db/migrations/003_agent.sql`

### What you are building and why

The `sql_query` tool will run SQL the model wrote. You cannot review it first. So the tool connects as a **separate Postgres role** that can only `SELECT` from three tables, has a 5-second statement timeout set at the role level, and has no access to `users`, `runs`, or `audit`. String checks in Python come second; the database is the guard.

The migration also adds `parcel_values`, a per-year history table. Day 2's `parcels` has one row per property with a single `tax_year`, so "change vs last year" has nothing to compare against. You seed a prior year from the current values with a deterministic spread. This is synthetic until you load a multi-year TCAD roll; log that in FAILURES.md today.

### Do this

`db/migrations/003_agent.sql`:

```sql
-- 003_agent.sql — read-only role for the sql_query tool, and per-year appraisal history.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_ro') THEN
        CREATE ROLE app_ro LOGIN PASSWORD 'app_ro' NOINHERIT;
    END IF;
END $$;

CREATE TABLE parcel_values (
    tenant_id       text NOT NULL REFERENCES tenants(id) DEFAULT 'public',
    prop_id         text NOT NULL REFERENCES parcels(prop_id) ON DELETE CASCADE,
    tax_year        int  NOT NULL,
    appraised_value numeric,
    PRIMARY KEY (prop_id, tax_year)
);
CREATE INDEX parcel_values_year_idx ON parcel_values (tax_year);

-- Current year straight from parcels.
INSERT INTO parcel_values (prop_id, tax_year, appraised_value)
SELECT prop_id, tax_year, appraised_value FROM parcels
WHERE tax_year IS NOT NULL;

-- Prior year: SYNTHETIC. Deterministic per prop_id, 4% to 12% lower. Replace with real roll later.
INSERT INTO parcel_values (prop_id, tax_year, appraised_value)
SELECT prop_id, tax_year - 1,
       round(appraised_value / (1.04 + (abs(hashtext(prop_id)) % 9) / 100.0))
FROM parcels
WHERE tax_year IS NOT NULL AND appraised_value IS NOT NULL
ON CONFLICT DO NOTHING;

GRANT CONNECT ON DATABASE app TO app_ro;
GRANT USAGE ON SCHEMA public TO app_ro;
GRANT SELECT ON parcels, permits, parcel_values TO app_ro;
ALTER ROLE app_ro SET statement_timeout = '5s';
ALTER ROLE app_ro SET default_transaction_read_only = on;
```

### Understand it

- The `DO $$ ... $$` block makes role creation re-runnable on a database where the role already exists. Roles are cluster-wide, not per database, so a plain `CREATE ROLE` can collide even on a fresh `app` database.
- `NOINHERIT` and an explicit grant list: `app_ro` gets exactly three tables. No grant on `chunks` either. The agent reaches documents only through `search_docs`, which is tenant-filtered.
- `ALTER ROLE ... SET statement_timeout = '5s'`: the limit lives on the role, so it holds even if someone connects as `app_ro` from `psql`. The tool sets it again per connection as belt and braces.
- `default_transaction_read_only = on`: even if a grant is added by mistake later, writes fail unless a session explicitly switches the transaction mode.
- `abs(hashtext(prop_id)) % 9`: a stable pseudo-random spread. Rerunning the migration on a fresh database produces the same numbers, so the demo answer is reproducible.
- `PRIMARY KEY (prop_id, tax_year)` is what the schema on Day 2 could not express. Two rows per property, one per year.

### Check

```
uv run python scripts/migrate.py
docker compose exec db psql -U app_ro -d app -c "SELECT count(*), min(tax_year), max(tax_year) FROM parcel_values;"
docker compose exec db psql -U app_ro -d app -c "DELETE FROM parcels;"
```

First: `applied 003_agent.sql`. Second: about twice the parcel count, two years. Third must fail with `permission denied for table parcels`. If it does not fail, stop and fix the grants before Step 4.

---

## Step 4 · Five tools: `agent/tools.py`

### What you are building and why

A tool is three things: a JSON schema the model sees, a Python function that runs, and a limit that holds when the model does something wrong. The limits are the work. `sql_query` connects as `app_ro`, allows one statement, and rejects anything that does not start with `SELECT` or `WITH`. `calc` parses the expression with Python's `ast` module and walks the tree, allowing only numbers, arithmetic, and four named functions. `eval()` would run `__import__('os').system(...)`. `fetch_url` allows three hosts. `send_email` is marked `requires_approval` and does nothing today except raise; Day 4 turns that raise into an event and an Approve button.

Every tool records **evidence**. A `ToolContext` object holds a dictionary from evidence id to text. `search_docs` registers `doc:<chunk_id>` for each hit. The others register `sql:1`, `calc:2` and so on in call order. The model sees those ids in its tool results. Step 5 refuses any answer that cites an id not in the dictionary. That is how "every number cites its source" becomes a check rather than a hope.

### Do this

Create `agent/__init__.py` (empty) and `agent/tools.py`:

```python
"""Tool registry. Each tool: schema the model sees, a function, and a hard limit.
Smoke test: python -m agent.tools
"""
import ast
import json
import operator
import os
import re
import sys
from dataclasses import dataclass, field
from typing import Any, Callable
from urllib.parse import urlparse

import httpx
import psycopg

from retrieval.rerank import search as rerank_search

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
READONLY_URL = os.environ.get("READONLY_DATABASE_URL", "postgresql://app_ro:app_ro@localhost:5432/app")
ALLOWED_HOSTS = {"data.austintexas.gov", "www.sec.gov", "traviscad.org"}
SQL_TIMEOUT_MS = 5000
SQL_MAX_ROWS = 50


class ToolError(Exception):
    """Returned to the model as an error tool_result. The run continues."""


class ApprovalRequired(Exception):
    """Raised by tools marked requires_approval. Day 4 turns this into an event."""


@dataclass
class ToolContext:
    conn: psycopg.Connection
    tenant: str
    evidence: dict[str, str] = field(default_factory=dict)
    _n: int = 0

    def add(self, kind: str, text: str) -> str:
        self._n += 1
        eid = f"{kind}:{self._n}"
        self.evidence[eid] = text
        return eid


@dataclass
class Tool:
    name: str
    description: str
    input_schema: dict[str, Any]
    fn: Callable[..., str]
    requires_approval: bool = False

    def spec(self) -> dict[str, Any]:
        return {"name": self.name, "description": self.description, "input_schema": self.input_schema}


# ---------- search_docs ----------
def search_docs(ctx: ToolContext, query: str, k: int = 8) -> str:
    hits = rerank_search(ctx.conn, ctx.tenant, query, top_n=min(k, 8))
    if not hits:
        return "No documents matched."
    lines = []
    for h in hits:
        eid = f"doc:{h.id}"
        ctx.evidence[eid] = f"{h.title}: {h.text[:300]}"
        lines.append(f"[{eid}] ({h.title})\n{h.text}\n")
    return "\n".join(lines)


# ---------- sql_query ----------
_FORBIDDEN = re.compile(r"\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|call|do|set|vacuum)\b", re.I)


def _guard_sql(sql: str) -> str:
    s = sql.strip().rstrip(";").strip()
    if ";" in s:
        raise ToolError("one statement only")
    if not re.match(r"(?is)^(select|with)\b", s):
        raise ToolError("SELECT or WITH only")
    if _FORBIDDEN.search(s):
        raise ToolError("statement contains a forbidden keyword")
    return s


def sql_query(ctx: ToolContext, sql: str) -> str:
    s = _guard_sql(sql)
    try:
        with psycopg.connect(READONLY_URL, options=f"-c statement_timeout={SQL_TIMEOUT_MS} -c default_transaction_read_only=on") as ro:
            cur = ro.execute(s)
            cols = [d.name for d in cur.description]
            rows = cur.fetchmany(SQL_MAX_ROWS)
    except psycopg.errors.QueryCanceled:
        raise ToolError(f"query exceeded {SQL_TIMEOUT_MS} ms; add a WHERE clause or LIMIT")
    except psycopg.Error as e:
        raise ToolError(f"sql error: {e.diag.message_primary if e.diag else e}")
    payload = {"sql": s, "columns": cols, "rows": [[_json(v) for v in r] for r in rows]}
    eid = ctx.add("sql", json.dumps(payload, default=str))
    return f"[{eid}] {len(rows)} row(s), columns {cols}\n{json.dumps(payload['rows'], default=str)}"


def _json(v):
    return float(v) if hasattr(v, "as_integer_ratio") and not isinstance(v, (int, float)) else v


# ---------- calc ----------
_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv,
        ast.Pow: operator.pow, ast.Mod: operator.mod, ast.USub: operator.neg, ast.UAdd: operator.pos}
_FUNCS = {"round": round, "abs": abs, "min": min, "max": max}


def _eval(node: ast.AST) -> float:
    if isinstance(node, ast.Expression):
        return _eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        if isinstance(node.op, ast.Pow) and abs(_eval(node.right)) > 64:
            raise ToolError("exponent too large")
        return _OPS[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval(node.operand))
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in _FUNCS and not node.keywords:
        return _FUNCS[node.func.id](*[_eval(a) for a in node.args])
    raise ToolError(f"unsupported expression element: {type(node).__name__}")


def calc(ctx: ToolContext, expression: str) -> str:
    if len(expression) > 200:
        raise ToolError("expression too long")
    try:
        tree = ast.parse(expression, mode="eval")
    except SyntaxError as e:
        raise ToolError(f"syntax: {e.msg}")
    value = _eval(tree)
    eid = ctx.add("calc", f"{expression} = {value}")
    return f"[{eid}] {expression} = {value}"


# ---------- fetch_url ----------
def fetch_url(ctx: ToolContext, url: str) -> str:
    host = urlparse(url).hostname or ""
    if host not in ALLOWED_HOSTS:
        raise ToolError(f"host {host!r} not in allowlist {sorted(ALLOWED_HOSTS)}")
    try:
        r = httpx.get(url, timeout=5.0, follow_redirects=False)
        r.raise_for_status()
    except httpx.HTTPError as e:
        raise ToolError(f"fetch failed: {e}")
    text = r.text[:20_000]
    eid = ctx.add("url", f"{url}\n{text[:300]}")
    return f"[{eid}] {url} ({len(r.text)} chars, truncated to 20k)\n{text}"


# ---------- send_email ----------
def send_email(ctx: ToolContext, to: str, subject: str, body: str) -> str:
    raise ApprovalRequired(f"send_email to={to} subject={subject!r}")


TOOLS: dict[str, Tool] = {
    "search_docs": Tool(
        "search_docs",
        "Hybrid keyword+vector search over the tenant's documents, reranked. Returns up to 8 chunks, each tagged [doc:ID]. Cite those ids.",
        {"type": "object", "properties": {"query": {"type": "string"}, "k": {"type": "integer", "minimum": 1, "maximum": 8}},
         "required": ["query"]},
        search_docs,
    ),
    "sql_query": Tool(
        "sql_query",
        "Run one read-only SELECT (5 s timeout, 50 rows max) against parcels, permits, parcel_values. Result is tagged [sql:N]. Cite that id for any number you take from it.",
        {"type": "object", "properties": {"sql": {"type": "string"}}, "required": ["sql"]},
        sql_query,
    ),
    "calc": Tool(
        "calc",
        "Evaluate an arithmetic expression (+ - * / ** %, round, abs, min, max). Result tagged [calc:N]. Use for every derived number; never do arithmetic in your head.",
        {"type": "object", "properties": {"expression": {"type": "string"}}, "required": ["expression"]},
        calc,
    ),
    "fetch_url": Tool(
        "fetch_url",
        "GET a URL on an allowlisted host (data.austintexas.gov, www.sec.gov, traviscad.org). Result tagged [url:N].",
        {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]},
        fetch_url,
    ),
    "send_email": Tool(
        "send_email",
        "Send an email. Requires human approval; the run pauses.",
        {"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}},
         "required": ["to", "subject", "body"]},
        send_email,
        requires_approval=True,
    ),
}


if __name__ == "__main__":
    with psycopg.connect(DATABASE_URL) as conn:
        ctx = ToolContext(conn=conn, tenant="demo")
        print(calc(ctx, "(412000-380000)/380000")[:80])
        print(sql_query(ctx, "SELECT count(*) FROM parcels WHERE situs_address ILIKE '%Garcreek Cir%'")[:120])
        for bad in ("DELETE FROM parcels", "SELECT 1; SELECT 2", "SELECT pg_sleep(10)"):
            try:
                sql_query(ctx, bad); print("FAIL: allowed", bad)
            except ToolError as e:
                print(f"blocked {bad!r}: {e}")
        try:
            calc(ctx, "__import__('os').system('echo pwned')"); print("FAIL: calc executed code")
        except ToolError as e:
            print(f"blocked calc: {e}")
        print(search_docs(ctx, "floodplain", k=2)[:200])
        print(f"evidence ids: {sorted(ctx.evidence)}")
    sys.exit(0)
```

### Understand every non-obvious line

- `psycopg.connect(READONLY_URL, options="-c statement_timeout=5000 ...")`: a fresh connection per SQL call, as the restricted role. The application connection in `ctx.conn` is never handed to the model. Per-call connections cost about 5 ms locally; on Day 4 you swap in a pool.
- `_guard_sql` runs before the database sees anything, but it is the weaker layer. Postgres does not know that `pg_sleep(10)` is harmless; the role's timeout kills it at 5 s. Try the smoke test and watch which layer catches which case.
- `fetchmany(SQL_MAX_ROWS)`: a `SELECT * FROM parcels` from the model would otherwise push 100k rows into the prompt. Fifty rows is the cap; the description tells the model to aggregate.
- `ast.parse(..., mode="eval")` plus a whitelist walk: the tree can only contain numbers, the eight operators, and four calls by name. `ast.Attribute`, `ast.Name` outside a call, and `ast.Subscript` all hit the final `raise`. The exponent check stops `9**9**9` from pinning a CPU.
- `follow_redirects=False` on `fetch_url`: an allowlisted host could redirect to an internal address. Refusing redirects closes that door.
- `ctx.evidence[f"doc:{h.id}"]`: document citations use the real chunk id, so on Day 6 the UI can link a footnote to the chunk row. Tool-call citations use a per-run counter because there is no row to point at yet; Day 4 replaces the counter with the `audit` row id.
- Tool descriptions say "cite that id" three times. The description is part of the prompt. The runtime enforces it, but a description that teaches the rule saves retries.

### Check

```
uv run python -m agent.tools
```

Expected: a calc line ending `= 0.08421...`, a count for Garcreek Cir, three `blocked` lines for the bad SQL (the `pg_sleep` one takes 5 s and reports the timeout), one `blocked calc`, two doc chunks, and `evidence ids: ['calc:1', 'doc:..', 'doc:..', 'sql:2']`. Failure: `password authentication failed for user "app_ro"` means the migration did not run; check `schema_migrations`.

---

## Step 5 · The runtime: `agent/runtime.py`, `agents/*.yaml`, `prompts/*.yaml`

### What you are building and why

The agent loop: send the question and the tool schemas to Claude, get back either text or tool calls, run each tool, append the results as a user turn, repeat. Three rules make it a runtime rather than a demo. **A step cap**: 12 model calls, then the model is forced to answer with whatever it has. **A forced schema**: the final answer is not prose. It is a call to an `answer` tool whose input schema is `Answer{answer, citations, confidence}`, validated by Pydantic. On the last step, `tool_choice` forces that tool so the model cannot dodge. **Citation validation**: every citation id must be in the evidence dictionary. A bad id goes back to the model as an error result once; a second bad answer fails the run with exit code 2.

Agents and prompts are YAML, not Python. `agents/planner.yaml` names a model, a prompt, a prompt version, a step cap, and the allowed tools. The runtime sends only those tools' schemas, so a tool that is not allowed does not exist for that agent. `prompts/planner.yaml` carries a `version` field; the agent file pins the version and the loader refuses a mismatch. That is how you answer "how do you know which prompt produced this trace?"

Today the planner does the whole job itself. From Day 4 the events let it delegate to `research`, `sql`, `finance`, and `report`; their YAML files exist now so the routing has something to route to.

### Do this

`prompts/planner.yaml`:

```yaml
name: planner
version: 1
system: |
  You are a due-diligence analyst for one tenant. You answer only from tool results.

  Rules:
  1. Every number and every factual claim in your final answer must cite an evidence id
     that appeared in a tool result: doc:<id>, sql:<n>, calc:<n>, url:<n>.
  2. Never do arithmetic yourself. Call calc, then cite the calc id.
  3. Use sql_query for parcels, permits and appraisal history; use search_docs for
     plans, reports and filings. Use at most 10 tool calls, then finish with the answer tool.
  4. If the data does not support an answer, say so and set confidence below 0.4.

  Schema available to sql_query (all Austin, TX public records):
    parcels(prop_id, situs_address, situs_city, situs_zip, owner_name, legal_desc,
            land_sqft, year_built, appraised_value, market_value, tax_year)
    parcel_values(prop_id, tax_year, appraised_value)   -- one row per property per year
    permits(permit_num, permit_type, description, address, issued_date, status, valuation)
  Street matching: situs_address ILIKE '%Garcreek Cir%'. Median: percentile_cont(0.5) WITHIN GROUP (ORDER BY x).
  Finish by calling the `answer` tool.
```

Create `prompts/research.yaml`, `prompts/sql.yaml`, `prompts/finance.yaml`, `prompts/report.yaml` with the same shape, `version: 1`, and a one-paragraph `system` describing the specialist's job. Then `agents/planner.yaml`:

```yaml
name: planner
model: claude-sonnet-5
prompt: planner
prompt_version: 1
max_steps: 12
tools: [search_docs, sql_query, calc, fetch_url, send_email]
```

The other four, same shape:

| file | tools |
|------|-------|
| `agents/research.yaml` | `[search_docs, fetch_url]` |
| `agents/sql.yaml` | `[sql_query]` |
| `agents/finance.yaml` | `[sql_query, calc]` |
| `agents/report.yaml` | `[]` |

`agent/runtime.py`:

```python
"""Agent runtime: tool loop, hard step cap, forced and validated Answer schema, JSONL trace.
Usage: python -m agent.runtime --tenant demo "Median appraised value on Garcreek Cir and change vs last year?"
"""
import argparse
import json
import os
import sys
import time
import uuid
from pathlib import Path

import anthropic
import psycopg
import yaml
from pydantic import BaseModel, Field, ValidationError

from agent.tools import TOOLS, ApprovalRequired, ToolContext, ToolError

ROOT = Path(__file__).resolve().parent.parent
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
TRACES = ROOT / "traces"
# Fill from the current Anthropic pricing page for the model in agents/*.yaml. USD per million tokens.
PRICE_IN = float(os.environ.get("PRICE_IN_PER_MTOK", "3"))
PRICE_OUT = float(os.environ.get("PRICE_OUT_PER_MTOK", "15"))


class Citation(BaseModel):
    id: str
    claim: str


class Answer(BaseModel):
    answer: str
    citations: list[Citation] = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0)


ANSWER_TOOL = {
    "name": "answer",
    "description": "Deliver the final answer. Call this exactly once, when done.",
    "input_schema": {
        "type": "object",
        "properties": {
            "answer": {"type": "string", "description": "The memo text. Reference citation ids inline like [sql:1]."},
            "citations": {"type": "array", "minItems": 1, "items": {"type": "object", "properties": {
                "id": {"type": "string", "description": "An evidence id from a tool result"},
                "claim": {"type": "string", "description": "The sentence or number this id supports"}},
                "required": ["id", "claim"]}},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
        "required": ["answer", "citations", "confidence"],
    },
}


def load_agent(name: str) -> dict:
    cfg = yaml.safe_load((ROOT / "agents" / f"{name}.yaml").read_text(encoding="utf-8"))
    prompt = yaml.safe_load((ROOT / "prompts" / f"{cfg['prompt']}.yaml").read_text(encoding="utf-8"))
    if prompt["version"] != cfg["prompt_version"]:
        raise SystemExit(f"agent {name} pins prompt {cfg['prompt']}@{cfg['prompt_version']} but file is v{prompt['version']}")
    cfg["system"] = prompt["system"]
    return cfg


class Trace:
    def __init__(self, run_id: str):
        TRACES.mkdir(exist_ok=True)
        self.path = TRACES / f"{run_id}.jsonl"
        self.t0 = time.time()

    def event(self, kind: str, **data):
        rec = {"t_ms": round(1000 * (time.time() - self.t0)), "kind": kind, **data}
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, default=str) + "\n")
        summary = " ".join(f"{k}={str(v)[:60]!r}" for k, v in data.items() if k not in ("content", "input"))
        print(f"{rec['t_ms']:6d} ms  {kind:18} {summary}")


def validate_answer(raw: dict, evidence: dict[str, str]) -> tuple[Answer | None, str]:
    try:
        ans = Answer.model_validate(raw)
    except ValidationError as e:
        return None, f"answer did not match schema: {e.errors()[0]['msg']} at {e.errors()[0]['loc']}"
    missing = sorted({c.id for c in ans.citations} - set(evidence))
    if missing:
        return None, f"unknown citation ids {missing}. Cite only ids that appeared in tool results: {sorted(evidence)}"
    return ans, ""


def run(question: str, tenant: str, agent_name: str = "planner") -> Answer:
    cfg = load_agent(agent_name)
    tools = [TOOLS[n].spec() for n in cfg["tools"]] + [ANSWER_TOOL]
    client = anthropic.Anthropic()
    run_id = str(uuid.uuid4())
    trace = Trace(run_id)
    usage = {"input": 0, "output": 0}
    messages = [{"role": "user", "content": question}]
    bad_answers = 0
    trace.event("run_started", run_id=run_id, tenant=tenant, agent=agent_name, prompt=f"{cfg['prompt']}@{cfg['prompt_version']}", question=question)

    with psycopg.connect(DATABASE_URL) as conn:
        ctx = ToolContext(conn=conn, tenant=tenant)
        for step in range(1, cfg["max_steps"] + 1):
            forced = step == cfg["max_steps"]
            t0 = time.time()
            resp = client.messages.create(
                model=cfg["model"], max_tokens=2048, system=cfg["system"], tools=tools,
                tool_choice={"type": "tool", "name": "answer"} if forced else {"type": "auto"},
                messages=messages,
            )
            usage["input"] += resp.usage.input_tokens
            usage["output"] += resp.usage.output_tokens
            trace.event("llm_call", step=step, forced=forced, ms=round(1000 * (time.time() - t0)),
                        in_tokens=resp.usage.input_tokens, out_tokens=resp.usage.output_tokens, stop=resp.stop_reason)
            messages.append({"role": "assistant", "content": resp.content})

            tool_uses = [b for b in resp.content if b.type == "tool_use"]
            if not tool_uses:
                messages.append({"role": "user", "content": "Finish by calling the `answer` tool."})
                continue

            results = []
            for tu in tool_uses:
                if tu.name == "answer":
                    ans, err = validate_answer(tu.input, ctx.evidence)
                    if ans:
                        cost = (usage["input"] * PRICE_IN + usage["output"] * PRICE_OUT) / 1e6
                        trace.event("answer", citations=[c.id for c in ans.citations], confidence=ans.confidence,
                                    steps=step, tokens=usage, cost_usd=round(cost, 4))
                        return ans
                    bad_answers += 1
                    trace.event("answer_rejected", reason=err)
                    if bad_answers >= 2:
                        raise SystemExit(f"run {run_id} failed: {err}")
                    results.append({"type": "tool_result", "tool_use_id": tu.id, "content": err, "is_error": True})
                    continue

                t1 = time.time()
                try:
                    out = TOOLS[tu.name].fn(ctx, **tu.input)
                    trace.event("tool", step=step, name=tu.name, ms=round(1000 * (time.time() - t1)),
                                input=tu.input, evidence=[k for k in ctx.evidence][-8:])
                    results.append({"type": "tool_result", "tool_use_id": tu.id, "content": out})
                except ToolError as e:
                    trace.event("tool_error", step=step, name=tu.name, error=str(e))
                    results.append({"type": "tool_result", "tool_use_id": tu.id, "content": str(e), "is_error": True})
                except ApprovalRequired as e:
                    trace.event("approval_requested", step=step, name=tu.name, detail=str(e))
                    results.append({"type": "tool_result", "tool_use_id": tu.id, "is_error": True,
                                    "content": "This action needs human approval and is paused. Do not retry it; finish with what you have."})
            messages.append({"role": "user", "content": results})

    raise SystemExit(f"run {run_id} failed: no valid answer within {cfg['max_steps']} steps")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("question")
    ap.add_argument("--tenant", default="demo")
    ap.add_argument("--agent", default="planner")
    a = ap.parse_args()
    ans = run(a.question, a.tenant, a.agent)
    print("\n" + ans.answer)
    for c in ans.citations:
        print(f"  [{c.id}] {c.claim}")
    print(f"confidence {ans.confidence:.2f}")
    sys.exit(0)
```

### Understand every non-obvious line

- `messages.append({"role": "assistant", "content": resp.content})`: the model's own turn, including its `tool_use` blocks, goes back into history verbatim. If you send only the text, the API rejects the next `tool_result` because it has no matching `tool_use_id`.
- One `user` turn carries all `tool_result` blocks for a step. The model may request several tools at once; each result must be in the same reply, in a list, or the API errors.
- `tool_choice={"type": "tool", "name": "answer"}` on the last step: the model must emit a call to `answer` and cannot reply with prose. Before the last step `auto` lets it choose tools. A middle ground, `{"type": "any"}`, forces some tool but not which; you do not want that, because a model that is done should be able to answer early.
- `is_error: True` on a result tells the model the tool failed, so it reads the message as feedback rather than data. A rejected answer goes back the same way, with the list of valid ids, and the model almost always fixes it on the retry.
- `bad_answers >= 2` then `SystemExit`: fail loudly. The alternative, stripping bad citations and returning the rest, produces a memo whose numbers have no source. The brief forbids that.
- `Field(min_length=1)` on citations and the JSON `minItems: 1`: the same constraint in both the schema the model sees and the validator the code runs. If they drift, the model produces valid-looking output that your code rejects.
- Prompt version is pinned in the agent file and written into the first trace event. Change a prompt, bump the version, and every trace says which one it ran under.
- Cost is computed from token counts and two constants. Check the constants against the pricing page for the model you pinned; the number goes on the trace, and on Day 4 it decrements the tenant budget.

### Check

```
uv run python -m agent.runtime --tenant demo "How many parcels are on Garcreek Cir?"
```

Expected trace: `run_started`, `llm_call`, `tool name='sql_query'`, `llm_call`, `answer citations=['sql:1']`, then the answer with one citation. Two model calls, under 10 seconds. Failure: `AuthenticationError` means the key is not in the environment of the shell you are in; `uv run` does not read `.env` by itself, so `export ANTHROPIC_API_KEY=...` or use `uv run --env-file .env`.

---

## Step 6 · ADR-001: pgvector vs Qdrant vs OpenSearch

### What you are building and why

An Architecture Decision Record is one page: context, options, decision, tradeoff, evidence. It exists so that when someone asks "why not Pinecone?" you have an answer you wrote when you knew the most about it. Today's ADR ends with `evidence: Day 12` because you have not measured anything yet, and saying so is better than pretending.

### Do this

`docs/adr/ADR-001-pgvector-vs-qdrant-vs-opensearch.md`:

```markdown
# ADR-001: Vector store — pgvector vs Qdrant vs OpenSearch

Status: accepted 2026-09-05. Evidence: Day 12 benchmark (recall@8, p95 latency, ops cost) will confirm or reverse.

## Context
Chunks carry tenant_id and must be searched by vector similarity and keywords, filtered by tenant, in one system that also holds parcels, runs and audit. Corpus today: ~<n> chunks, one tenant. Week 2 target: 5M chunks, 50 tenants.

## Options
- **pgvector (chosen).** Embeddings live next to the rows. One transaction, one backup, and Day 5's row-level security covers vector queries for free. HNSW recall is good; filtered search degrades when a tenant filter is very selective because HNSW does not know about the filter. Keyword ranking is ts_rank_cd, not true BM25.
- **Qdrant.** Purpose-built, fast filtered HNSW with payload indexes, true multi-tenancy sharding. Costs a second datastore, a second set of credentials to isolate per tenant, and dual writes to keep in sync with Postgres.
- **OpenSearch.** True BM25 plus k-NN in one engine, mature at scale. Heaviest to operate (JVM, shards), and tenant isolation is index-per-tenant or a filter clause the application must remember.

## Decision
pgvector, because isolation enforced by the database is the property this project is selling, and one store keeps that story simple. Revisit if Day 12 shows filtered recall@8 below 0.9 or p95 above 200 ms at 5M chunks.

## Consequences
- Keyword search is not BM25; a pg_search trial is a Week 2 experiment.
- HNSW parameters (m=16, ef_construction=64, ef_search=100) are untested guesses until Day 12.
```

Fill `<n>` from `SELECT count(*) FROM chunks`.

---

## Run · the one command chain that proves the day

```
uv run python scripts/migrate.py && uv run python -m agent.tools && uv run python -m agent.runtime --tenant demo "Median appraised value on Garcreek Cir and change vs last year?"
```

Then the checks from the plan row:

```
cat traces/$(ls -t traces | head -1)
```

**Trace shows sql_query → calc → cited answer.** You should see `tool name='sql_query'` at least once (median for the current year, and the prior year from `parcel_values`, in one query or two), then `tool name='calc'` with an expression like `(m2026 - m2025) / m2025`, then `answer citations=[...]`. If the model skipped `calc` and did the division itself, the prompt rule was not strong enough: bump `prompts/planner.yaml` to version 2, pin it in the agent file, rerun.

**Every citation id exists.** Cross-check by hand once, then trust the code:

```
uv run python - <<'EOF'
import json, pathlib
p = max(pathlib.Path("traces").glob("*.jsonl"), key=lambda x: x.stat().st_mtime)
ev = [json.loads(l) for l in p.read_text().splitlines()]
seen = {e for r in ev if r["kind"] == "tool" for e in r["evidence"]}
ans = next(r for r in ev if r["kind"] == "answer")
print("missing:", set(ans["citations"]) - seen, "| tokens:", ans["tokens"], "| cost:", ans["cost_usd"])
EOF
```

Expected: `missing: set()`. Add the token and cost numbers, the reranker timing from Step 2, and the run's step count to BENCHMARKS.md under a "Day 3" heading.

Commit: `git add -A && git commit -m "Day 3: hybrid retrieval with RRF, bge reranker, read-only SQL tool, safe calc, agent runtime with forced cited Answer, ADR-001"` and push.

---

## Defend · 30 minutes that make tomorrow's interview answer

1. **FAILURES.md.** At least one line, format `2026-09-05 · tried X · saw Y · changed to Z · result`. Candidates from today: the synthetic prior-year values in `parcel_values` (you must log this one); the model answering in prose instead of calling `answer` and how the nudge message fixed it; `websearch_to_tsquery` returning nothing for a street name because "Cir" is a stop word or the chunks do not mention it; the 512-token truncation in the reranker; the first `pg_sleep` test that made you wait 5 s.
2. **Three sentences** in your log: "In an interview I'd describe today's work as…" What you built, one decision and why, one number. A good number: reranker latency for 30 candidates, or tokens and cost for the Garcreek run.
3. **Six levels, out loud, on one decision.** Pick from: Why RRF instead of a weighted sum of scores, and what breaks if one search returns an empty list? Why is the SQL guard two layers, and which layer would catch `SELECT * FROM users`? Why is the citation check in code and not in the prompt, and what does the run do on the second bad answer? If an answer is "I think," write it as a Day 7 or Day 11 experiment.
4. **ADR-001.** Read it once more and decide whether the decision paragraph is something you would say to a hiring manager. If you would hedge, fix the ADR, not the interview. The evidence line stays "Day 12" until you have the numbers.

Tomorrow (Day 4) this loop moves into a Kafka worker, each `trace.event` becomes an event on the topic, and `ApprovalRequired` becomes a gate you click. Log the session with "Day 3 done" so the site advances.
