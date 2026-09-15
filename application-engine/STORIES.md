# STORIES — Approved Application Evidence Bank

This file is the evidence bank for application answers and interview preparation. Every statement must be supported by `FACTS.md`, the submitted resume, a project record, or direct user notes. Unknown details stay explicit; the application generator must not fill them in.

## Story 1 — Production LLM / automation system: Bridges AI / AppRise

**Context:** AI engineering / consulting work at Bridges AI for AppRise News.

**Problem:** Build an automated content workflow that moves sourced news content through AI-assisted script generation, generated video, human review/approval, scheduling, and publishing operations.

**Verified architecture / actions:**
- GPT-4o multi-step prompt-chaining/content-publishing workflows.
- FastAPI backend and Next.js application work.
- HeyGen video generation.
- Admin/approval workflow.
- Redis/Postgres and background-worker infrastructure.
- Automation/scheduling components.
- Work included production correctness and integration debugging rather than only model prompting.

**Production issues known to have been worked on:**
- partial HeyGen job failures and billing behavior;
- state correctness between live and snapshot representations;
- publishing/recall correctness;
- external-system synchronization issues.

**Outcome:** Production AI workflow delivered for client operations. Do not attach unsupported user, uptime, latency, revenue, or accuracy numbers.

**Good for:** Applied AI, AI Engineer, LLM workflow, backend, automation, FDE/customer-delivery, production ownership.

**Interview questions to prepare:**
- Why prompt chaining instead of one large call?
- How were failures/retries represented?
- What state lived in Redis vs Postgres?
- What happened when a video-generation job partially failed?
- How were human approvals represented?
- How would the architecture change at 10x volume?

---

## Story 2 — Alternative-data quantitative research: M Science / Jefferies

**Context:** Quantitative Equity Research Associate — Industrials.

**Problem:** Use large alternative datasets to develop quantitative signals/features and research company/industry fundamentals for institutional equity research.

**Verified datasets:**
- satellite imagery;
- job postings;
- point-of-sale transactions;
- company fundamentals.

**Verified tools / scale:**
- SQL and Python for sourcing/processing;
- PySpark / Databricks for predictive equity modeling;
- millions of transaction and job-posting observations;
- FactSet and REST-based workflows.

**Verified outputs:**
- 10+ research reports;
- automated workflows reduced reporting effort by ~20%;
- reporting cadence moved from quarterly to monthly.

**Methodology details still to reconstruct:**
- exact entity-resolution approach;
- exact transformations and normalization;
- exact signal/index formulae;
- weighting/rebalancing, if any;
- backtest methodology and metrics;
- how each signal mapped to a specific investment thesis.

**Safe application framing:**
> At M Science I worked with alternative datasets including satellite imagery, job postings and point-of-sale transactions, using Python/SQL and PySpark/Databricks to turn large, noisy datasets into quantitative equity research. The work required understanding what each dataset actually measured, processing it at scale, building predictive signals/models, and translating the results into institutional research.

**Do not say:** "I built tradeable indices" or describe a particular normalization/backtest design until reconstructed.

**Good for:** Data Scientist, quantitative research, alternative data, financial ML, Forum-style index roles, data engineering.

**Forum interview drill:** For each real M Science dataset, be ready to answer: what generated the raw observation; what bias existed; how entities were mapped; what aggregation was used; how the signal was normalized; how point-in-time correctness was preserved; what baseline it was compared against; and how the output was communicated.

---

## Story 3 — Backend engineering: Goodfill

**Context:** Backend Software Engineer.

**Problem / domain:** Backend and investor-onboarding/integration work in a financial-services environment.

**Verified architecture / tools:**
- Python integrations with FINRA APIs.
- Go services on AWS Lambda.
- AWS SQS and SNS messaging.
- IB Gateway / TWS API integrations running in Docker.

**What this proves:**
- backend/API integration experience;
- Go in a production-oriented service context;
- AWS serverless/event-driven components;
- external financial-system integrations;
- containerized brokerage integration work.

