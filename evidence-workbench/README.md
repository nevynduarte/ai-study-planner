# Evidence Workbench

Ask questions about ~10 public 10-K filings and get answers with page citations, or "not found."

## First session (about 2 hours)

1. `docker compose up -d`
2. `python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt`
3. Download 10 10-K PDFs from SEC EDGAR into `data/` and list each one in `manifest.json`
   (fill `sha256` with `sha256sum data/*.pdf`).
4. `python ingest.py`
5. `python search.py "total revenue 2025"`

Done when one command loads the documents and one query returns the right pages.

## Next (Oct 5–11)
Add `/ask` (FastAPI): take the top pages from `search.py`, send them to Claude, and require a
structured answer that cites `doc_id` + `page` or abstains. Write this part yourself first.
