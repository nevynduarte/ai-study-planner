# Equi Practice Build — Fund Research RAG App

A small, fully working full-stack + AI engineering practice project simulating
the kind of live-coding round or take-home exercise you'd plausibly get for
the Founding Engineer / Applied AI Lead role at Equi.

## What's here

```
practice_build/
├── data/
│   └── fund_documents.json     synthetic fund letters + due diligence memos
├── backend/
│   └── main.py                 FastAPI: fund browsing + citation-grounded RAG
└── frontend/
    └── page.tsx                Next.js App Router page (fund browser + Q&A UI)
```

## Running it

```bash
cd backend
pip install fastapi uvicorn scikit-learn --break-system-packages
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive API docs, or test directly:

```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the loss rate history?", "fund_name": "Brightwater Credit Opportunities Fund II"}'
```

The frontend (`frontend/page.tsx`) is written as a real Next.js App Router
page. To run it as an actual app: `npx create-next-app@latest`, then drop
this file in as `app/page.tsx` (point `API_BASE` at your running backend).

## Why this design (study before your interview, not just after)

This isn't meant to be copied verbatim — it's meant to be **understood well
enough that you could rebuild it from memory while narrating your reasoning
out loud**, which is exactly what a live round tests. Read the docstrings in
`main.py` and the comments in `page.tsx` closely. They explain:

- Why chunking is sentence-group-based with metadata attached to every chunk
  (never separate a number from the fund/period/document that gives it
  meaning — the single most common RAG failure mode in finance)
- Why retrieval filters by fund **before** scoring relevance, not after
- Why every answer returns citations, never a bare claim
- Exactly where you'd swap in a real embedding model and a real LLM call
  (two clearly marked functions: `embed_query` and `generate_grounded_answer`)
- Where a real Next.js app would split Server vs. Client Components, and why

## Extension exercises — do these yourself, timed

Treat each of these as a mini take-home. Set a timer for 30-45 minutes each.

1. **Add hybrid retrieval.** Right now retrieval is pure TF-IDF similarity.
   Add an exact-match boost: if the question contains a number, fund name,
   or specific term that appears verbatim in a chunk, boost that chunk's
   score. This mirrors the dense+keyword hybrid approach discussed in the
   study guide (Part 4.2, item 3) — financial queries often need exact-match
   precision that pure semantic similarity can miss.

2. **Add a numeric verification guardrail.** Write a function that extracts
   any percentage or dollar figure from the generated answer and checks it
   actually appears in the cited excerpts verbatim. If it doesn't, flag the
   answer as `"verification": "failed"` in the response. This is the
   hallucination guardrail pattern from study guide Part 4.2, item 6.

3. **Add a `/api/funds/{fund_name}/summary` endpoint** that returns a
   one-paragraph synthesized summary of ALL documents for a fund (not just
   a single-question answer). Think about how your chunking and retrieval
   approach needs to change when the "question" is implicitly "summarize
   everything," not a narrow lookup.

4. **Add basic multi-tenancy.** Imagine two different RIA partners each only
   should see a subset of funds. Add a `partner_id` concept and filter
   `/api/funds` and `/api/documents` accordingly. Think out loud about
   row-level filtering vs. separate schemas vs. separate databases — this
   maps directly to study guide Part 5.1.

5. **Add an eval set.** Write 8-10 question/expected-answer pairs based on
   the documents in `fund_documents.json`, then write a small script that
   runs each question through `/api/ask` and checks whether the expected
   fund/figure appears in the citations. This is a tiny version of the
   "how would you know the RAG system is accurate" answer from study guide
   Part 4.3.

Do these without looking at a reference solution first — there isn't one
provided for these five, intentionally. Building them cold under a timer is
the actual practice; if you get stuck, that's useful signal for what to
review in the study guide before Wednesday.
