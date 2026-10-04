"""Usage: python search.py "what was total revenue in 2025?" """
import os
import sys

import psycopg

DSN = os.environ.get("DATABASE_URL", "postgresql://ew:ew@localhost:5432/ew")

QUERY = """
SELECT doc_id, page, ts_rank(tsv, q) AS score,
       ts_headline('english', text, q, 'MaxFragments=2') AS snippet
FROM pages, websearch_to_tsquery('english', %s) q
WHERE tsv @@ q
ORDER BY score DESC
LIMIT 5
"""

with psycopg.connect(DSN) as conn:
    for doc_id, page, score, snippet in conn.execute(QUERY, (sys.argv[1],)):
        print(f"[{doc_id} p.{page}] {score:.3f}\n  {snippet}\n")
