# STORIES — Approved Application Evidence Bank

This file is the evidence bank for application answers and interview preparation. Every statement must be supported by `FACTS.md`, the submitted resume, a project record, or direct user notes. Unknown details stay explicit; the application generator must not fill them in.

Source key: [MASTER_RESUME.md](MASTER_RESUME.md) defines N (newer R01 resume), H (identical detailed historical versions), R05-R19 (individual sources), E (prior repository evidence), and conflicts C01-C15. Resume-supported means self-reported, not independently audited. Preserve the selected source's dates/metrics; unresolved alternatives belong in review notes, not a blended application answer. Stories 1, 4, 7 and 8 carry forward E and were not newly verified by these PDFs.

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

**Context:** Quantitative Equity Research Associate — Industrials [N]; Industrials and Automotive research team [H]. N/H/R12 agree on Oct. 2022-Mar. 2023; E's nonspecific date warning remains unresolved (C01).

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

**Source-specific outputs:**
- N: 10+ research reports; FactSet/REST workflows cut reporting effort by 20%; cadence moved from quarterly to monthly.
- H: report creation times reduced by up to 30% through automation of querying, extraction, cleaning and writing using Python/PySpark/SQL and Excel VLOOKUPs, pivot tables and streaming sources.
- These are unresolved metric variants (C02), not a 20-30% range or two independently measured wins. Use a metric-free account when no source has been selected.

**Recovered historical detail [H]:** Built predictive financial models with Python/Excel; wrote reports investigating and predicting sales, job listings and other statistics. pandas, Databricks and Tableau also appear in the source. The millions-of-observations scale is N; satellite/POS detail and SKU/cart recollections are E.

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

**Context:** Backend Software Engineer Consultant [N/H]. Dates/title conflict C03 includes R12's Data Analyst wording; do not choose a timeline automatically.

**Problem / domain:** Backend and investor-onboarding/integration work in a financial-services environment.

**Verified architecture / tools:**
- Python integrations with FINRA APIs.
- Go services on AWS Lambda.
- AWS SQS and SNS messaging.
- IB Gateway / TWS API integrations running in Docker.
- FIX messages, specifically FIX 4.4, and REST calls linking the investor application/AWS services to Interactive Brokers; new investment-account creation and FINRA record confirmation. [H]

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
- H: classified/summarized scientific text; optimized API/data management and cross-source research-article/author records; Python 3, Flask, Jupyter, REST, AWS Lambda/microservices and Hugging Face.
- N: Hugging Face on AWS Lambda over 50k+ articles; Python REST/Jupyter reporting from minutes to seconds; costs reduced by 12%.
- N does not specify the cost category or exact latency/accuracy. E called the costs infrastructure costs; avoid adding that specificity without confirmation. Dates conflict C04.

**Safe short answer:** I worked on classifying and summarizing scientific texts with Hugging Face models, and optimized API calls and data handling for research-article and author records. The work combined NLP with the reporting pipeline around it. [H paraphrase]

**Still unknown:** model names, evaluation baseline, deployment volume and reasons for architecture choices. Do not invent a training or fine-tuning procedure.

**Good for:** NLP, applied ML, data engineering, backend/data-pipeline questions.

---

## Story 6 — Anomaly detection / operational analytics: AMD

**Context:** Yield Analysis Intern, Jan.-May 2022 [N/H]. This is distinct from Product Development, Aug.-Dec. 2021 (Story 10).

**Problem:** Detect manufacturing anomalies and surface failure information to engineers.

**Source-supported actions / evidence:**
- H: adaptive feed-forward outlier-detection script predicting downstream results from parametric tests using nearest-neighbor ML; visualized results with NextGen EDA/JMP/Python; Power BI dashboards with Pareto charts, stacked bars/lines and drill-down tables.
- N: feasibility research on 100k+ wafer samples; dashboard adoption by 20+ engineers.
- Correction C07: the 12 mixed data sources and failure alerts belong to Product Development. The source does not say 12 Snowflake sources.

**Safe short answer:** At AMD I explored nearest-neighbor anomaly detection for semiconductor test data and visualized the results for engineers evaluating the approach. I also built Power BI views for tracking test results and product yield. [N/H paraphrase]

**Unknown:** precision/recall, test split, baseline, production deployment and quantified accuracy improvement. Do not turn feasibility research into a deployed production model.

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
- Consult the master's conflicts before using any story with dates or metrics. Historical qualitative bullets do not corroborate newer numerical results by themselves.
- Stories 9-17 below recover additional evidence; personal projects, academic work, competitions and application-letter recollections retain their classifications.