**Tradeoff / failure details:** Not yet reconstructed. Do not invent why Lambda/SQS/SNS were selected or claim a specific reliability/latency outcome.

**Good for:** SWE-AI, AI platform, FDE, backend-heavy AI roles, fintech.

---

## Story 4 — ML / computer vision: property intelligence platform

**Context:** ML/CV system over 3M+ property records.

**Problem:** Apply predictive ML and computer vision to a large property dataset and expose the results through a production-oriented backend platform.

**Verified scale / stack:**
- 3M+ property records.
- LightGBM and XGBoost.
- YOLOv11 + CLIP.
- PyTorch and local GPU training.
- 13-service backend architecture.
- AWS ECS Fargate.
- PostgreSQL + PostGIS.

**What this proves:**
- traditional ML plus deep-learning/CV exposure;
- large structured/geospatial data;
- local GPU model development;
- model/application integration;
- AWS service architecture and spatial database work.

**Unknown / do not invent:** exact model metrics, baseline values, latency, user count, exact deployment boundary of each model, or sole ownership of every service.

**Good for:** MLE, CV, Applied ML, AI platform, ML systems.

---

## Story 5 — NLP / data pipeline: PerceiveNow

**Context:** Data Analyst.

**Problem:** Process a large research-document corpus and improve reporting/data pipeline performance.

**Verified actions / evidence:**
- Hugging Face NLP over 50,000+ research articles.
- Python REST pipeline work.
- Reporting latency reduced from minutes to seconds.
- Infrastructure costs reduced by approximately 12%.

**Good for:** NLP, applied ML, data engineering, backend/data-pipeline questions.

---

## Story 6 — Anomaly detection / operational analytics: AMD

**Context:** Yield Analysis.

**Problem:** Detect manufacturing anomalies and surface failure information to engineers.

**Verified actions / evidence:**
- nearest-neighbor anomaly detection across 100,000+ wafer samples;
- real-time failure alerts drawing from 12 Snowflake sources;
- Power BI output used by 20+ engineers.

**Good for:** classical ML, anomaly detection, data quality, manufacturing/industrial AI, stakeholder communication.

---

## Story 7 — Client ambiguity / consulting

**Context:** Bridges AI consulting.

**Verified framing:** Work spans client delivery, production LLM workflows, backend/data systems, automation, and iterative product/integration debugging.

**Use carefully:** This story needs a single concrete customer request -> requirements discovery -> architecture choice -> delivered result chronology before it should be used for a behavioral answer. AppRise is the leading candidate.

**Good for:** Forward Deployed Engineer, solutions, consulting-heavy Applied AI.

---

## Story 8 — Failure / incident / debugging

A complete STAR-style incident is **not yet verified enough to generate automatically**.

Candidate incidents from production work include:
- partial HeyGen job failure / billing behavior;
- Cloudflare D1 versus browser-storage split-brain/state recovery;
- Canvas publishing/recall correctness;
- complete Canvas catalog synchronization;
- live-versus-snapshot state correctness.

Before using one in an application/interview, reconstruct:

```text
System:
Expected behavior:
Observed failure:
How it was detected:
User/business impact:
Investigation steps:
Root cause:
Immediate fix:
Long-term prevention:
What you personally did:
Measured result:
```

**Good for:** production ownership, reliability, debugging, behavioral interviews.

---

# Selection rules for the application generator

- Prefer one deep story over three shallow stories.
- For AI/FDE roles, default to Story 1 unless another story maps more directly.
- For quant/alternative-data roles, default to Story 2.
- For backend/platform roles, use Story 3 and/or Story 1.
- For MLE/CV roles, use Story 4; Story 5/6 can provide additional professional ML evidence.
- Never promote an `Unknown`, `TODO`, or reconstruction note into a factual claim.
- Do not combine metrics from separate stories as if they describe one system.
