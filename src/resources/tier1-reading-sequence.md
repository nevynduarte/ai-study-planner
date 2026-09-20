# Tier 1 Reading Sequence
### Eight books → one interview-prep path, keyed to the FDE crash course

Read in this order. Each entry says *what to read, what to skip, and which crash-course section it feeds*. Total targeted reading: ~450 pages over 3–4 weeks, not eight full books. Treat everything not listed as reference.

---

## Phase 1 — This week (before any first-round call)

### 1. AI Engineering — Chip Huyen
**Feeds: crash course §6 (LLM/agent plumbing) — your highest-value interview material.**

Read, in order:
- **Prompt engineering chapter** — structured outputs, prompt versioning, defensive prompting. This is the vocabulary of the Avallon/CollectWise day job.
- **RAG and Agents chapter** — the agent loop (reason → act → observe), tool use, planning failures. Directly answers "how would you build the scheduling/collection/claims agent."
- **Evaluation chapters (both)** — golden sets, LLM-as-judge, why evals are hard. The single most senior-sounding topic you can bring up unprompted.
- **Finetuning chapter** — read the *when to finetune vs prompt vs RAG* decision framework only; skip the mechanics.

Skip: hardware/inference-optimization details, dataset engineering depth.
**Deliverable for yourself:** rewrite the five 60-second answers in crash course §6 using Huyen's terminology + one Bridges AI anecdote each.

### 2. Machine Learning System Design Interview — Aminian & Xu
**Feeds: MLE loops + the "design our system" round FDE interviews borrow from.**

- **Chapter 1 (the framework)** — memorize the step sequence: requirements → metrics → data → features → model → serving → monitoring. Every design answer hangs off this skeleton.
- **Two worked chapters max:** the *recommendation/ranking* one and the *harmful-content or ad-click* one — enough to internalize the rhythm.

Skip the rest of the worked examples for now; return per-interview if a company hints at a domain.

---

## Phase 2 — Next week (before technicals)

### 3. System Design Interview — Alex Xu (vol. 1)
**Feeds: crash course §3 (API integration) and Clarion's backend round.**

- **Rate limiter chapter** — pairs exactly with the retry/backoff snippet you're drilling.
- **Consistent hashing + key-value store chapters** — skim for vocabulary only.
- **Design a notification system** — this is secretly "design a webhook delivery system": retries, dedupe, idempotency. Most FDE-relevant chapter in the book.
- **Design a chat system** — real-time messaging concepts transfer to voice-agent call lifecycles.

Skip: web crawler, YouTube, Google Drive chapters.

### 4. Designing Machine Learning Systems — Chip Huyen
**Feeds: "how do you run agents in production" follow-ups; overlaps AI Engineering, so read surgically.**

- **Data distribution shifts + monitoring chapter** — failure detection in production; your answer to "an agent's performance degraded, what do you do?"
- **Deployment chapter** — batch vs online, shadow deploys, canaries — say "shadow mode" in an interview and watch it land.
- **Human-in-the-loop / feedback sections** — maps to agent escalation design.

Skip everything covered better in AI Engineering (it's the older sibling).

### 5. Generative AI System Design Interview — Aminian & Sheng
**Feeds: the exact "design an AI agent product" question these three companies will ask.**

- **The framework chapter** + **whichever worked example is closest to a chatbot/assistant system.** One evening, in and out.
- As you read, sketch *your* version for each target: "design an AI debt-collection caller," "design a patient-scheduling agent," "design a claims-intake agent." Twenty minutes each, on paper. That sketch is your interview answer.

---

## Phase 3 — Ongoing (30–45 min/day alongside coding drills)

### 6. Hands-On Large Language Models — Alammar & Alt
**Feeds: intuition that makes §6 answers sound *understood* rather than memorized.**

- **Tokens & embeddings chapters** — explains chunking/retrieval failures mechanically.
- **Semantic search / RAG chapter** — the best visual treatment of retrieval pipelines anywhere; read before any interview that mentions RAG.
- **Text generation & prompt chapters** — temperature, sampling, why structured output breaks.

Skip: training-from-scratch and classification-head chapters.

### 7. LLM Engineer's Handbook
**Feeds: production LLM pipeline vocabulary (orchestration, data pipelines, deployment).**

Use as a *reference*, not a read-through — it's built around one long project. Dip into:
- **RAG feature pipeline chapter** — concrete ingestion → chunk → embed → store architecture.
- **Inference/deployment chapter** — latency, streaming, autoscaling talking points (voice AI cares about latency budgets; this is where you get the numbers).

### 8. Build a Large Language Model From Scratch — Raschka (you're 5% in)
**Feeds: depth signal. Not required for any specific question — it's the book that makes you the candidate who *actually knows how the thing works*.**

- Continue linearly through **attention and the GPT architecture chapters**; implementing attention once, by hand, permanently upgrades every transformer answer you give.
- Pause before the pretraining/finetuning chapters until after the interview cycle.

---

## The merge with the crash-course 5-day plan

| Crash-course day | Pair with |
|---|---|
| Day 1 (async drills) | AI Engineering: prompt + agents chapters (evening) |
| Day 2 (Express service) | Alex Xu: notification-system chapter |
| Day 3 (data transforms) | ML System Design Interview: framework chapter |
| Day 4 (SQL + agent answers) | AI Engineering: eval chapters → rewrite the five answers |
| Day 5 (mock take-home) | GenAI System Design: sketch the three company-specific agents |

Alammar, the Handbook, and Raschka run after Day 5 as the maintenance track.

---

## One rule

If an interview lands in less than a week: **AI Engineering's agent + eval chapters, the ML System Design framework chapter, and the three agent sketches.** That's the 20% carrying 80% of the signal. Everything else is compounding, not critical path.