---

## Story 9 — Regulatory analytics and valuation-tool support: Citco

**Evidence:** H historical; N newer-only scale. Dates conflict C05.

**Context/problem:** Risk Analysis Intern supporting risk/fund-performance reporting for hedge-fund clients, investors and regulatory bodies.

**Actions [H]:** Created/managed reports; assisted maintenance, prototyping and UAT of internal valuation models and risk tools using Python/PySpark/SQL/Excel; documented and automated operational-risk reporting including AIFMD/Form PF. Bloomberg Terminal appears in the tool list.

**Outcome:** Reports and tool-support work are supported. N additionally claims automated reporting for 20+ hedge funds and Python/SQL models supporting $10B+ AUM. These are newer-only, not assets managed by Nevyn (C08).

**Safe answer:** At Citco I supported regulatory and fund-performance analytics, including AIFMD and Form PF reporting. I also helped maintain, prototype and test internal valuation models and risk tools using Python, SQL, PySpark and Excel. [H paraphrase]

**Unknown:** specific valuation formulae, failure/validation cases, portfolio decisions and measured time savings. **Good for:** financial analytics, careful testing, regulated reporting, stakeholder-facing data work.

## Story 10 — Lab operations dashboards and integration: AMD Product Development

**Evidence:** H/R06/R07; N adds 12-source count. Aug.-Dec. 2021.

**Problem:** Surface lab machine status/reservations, work orders and inventory for engineering teams.

**Actions:** Built floor-wide real-time Power BI dashboards; integrated Snowflake, MySQL, REST, spreadsheets, existing Power BI datasets and web-app data via BeautifulSoup/Power Automate. Worked on pandas/SciPy test monitoring and machine-failure/inaccuracy alerts. Built shipping-inventory tracking with recurring-shipping suggestions.

**Outcome:** Operational dashboard/alert/inventory functionality is supported. N claims 12 total data sources. Do not attach Yield's 20+ engineers, or invent reduced downtime or shipping costs.

**Safe answer:** I built Power BI dashboards for AMD's test-engineering labs that brought machine status, reservations, work orders and inventory together from several systems. The integrations included Snowflake, MySQL, REST APIs and scraped web-app data, alongside test monitoring and failure alerts. [H paraphrase]

**Unknown:** refresh SLA, individual source count breakdown, time savings and a concrete incident. **Good for:** data integration, BI, operational automation, internal-user delivery.

## Story 11 — Cross-team analytics and automation: BNY Mellon

**Evidence:** H/R06/R07/R19; newer scale N. Jun.-Aug. 2021; title variants C09.

**Context:** Data and Analytics team, Liquidity and Margin Services Division.

**Actions [H/R07]:** Prepared client data and built Tableau/Excel/VBA/Python dashboards for Sales, Relationship Management and Analytics; wrote four automation scripts; assisted creation of a central warehouse to synchronize data across teams and sources.

**Outcome:** Functional automation and shared-data work supported. N claims 3+ business units, hundreds of accounts and 20% lower reconciliation time, but does not establish that the four scripts caused that result.

**Safe answer:** At BNY Mellon I built client-data dashboards and wrote four VBA/Python automation scripts for the Liquidity and Margin Services analytics team. I also helped create a central warehouse to synchronize Sales and Relationship Management data across teams and sources. [H/R07 paraphrase]

**Unknown:** warehouse product/schema, exact script functions, baseline reconciliation process and sole ownership. **Good for:** data engineering, workflow automation, cross-team delivery.

## Story 12 — Product features, tests and CRM integration: Order.co / Negotiatus

**Evidence:** H/R05-R08/R15/R16/R19; Jun.-Aug. 2017 internship.

**Actions:** d3.js/AJAX real-time sales dashboard; seven HTML/CSS/JavaScript front-end features [H/R07], including printing, invoice styling and onboarding changes; HubSpot-to-Salesforce data transfer via APIs [R08/R15/R16]; RSpec controller tests; Rails fixes; Agile team [R16].

**Outcome:** Shipped functionality and migration supported. R08/R15/R16 describe company-wide dashboard use without headcount. Tests intended to support uptime are not a measured uptime result.

**Safe answer:** At Negotiatus, now Order.co, I added seven front-end features, built a sales dashboard with d3.js and AJAX, and worked on the sales-data migration to Salesforce. I also added RSpec controller tests and fixed Rails issues affecting internal and client users. [H/R07, alias H]

**Unknown:** all seven feature names, migration size, error rates and conversion changes. **Good for:** full-stack work, integration, testing, early product delivery.

