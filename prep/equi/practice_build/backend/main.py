"""
Equi Practice Build — Backend
================================
Simulates the kind of full-stack + AI engineering task you'd plausibly get
in a live coding round or take-home for the Founding Engineer / Applied AI
Lead role: a small API surface for browsing investment fund data, plus a
RAG endpoint that answers natural-language questions over fund documents
with traceable citations.

WHY THIS DESIGN (read this before extending):
- Chunking is paragraph/sentence-aware, not naive fixed-size, and every
  chunk carries metadata (fund_name, doc_type, doc_date, doc_id) so a
  retrieved chunk is never separated from the context that makes a number
  meaningful. This directly addresses the chunking pitfall covered in the
  study guide (Part 4.2, item 2).
- Retrieval is metadata-filterable BEFORE semantic scoring, mirroring the
  "scope first, then search" pattern real investment queries need (a
  question about Fund A shouldn't surface chunks from Fund B just because
  the wording is similar).
- TF-IDF cosine similarity stands in for a real embedding model here
  (no external API key in this sandbox) -- in production this slot is
  where you'd call an embedding endpoint (OpenAI, Voyage, a local model,
  etc.) and store vectors in pgvector. The retrieval INTERFACE is what
  matters for the interview; swapping TF-IDF for real embeddings later
  is a one-function change (see `embed_query` / `embed_chunk`).
- Every answer is grounded: the LLM response (or, here, an extractive
  stand-in since no model API key is available in this sandbox) must
  cite the doc_id(s) it drew from, and the API returns those citations
  alongside the answer so the frontend can show "source: doc_003" links.
  This is the single most important property of investment-context RAG
  (Part 4.2, item 5 in the guide) -- never let a number appear ungrounded.

Run:
    pip install fastapi uvicorn scikit-learn --break-system-packages
    uvicorn main:app --reload --port 8000

Then visit http://localhost:8000/docs for interactive API docs.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import json
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI(title="Equi Practice Build — Fund Data + RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for local practice; would be locked down in production
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent.parent / "data" / "fund_documents.json"


# ──────────────────────────────────────────────────────────────────────────
# Pydantic models — request/response validation at the API boundary.
# Mentioning Pydantic/Zod-style boundary validation unprompted in a live
# round is exactly the kind of thing covered in guide Part 3.2.
# ──────────────────────────────────────────────────────────────────────────

class FundDocument(BaseModel):
    doc_id: str
    fund_name: str
    doc_type: str
    doc_date: str
    content: str


class Chunk(BaseModel):
    chunk_id: str
    doc_id: str
    fund_name: str
    doc_type: str
    doc_date: str
    text: str


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2_000)
    fund_name: Optional[str] = Field(default=None, max_length=200)
    top_k: int = Field(default=3, ge=1, le=50)

    @field_validator("question", mode="before")
    @classmethod
    def strip_question(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("question must not be blank or whitespace-only")
        return stripped


class Citation(BaseModel):
    chunk_id: str
    doc_id: str
    fund_name: str
    doc_type: str
    doc_date: str
    excerpt: str
    relevance_score: float


class AskResponse(BaseModel):
    question: str
    answer: str
    citations: list[Citation]
    note: str


# ──────────────────────────────────────────────────────────────────────────
# Data loading + chunking
# ──────────────────────────────────────────────────────────────────────────

def load_documents() -> list[dict]:
    with open(DATA_PATH) as f:
        return json.load(f)


def chunk_document(doc: dict) -> list[dict]:
    """
    Sentence-group chunking: split into sentences, then group into chunks
    of 2-3 sentences so each chunk is a coherent, self-contained unit that
    keeps a financial figure attached to its context (the fund, the period,
    the metric it describes). Every chunk inherits the parent doc's
    metadata — this is what makes citations meaningful downstream.

    In production with longer/more heterogeneous documents (PDFs with
    actual tables), you'd add: table-aware extraction so tables become
    single atomic chunks rather than being shredded sentence-by-sentence.
    """
    sentences = re.split(r'(?<=[.!?])\s+', doc["content"].strip())
    chunks = []
    group_size = 2
    for i in range(0, len(sentences), group_size):
        group = sentences[i:i + group_size]
        text = " ".join(group).strip()
        if not text:
            continue
        chunks.append({
            "chunk_id": f"{doc['doc_id']}_chunk_{i // group_size}",
            "doc_id": doc["doc_id"],
            "fund_name": doc["fund_name"],
            "doc_type": doc["doc_type"],
            "doc_date": doc["doc_date"],
            "text": text,
        })
    return chunks


# Build the chunk index once at startup (in production: a batch/streaming
# ingestion job, not an in-memory list — but the chunking LOGIC is identical).
ALL_DOCS = load_documents()
ALL_CHUNKS = [c for doc in ALL_DOCS for c in chunk_document(doc)]
CHUNK_TEXTS = [c["text"] for c in ALL_CHUNKS]

# TF-IDF as a stand-in for a real embedding model (see module docstring).
VECTORIZER = TfidfVectorizer(stop_words="english")
CHUNK_VECTORS = VECTORIZER.fit_transform(CHUNK_TEXTS)


def embed_query(query: str):
    """
    Swap point for a real embedding model. In production:
        return openai_client.embeddings.create(input=query, model=...).data[0].embedding
    Here: project the query into the same TF-IDF space as the chunks.
    """
    return VECTORIZER.transform([query])


def retrieve(question: str, fund_name: Optional[str], top_k: int) -> list[dict]:
    """
    Retrieval pipeline:
      1. Metadata filter FIRST if a fund is specified (scope before search —
         guide Part 4.2 item 3). This prevents a query about Fund A's returns
         from surfacing Fund B's similarly-worded returns paragraph.
      2. Semantic similarity scoring within the scoped candidate set.
      3. Return top_k chunks with their similarity score attached, so the
         caller can reason about retrieval confidence, not just get a blob.
    """
    candidate_indices = list(range(len(ALL_CHUNKS)))
    if fund_name:
        candidate_indices = [
            i for i in candidate_indices
            if ALL_CHUNKS[i]["fund_name"].lower() == fund_name.lower()
        ]
        if not candidate_indices:
            return []

    query_vec = embed_query(question)
    candidate_vectors = CHUNK_VECTORS[candidate_indices]
    sims = cosine_similarity(query_vec, candidate_vectors).flatten()

    ranked = sorted(zip(candidate_indices, sims), key=lambda x: x[1], reverse=True)
    top = ranked[:top_k]

    return [
        {**ALL_CHUNKS[idx], "score": float(score)}
        for idx, score in top
        if score > 0  # don't return zero-relevance noise
    ]


def generate_grounded_answer(question: str, retrieved: list[dict]) -> str:
    """
    Stand-in for an LLM generation call (no model API key available in this
    sandbox). In production this is where you'd call Claude/GPT with a
    prompt like:

        "Answer the question using ONLY the provided excerpts. Cite the
         doc_id for every factual claim. If the excerpts don't contain
         the answer, say so explicitly rather than guessing."

    The critical property to preserve when you swap this in for real:
    the model must never state a figure that isn't traceable to a
    specific retrieved chunk. This extractive stand-in enforces that
    property by construction — it can only quote what was retrieved.
    """
    if not retrieved:
        return "No relevant information was found in the available fund documents for this question."

    lines = [f"Based on {len(retrieved)} relevant excerpt(s):"]
    for r in retrieved:
        lines.append(f"— [{r['doc_id']}, {r['fund_name']}, {r['doc_type']} dated {r['doc_date']}]: {r['text']}")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────

@app.get("/api/funds", response_model=list[str])
def list_funds():
    """Distinct fund names available — powers a filter dropdown in the UI."""
    return sorted({doc["fund_name"] for doc in ALL_DOCS})


@app.get("/api/documents", response_model=list[FundDocument])
def list_documents(fund_name: Optional[str] = Query(default=None, max_length=200)):
    """List fund documents, optionally filtered by fund — the basic browse endpoint."""
    docs = ALL_DOCS
    if fund_name:
        docs = [d for d in docs if d["fund_name"].lower() == fund_name.lower()]
        if not docs:
            raise HTTPException(status_code=404, detail=f"No documents found for fund '{fund_name}'")
    return docs


@app.post("/api/ask", response_model=AskResponse)
def ask(req: AskRequest):
    """
    The core RAG endpoint. Takes a natural-language question, optionally
    scoped to a fund, retrieves the most relevant chunks, and returns a
    grounded answer WITH citations — never a bare answer.
    """
    retrieved = retrieve(req.question, req.fund_name, req.top_k)
    answer = generate_grounded_answer(req.question, retrieved)

    citations = [
        Citation(
            chunk_id=r["chunk_id"], doc_id=r["doc_id"], fund_name=r["fund_name"],
            doc_type=r["doc_type"], doc_date=r["doc_date"], excerpt=r["text"],
            relevance_score=round(r["score"], 3),
        )
        for r in retrieved
    ]

    return AskResponse(
        question=req.question,
        answer=answer,
        citations=citations,
        note=(
            "This practice build uses TF-IDF retrieval and extractive generation "
            "as a stand-in for a real embedding model + LLM call (no API key in "
            "this sandbox). The retrieval/citation INTERFACE is production-shaped; "
            "see module docstring for the two swap points."
        ),
    )


@app.get("/health")
def health():
    return {"status": "ok", "documents_loaded": len(ALL_DOCS), "chunks_indexed": len(ALL_CHUNKS)}
