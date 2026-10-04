"""Load every PDF listed in manifest.json into Postgres, one row per page."""
import hashlib
import json
import os
import sys

import psycopg
from pypdf import PdfReader

DSN = os.environ.get("DATABASE_URL", "postgresql://ew:ew@localhost:5432/ew")


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def main():
    manifest = json.load(open("manifest.json"))
    with psycopg.connect(DSN) as conn:
        conn.execute(open("schema.sql").read())
        for doc in manifest:
            actual = sha256(doc["file"])
            if doc["sha256"] and doc["sha256"] != actual:
                sys.exit(f"{doc['doc_id']}: sha256 mismatch, file changed")
            reader = PdfReader(doc["file"])
            conn.execute("DELETE FROM pages WHERE doc_id = %s", (doc["doc_id"],))
            for i, page in enumerate(reader.pages, start=1):
                conn.execute(
                    "INSERT INTO pages (doc_id, page, text) VALUES (%s, %s, %s)",
                    (doc["doc_id"], i, page.extract_text() or ""),
                )
            print(f"{doc['doc_id']}: {len(reader.pages)} pages (sha256 {actual[:12]})")


if __name__ == "__main__":
    main()
