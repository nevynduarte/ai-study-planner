# Unified AI/ML project list — sourced from the 2026 "projects that get you hired" lists

**Compiled 2026-09-05** from nine widely-circulated project lists (sources and
scrape status at the bottom). Deduplicated across sources, scored, and mapped
onto the existing plan: the four tracks in `public/curriculum.json` (AI Eng 40%,
ML Eng 25%, DS 20%, Quant/Alt-Data 15%) and the five portfolio platforms in
`crash-course/PORTFOLIO.md`.

**This is an idea bank, not a new plan.** The Week 1–5 portfolio build stands.
Use this file for two things: (a) confirming the portfolio already covers the
high-signal items, and (b) picking a *small* filler project when a track needs a
demonstrable artifact the platforms don't produce.

---

## The one thing every source agreed on

All nine sources, including the two that gave a single opinionated answer rather
than a list (Towards Data Science; Aishwarya Srinivasan), converge on the same
claim: **the model is not the project.** What is scored is everything after
training — deployment, monitoring, drift, retraining, evaluation, cost, and a
live URL a stranger can open. The TDS piece goes furthest: no canned dataset,
pick a domain you actually care about, and make the project *novel to you*.

Consequence for this plan: a tutorial-shaped project (Titanic, MNIST, "predict
house prices") is worth ~zero regardless of how many lists include it. Those
appear below marked **[table stakes]** — build only if a specific interview
demands the vocabulary, timebox to one day, never put one on the résumé alone.

---

## Tier 1 — Highest cross-list consensus, highest hiring signal

Appeared in 5+ sources, and in every source that emphasized production.

| # | Project | Sources | Track | Already covered by |
|---|---------|---------|-------|--------------------|
| 1 | **End-to-end MLOps pipeline** — train → registry → serve → drift detect → auto-retrain, IaC + CI/CD | Scaler (#10), Srinivasan (#1, #4), Sayantani, EWC, Reddit | ML Eng | **Week 3 `ml-platform`** |
| 2 | **RAG document Q&A with source attribution** — chunking, hybrid retrieval, rerank, citations | Scaler (#8), Srinivasan (#2), EWC (#37), stasbel (PDF assistants), Reddit | AI Eng | **Week 1 + Week 2** |
| 3 | **Multi-agent / tool-calling agent system** — planner + specialists, MCP, approval gates, traces | stasbel (agentic workflows), EWC (Cat. 05), Reddit, YouTube roadmap | AI Eng | **Week 1 `agent-platform`** |
| 4 | **Model drift monitoring in production** — Evidently/WhyLabs, scheduled retrain, Grafana | Srinivasan (#4), Scaler (#10), Sayantani | ML Eng | **Week 3** (partial — see gaps) |
| 5 | **Fine-tuned LLM for a niche domain** — QLoRA/LoRA/DPO on collected domain data, then served | Scaler (#9), Srinivasan (#3), EWC (#36) | AI Eng | **Week 5 `nevyn-lm`** |
| 6 | **Streaming data platform** — Kafka → Spark/Delta → medallion layers at real scale | Sayantani (MLOps half), EWC, Reddit | ML Eng / Quant | **Week 2 `data-platform`** |
| 7 | **LLM evaluation harness** — golden set, LLM-judge, human agreement, abstention, CI gate | Srinivasan, EWC, TDS (rigor), Reddit | AI Eng | **Week 1 Day 7** |

**Read: the existing 5-week portfolio already covers all seven.** That is the
main finding of this exercise — the plan does not need to change.

---

## Tier 2 — Real signal, not yet covered by the portfolio

Worth building as a filler day, or worth *bolting onto* an existing platform
rather than starting a repo. Bolt-on is almost always the better move: it adds a
row to an existing `BENCHMARKS.md` instead of a sixth README nobody reads.

| # | Project | Track | How to attach |
|---|---------|-------|---------------|
| 8 | **Recommender / ranking system** (collaborative + content + neural embeddings, offline metrics) | DS | New — genuinely absent from all five platforms. The one real gap. |
| 9 | **Hierarchical demand forecasting** (Prophet + LightGBM, SKU-level, reconciliation) | Quant / DS | New — closest thing to alt-data forecasting on any list. |
| 10 | **Imbalanced-class fraud detection** (SMOTE vs. weighted loss, PR-AUC not accuracy, cost matrix) | ML Eng / DS | Bolt onto `ml-platform` as the model it trains and drifts. |
| 11 | **Explainability layer** (SHAP for tabular, Grad-CAM for vision) | DS | Bolt onto whatever model `ml-platform` serves. Regulated-domain interviews ask. |
| 12 | **Multimodal app** (VLM: image → structured output, Qwen-VL / LLaVA / Florence-2) | AI Eng | Bolt onto `agent-platform` as a tool: PDF page image → extracted table. |
| 13 | **Semantic resume/JD matcher** (embeddings + ranking) | AI Eng | Only if you want a self-serving demo. Low novelty — it is on 3 lists *because* it is easy. |
| 14 | **Time-series price forecasting with proper backtesting** (walk-forward, no leakage) | Quant | New, small. Value is entirely in the leakage discipline, not the LSTM. |
| 15 | **Autonomous SWE agent** (issue → tested PR, SWE-bench) | AI Eng | **Week 4** — appeared only in the YouTube roadmap and Reddit, but is the highest-ceiling item on any list. |

---

## Tier 3 — [table stakes] Tutorial-shaped, low differentiation

Present on many lists, near-zero hiring signal in 2026. Listed for completeness
so the decision to skip them is explicit and recorded.

Flight fare / house price / gold price / car price / salary prediction ·
Titanic-class loan eligibility · wine quality · earthquake prediction ·
IPL score prediction · spam email classifier · fake news detector ·
sentiment analysis on product reviews · movie recommender on MovieLens ·
customer segmentation · plant disease CNN · animal species classifier ·
face mask detection · age/gender detection · hand gesture recognition ·
license plate OCR · image captioning · sign language recognition ·
violence detection in video · autocorrect/autocomplete · text summarizer ·
hate speech detection · language translator · text completion with GPT-2 ·
chest X-ray pneumonia detection · heart disease detection.

Two of these are worth one day each *if* a target role names them:
**pneumonia detection with Grad-CAM** (only medical-imaging roles) and
**churn prediction with SHAP-driven campaign targeting** (only if a business-
facing DS interview wants the framing rather than the model).

---

## What this changes in the plan

1. **Nothing in Weeks 1–5.** The consensus Tier 1 list is already the portfolio.
2. **Add a recommender/ranking artifact (#8)** — the single genuine gap across
   all four tracks. Candidate slot: a Week 3 buffer day, training a ranking model
   inside `ml-platform` so it reuses the registry, serving, and drift plumbing.
3. **Add explainability (#11) and imbalanced-class handling (#10)** as bolt-ons
   to the `ml-platform` model rather than new repos.
4. **Forecasting (#9/#14)** is the weakest-covered track (Quant/Alt-Data, 15%).
   The TCAD/permits corpus already in the plan supports a real hierarchical
   forecast — parcel value or permit volume by geography — with no new data work.
5. **Follow the TDS rule everywhere:** every project needs one non-obvious
   decision you can defend, which the existing ADR-per-choice rule already enforces.

---

## Sources and scrape status

| Source | Status | Notes |
|--------|--------|-------|
| LinkedIn — stasbel, "30 AI/ML projects that will get you hired" | ⚠️ **Partial** | Only ~11 of the 30 are named in the post body; the full list lives in a linked GitHub repo. Categories recovered: regression, classification, GenAI, CV, agentic. |
| Towards Data Science — "The exact ML project that gets you hired" | ✅ Full | Gives a *framework*, not a list. One example (NFL fantasy optimization). Its stack advice is folded in above. |
| Medium — iamsayantani, "50 projects…ML or MLOps" | ❌ **Blocked** | HTTP 403 — Medium member-only paywall. **Not scraped.** Its themes were inferred from the title and cross-referenced titles only; treat its row above as unverified. |
| LinkedIn — Aishwarya Srinivasan | ✅ Full | 5 projects, all Tier 1. The most production-focused source. |
| Scaler — "10 AI portfolio projects, 2026" | ✅ Full | All 10 captured with stacks. |
| everyonewhocode.com — "Real-world AI projects that get you hired" | ⚠️ **Partial** | 37 of ~52 captured. Categories 01–04 complete (NLP, CV, classic ML, recsys); **Category 05 (GenAI/LLM/agents, 15+ projects) truncated after #37** on two fetch attempts. This is the category most relevant to the AI Eng track. |
| Reddit — r/learnmachinelearning poll thread | ❌ **Blocked** | Reddit blocks this fetcher entirely. **Not scraped** — neither the post nor the comments. |
| YouTube — `mGClIHRird8` | ❌ **Blocked** | YouTube returns only the page footer to this fetcher; no transcript, title, or description. Web search could not identify the video either. **Nothing recovered.** |
| YouTube — `E6lvgbayD04` | ⚠️ **Title only** | Identified via web search as *"How to Become a $300K AI Engineer in 2026 (Complete Roadmap)"*. No transcript or project list recovered. |

**Bottom line on coverage:** 4 of 9 sources fully captured, 3 partial, 2 blocked
entirely. The blocked and partial ones are unlikely to change the conclusions —
the four fully-captured sources already agree with each other, and the Tier 1
consensus was stable across every source that could be read. The one real risk
is the truncated everyonewhocode Category 05, which is the GenAI/agent section;
if a GenAI project idea is missing from Tier 1, it is missing from there.

**To close the gaps:** paste the Medium article text, the Reddit thread, or the
two YouTube transcripts into a session and this file can be regenerated with
them folded in.
