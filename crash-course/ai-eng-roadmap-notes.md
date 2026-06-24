# AI Engineering Roadmap — Notes for the Plan

Source: **"The Agentic AI Engineer Roadmap"** by Akshay (@SystemsByAkshay, v1.0 2026),
saved in the repo root as `akshayratnawat.github.io.htm`. Structured in 4 phases:
**Foundations → Production RAG → Agents & Orchestration → Production Systems** (~4 months
part-time). These are the bits worth pulling into the Atlas-FoF crash course + interview prep.

## It validates the crash course
- Atlas-FoF already covers **Phase 2 (RAG)** and **Phase 4 (evals/observability)** — the two
  highest-leverage phases. Our **pgvector + hybrid + rerank + citations + eval** design matches
  the roadmap's recommendations point-for-point.
- Their #1 architecture rule: **"long context first, RAG only when scale/freshness/citations
  demand it."** Be ready to say this in a system-design round (RAG vs long-context vs fine-tune).
- "**80% of 'RAG isn't working' is a retrieval problem, not generation.**" Engineer retrieval like data.

## Adopt into specific Atlas-FoF days
- **L2 (backend/RAG):** make **structured outputs** the backbone — `instructor` or provider-native
  `response_format`/tool-calling + Pydantic. "Highest-leverage single pattern." Stop prompting for JSON.
- **L2 (RAG):** add **contextual retrieval** (prepend doc/section context to each chunk before
  embedding) — ~20% retrieval lift for little effort (Anthropic).
- **L6 (eval):** build **all 3 eval layers** — offline (CI) + online (sampled prod, LLM-as-judge)
  + human (weekly). Calibrate the LLM judge to **≥80% agreement** with human labels.

## Interview-gold — name these in rounds
- **4 production failures, in order:** malformed JSON → latency tail (P95 ≫ P50) → cost → drift.
- **5 agent failure modes:** Loop of Doom · Silent Wrong Tool · Phantom Hallucination ·
  Context Overflow · Cascading Error.
- **3 eval layers:** offline / online / human.
- **"System intelligence > model intelligence"** — the engineering around the LLM (validation,
  retries, fallback, guardrails, evals) is the job; the model is interchangeable.

## What to SKIP (matches your no-fluff plan; confirms earlier calls)
- **Fine-tuning** (95% of cases) → deprioritize the 15-Projects guide's Project 10 (LoRA).
- **Multi-agent orchestration** (99%) → deprioritize Project 15. Single agent + good tools beats it
  (Huang 2024: matched/beat multi-agent on 7/10 tasks, 3–5x cheaper, 2–3x faster).
- LangChain/AutoGen/no-code builders for production; transformer internals; "prompt engineer" as a title.
- **Vector DB:** stick with **pgvector** (already are). Safe bets only: pgvector, Qdrant, Pinecone.

## Production Readiness Checklist (use as your system-design spine)
- **Evals:** 30+ test cases; LLM-judge calibrated to humans; runs in CI on every change.
- **Guardrails:** input sanitization, PII redaction, prompt-injection detection, output groundedness,
  action-boundary enforcement, graceful fallback.
- **Observability:** trace every request (model, tokens, latency, cost, tools); dashboards + alerts;
  mechanism to promote prod failures into the eval set.
- **Safety:** tested rollback path, rate limits, human fallback, red-team eval set.
- **UX:** graceful failure handling, clear escalation path, **streaming** for user-facing responses.
- Start with **6 metrics**: error rate, P95 latency, completion rate, cost/session, online-eval score,
  max-turns-hit rate.

## Comp (2026 USA total comp) — for your targets
- **Mid (3–5 yrs):** AI labs **$500–900K** · Big tech **$350–550K** · App cos **$300–550K** · Startups **$250–450K**.
- AI labs pay **1.5–3x** FAANG for equivalent work. Equi/Aaru (startups) → $250–450K matches their bands.
  Discount private-company equity **≥50%** from face value.

## Reading list (highest-signal, by phase)
- **Foundations:** Karpathy "Intro to LLMs"; Simon Willison blog (esp. prompt injection); `instructor`
  docs; Hamel Husain "Your AI Product Needs Evals"; Eugene Yan "Patterns for Building LLM Systems".
- **RAG:** Anthropic "Contextual Retrieval"; Pinecone Learn; Cohere "Reranking for Better RAG";
  Nir Diamant "RAG Techniques" (GitHub).