## Story 13 — Expanding an internship assignment: stae

**Resume evidence [H/R14/R17]:** Website redesign/new pages, PostgreSQL/React/d3.js/nodeJS/gulp graphing, Linux developer documentation. Early resumes also report writing data/privacy policies and terms.

**Cover-letter chronology [R13, Jan. 8, 2017]:** Initial assignment was redesigning the company site to match the product's look. Nevyn reports finishing early after working extra hours, then taking on documentation and d3.js graphing improvements. This is an explicitly historical, self-reported initiative story; no number of days saved is known.

**Safe answer:** My initial stae assignment was a website redesign. After finishing it early, I took on developer documentation and improvements to the product's d3.js graphing. That let me contribute beyond the initial website task. [R13 paraphrase]

**Unknown:** exact schedule, code-review feedback, adoption or quantitative impact. Do not claim promotion or DigitalOcean employment. **Good for:** initiative, learning, unfamiliar codebases, scoped delivery.

## Story 14 — Personal application projects: Alpaca and sports analytics

Keep these as two separate examples; they do not describe one system.

**Alpaca [R05-R08/R15/R18/R19]:** Personal dashboard, Aug.-Sept. 2019 in dated versions; portfolio, watchlist, performance charts and order actions. Python 3, Flask, Plotly Dash, d3.js, MongoDB and Alpaca API. R08/R15 specify market/limit/stop/stop-limit buy/sell orders. No profits, live-money deployment, users or professional brokerage ownership established.

**Sports [same sources]:** Personal R/Shiny/MySQL application using MySportsFeed to compare teams; R07 identifies NBA/NFL. Sept. 2019-Current is a historical snapshot, not proof of current development. No forecasting accuracy or betting claim.

**Good for:** self-directed learning, API integration, data visualization. **Unknown:** authentication architecture, deployment, scale and reliability tradeoffs.

## Story 15 — Academic person-following research: UT Austin BWI

**Evidence:** H/R05/R06/R07/R18/R19; N adds 8% metric and stronger stack-development wording. Dates/ownership conflict C06.

**Actions:** Trained a feature-generation network, integrated it with a trajectory tracker for following people through a crowd, co-authored DeepSORT/Triplet Loss research, and worked on Segway robots using Python/C++/ROS/PyTorch. Received the UT CNS Award for Excellence in Computer Science at the Undergraduate Research Forum.

**Outcome:** Integration, paper contribution and award supported by historical resumes. N claims 8% accuracy improvement, with no baseline, metric definition or relative/absolute basis. Use only with that source qualification; otherwise omit the number.

**Safe answer:** In UT Austin's Building Wide Intelligence project, I trained a feature-generation network and integrated it with a trajectory tracker for person-following. I co-authored research combining DeepSORT with Triplet Loss and worked with the Python, C++ and ROS stack on the robots. [historical paraphrase]

**Good for:** ML research, model integration, teamwork. **Unknown:** dataset size, training design, baselines and individual stack ownership.

## Story 16 — Early leadership and mentoring

**Union City [R14/R16/R17]:** Founded/organized a high-school-led elementary mentoring program, Apr.-Aug. 2016; pitched to superintendent/mayor; coordinated mentors, mentees and venue; created third/fourth-grade curriculum. No attendance or learning-outcome number supplied.

**CyberPatriot [R16/R17]:** Virtual OS hardening with critical services preserved; team training/leadership in R16. Keep R17's Gold State Finals snapshot separate from R16's Platinum Regionals first place and national 35th of over 2,000 teams; season not established (C15).

**FIRST [R16]:** Led weekly meetings and helped build an autonomous robot. **defhacks [R17]:** Planned logistics/workshops/sponsor outreach for a future April 2017 event; do not claim delivery or sponsor revenue.

**Good for:** organizing, mentoring, technical teamwork. Keep these school/volunteer examples separate from professional engineering employment. The master preserves additional Google CS First, Code-in, IBM and training detail.

## Story 17 — Early product and commercial thinking: Peopli

**Evidence:** R05/R08/R14-R17; Feb.-May 2016 internship; title variation C14.

**Actions:** Helped improve web/mobile UX/UI for CareerThesaurus and VisiFood; developed marketing/promotion strategies; compared restaurant monetization approaches and pitched them to the CEO.

**Outcome:** App work and proposals supported; no adoption, revenue, conversion or stack details supplied.

**Good for:** early product exposure and communicating technical/commercial ideas. This is not enough evidence for a quantified business-impact or conflict-resolution story.
