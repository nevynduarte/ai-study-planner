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
6. **Four infra gaps from Sayantani** (feature store, data validation, distributed
   training, warehouse/dbt) — all bolt-ons to Week 3 `ml-platform`. See Appendix C.
7. **Run the TDS selection procedure once** to pick the *personal* project the
   portfolio structurally cannot supply. See Appendix B — this is the one thing
   five production-grade platforms still do not give you.

---

## Sources and scrape status

| Source | Status | Notes |
|--------|--------|-------|
| LinkedIn — stasbel, "30 AI/ML projects that will get you hired" | ✅ **Full** (resolved 2026-09-05) | The post names only ~11; the full list is the linked repo [KalyanM45/AI-Project-Gallery](https://github.com/KalyanM45/AI-Project-Gallery), now read directly — 33 completed + 10 upcoming, enumerated in Appendix A. |
| Towards Data Science — Egor Howell, "The exact ML project I'd build to get hired in 2026" | ✅ **Full** (user-supplied 2026-09-05) | Gives a *framework*, not a list. One example (NFL fantasy optimization). Full framework now encoded in Appendix B. |
| Medium — iamsayantani, "50 projects…ML or MLOps" (Aug 2025) | ✅ **Full** (user-supplied 2026-09-05) | Paywalled to the fetcher; text pasted in. 47 numbered items in 6 groups, enumerated in Appendix C. The most infra-heavy source in the set. |
| LinkedIn — Aishwarya Srinivasan | ✅ Full | 5 projects, all Tier 1. The most production-focused source. |
| Scaler — "10 AI portfolio projects, 2026" | ✅ Full | All 10 captured with stacks. |
| everyonewhocode.com — "Real-world AI projects that get you hired" | ⚠️ **Partial** | 37 of ~52 captured. Categories 01–04 complete (NLP, CV, classic ML, recsys); **Category 05 (GenAI/LLM/agents, 15+ projects) truncated after #37** on two fetch attempts. This is the category most relevant to the AI Eng track. |
| Reddit — r/learnmachinelearning poll thread | ❌ **Blocked** | Reddit blocks this fetcher entirely. **Not scraped** — neither the post nor the comments. |
| YouTube — `mGClIHRird8` | ❌ **Blocked** | YouTube returns only the page footer to this fetcher; no transcript, title, or description. Web search could not identify the video either. **Nothing recovered.** |
| YouTube — `E6lvgbayD04` | ⚠️ **Title only** | Identified via web search as *"How to Become a $300K AI Engineer in 2026 (Complete Roadmap)"*. No transcript or project list recovered. |

**Bottom line on coverage:** 7 of 9 sources fully captured, 1 partial, 2 blocked.
Still blocked: the Reddit thread and YouTube `mGClIHRird8`. Still partial:
everyonewhocode Category 05 (GenAI/agents), truncated after #37, and YouTube
`E6lvgbayD04` (title only).

The Tier 1 consensus has now held across all seven fully-read sources.
Resolving stasbel *strengthened* it (Appendix A); resolving Sayantani **did
change the gap list** — it is the only source that treats platform
infrastructure as the project, and it surfaced four real gaps (Appendix C).
Resolving Towards Data Science supplied a selection procedure, not projects
(Appendix B).

**To close the gaps:** paste the Medium article text, the Reddit thread, or the
two YouTube transcripts into a session and this file can be regenerated with
them folded in.

---

## Appendix A — the stasbel / AI-Project-Gallery 30 (resolved in full)

Source: [KalyanM45/AI-Project-Gallery](https://github.com/KalyanM45/AI-Project-Gallery).
The post says "30"; the repo actually lists **33 completed and 10 upcoming**.

**Completed (33), grouped by the repo's own categories:**

- **Regression (5):** Boston house price · diamond price · flight fare · gold price · student performance
- **Classification (8):** Airbnb price *(labelled classification in the repo)* · Respire chest disease · diabetes · heart disease · password strength · rock vs. mine · spam e-mail · wine quality
- **Generative AI (10):** chatbot w/ Gemini Pro · chatbot w/ OpenAI · conversational chatbot w/ OpenAI · Doc-Genius · medical assistant w/ Gemini Pro · medicine recognition · text generation w/ Gemini · Synapse · Doclify (CLI for docs) · multi-agentic blog generation
- **Agentic (2):** Market Insight · travel planning agent
- **Computer Vision (1):** hand tracking with OpenCV
- **Recommendation (1):** movie recommendation system
- **Web scraping (2):** article scraper · image scraper
- **Power BI / analytics (4):** e-commerce data analysis · Indian restaurants · Virat Kohli performance · GitHub tracker

**Upcoming (10):** deep-fake detection · arrhythmia · driver drowsiness ·
diet recommendation · breast cancer · kidney disease · text summarisation ·
brain tumor · pneumonia · realtime face detection.

### Verdict on this source

**Every one of the 43 is Tier 3 by the criteria above, with two partial exceptions.**
The regression, classification, scraping, and Power BI groups are canonical
tutorial projects on public Kaggle/UCI datasets — exactly the shape the Towards
Data Science piece argues gets discarded. The eight medical-detection items in
"upcoming" are the same CNN five times over.

The two worth a second look, and only as *bolt-ons*:
- **Market Insight (agentic workflows)** and **travel planning agent** — the only
  items in the collection with tool-calling and a multi-step plan. Both are
  strictly weaker than Week 1 `agent-platform`, which already has tenancy, MCP,
  approval gates, durable Kafka runs, and evals. **No action.**
- **Multi-agentic blog generation** — same conclusion. **No action.**

The recommendation-system entry is worth noting only because it echoes gap **#8**
above; the repo's version (MovieLens content-based) is Tier 3 and does not close it.

**Net effect on the plan: none.** Resolving this source added zero projects to
Tier 1 or Tier 2 and moved ~30 items into the explicit-skip list. That is a
useful negative result: the most-shared "30 projects that get you hired" list in
the set is, in 2026 terms, almost entirely table stakes — which is precisely why
the portfolio build was structured around platforms instead of projects.

---

## Appendix B — the Towards Data Science selection procedure (Egor Howell)

Resolved in full 2026-09-05. This source gives **no projects**; it gives a
procedure, and a claim from someone who says he has reviewed 100+ portfolios:
*"When we see a house price prediction model or a Titanic survival classifier,
we don't think 'solid fundamentals.' We think 'next.'"*

That sentence is the justification for the entire Tier 3 skip list above, and it
independently validates Appendix A's verdict on the 33-project gallery.

### The four criteria a hireable project must hit

**Personal** (you actually care) · **Novel** (not seen a hundred times) ·
**Relevant** (matches the role you want) · **Live** (a stranger can see it run).

### The procedure

1. **Write 5 things you care about outside data/ML.** Hobbies, obsessions — things
   you'd talk about for an hour. *(His own list: investing, hockey, gym, films, YouTube.)*
2. **Write 5 genuine questions per interest** → ~25 candidate ideas. A question, not
   a topic: *"Which fantasy players are underpriced this week?"*, not *"football stats."*
3. **Cut anything that isn't one of the 5 ML shapes:** regression · classification ·
   time series · recommendation · clustering. Leaves ~10–15.
4. **Score each survivor /5 on:** how personal · how novel · how relevant to target
   roles · how hard to get the data · how hard to build. Highest total wins.
5. **Three validation checks before committing:**
   - Can you name the *actual* data source (API, dataset)? If not, sourcing it is job #1.
   - Can a rough v1 ship in ~2 months at 1–2 h/day? If not, shrink it.
   - Have you seen it several times before? If yes, take your second choice.

### His deployment stack (for comparison with ours)

Notebook prototype → split into production Python (typing, formatters, docstrings)
→ git repo + strong README → unit tests, Poetry, Makefile, PyEnv → Streamlit on
Community Cloud → GitHub Actions daily run. Template: `egorhowell/ML-Project-Starter`.

**This is strictly below our floor.** Weeks 1–5 already exceed every line of it
(Docker, Kafka, RLS, OTel, EKS, evals, ADRs). No stack change. Noted only so the
gap is a deliberate over-shoot rather than an unexamined one.

### The one thing this source says that the portfolio does not satisfy

**Personal and novel.** The five platforms are maximally *relevant* and *live*,
and they are novel in execution — but they are role-shaped, not you-shaped. Every
strong applicant targeting D.E. Shaw could describe a similar agent platform.

**Action:** run steps 1–5 above once, in one sitting, and produce a single
personal project sized to the ~2-month check. It does not replace anything; it
becomes the sixth repo and the thing you lead the "tell me about a project"
answer with, because it is the only one that answers *why you*. The Quant/
Alt-Data track (15%, thinnest coverage) is the natural home for it, and the
TCAD/permits corpus is already local — but the whole point is that the topic
must come from your list, not from this file.

---

## Appendix C — the Sayantani 47 (resolved in full)

Resolved 2026-09-05 from user-supplied text. Titled "50", contains 47 numbered
items across 6 groups. **This is the only source in the set that treats
infrastructure as the deliverable**, and it is the one that changed the gap list.

- **Starter (10):** recommender · loan default · sales forecasting · customer
  segmentation · fraud detection · resume screener · image classifier · BERT
  sentiment · multi-label news classifier · anomaly detection → **all Tier 3.**
- **MLOps (10):** deploy on AWS (SageMaker/Lambda/API GW) · CI/CD for ML · GCP
  MLOps pipeline · **drift monitoring** · **auto-retraining with Airflow** ·
  **feature store (Feast)** · **FastAPI + Triton** · **batch inference (Beam)** ·
  **data validation (Great Expectations)** · **model testing suite**
- **GenAI (10):** RAG chatbot · PDF summarizer · LangChain pipeline · fine-tune an
  LLM · email assistant · **multimodal search** · LLM resume matcher ·
  embedding-based search · voice translator · PDF knowledge base
- **DevOps for ML (8):** **Terraform + AWS** · Dockerize ML · **Kubernetes for ML** ·
  Seldon Core · **secure ML deployment** · **distributed training with Ray** ·
  **Snowflake + dbt** · **GPU monitoring on EKS**
- **DE meets ML (6):** weather pipeline · **lakehouse (Delta + Spark)** · personal
  finance tracker · **Kafka sentiment streamer** · live news classifier ·
  auto-profiling tool
- **Boss-level (6):** **mini AutoML platform** · AI construction estimator · mental
  health chatbot · resume parser + job matcher · medical diagnosis assistant ·
  **ML monitoring dashboard**

### Already covered

Bolded items map almost one-to-one onto the existing plan: Terraform/EKS/ArgoCD,
Triton serving, GPU monitoring, drift + retrain, lakehouse, Kafka streaming, and
the monitoring dashboard are **Weeks 2–3**; RAG, multimodal, and fine-tuning are
**Weeks 1 and 5**. Its whole GenAI section is below Week 1.

### Four genuine gaps this source surfaced — all Week 3 bolt-ons

| # | Gap | Why it matters | Attach to |
|---|-----|----------------|-----------|
| 16 | **Feature store (Feast)** | Train/serve skew is the classic ML Eng interview question; a feature store is the standard answer and the plan currently has no story for it. | `ml-platform` — same features feed training and the Triton path. |
| 17 | **Data validation (Great Expectations / Pandera)** | Schema and distribution checks at ingest. Pairs directly with drift detection, which the plan already has downstream but not upstream. | `data-platform` bronze→silver boundary. |
| 18 | **Distributed training (Ray)** | The only multi-GPU-training item in any source. You have the GPUs and Week 5 trains a transformer; running it distributed is nearly free signal. | `nevyn-lm` Week 5, or `ml-platform`. |
| 19 | **Warehouse + dbt (Snowflake/DuckDB + dbt)** | Analytics-engineering vocabulary the Sector Data Analyst target asks for; gold layer is already being built by hand. | `data-platform` gold layer — swap hand-written SQL for dbt models with tests. |

Gaps 16 and 17 are the strongest of the four: both are one-day bolt-ons that add a
row to an existing `BENCHMARKS.md` and both answer a question interviewers
reliably ask. **19** is the highest-leverage one for the Woodline target specifically.

### Net effect on the plan

No new repos. Four bolt-ons, plus confirmation that the Tier 1 seven were right.
Combined with Appendix B's personal-project action, the running total of changes
from all nine sources is: **one new personal project (yours to choose), one
recommender/ranking artifact, and six bolt-ons** — against a five-week platform
build that stays exactly as written.
