# FACTS — Application Source of Truth

Only verified facts belong here. Application-generation prompts may use facts from this file, the supplied resume, an explicitly supplied job/project record, or direct user notes. They may not fill gaps by inference.

## Identity / contact

Populate manually with the exact contact information you want used on applications. Do not commit private phone/address data to a public repository. Prefer a local/private overlay such as `FACTS.local.md` for sensitive fields.

## Education

- BS Mathematics — University of Texas at Austin, December 2022.
- MS Data Science — University of Colorado Boulder, online. Graduation target: Fall 2026.

## Current / recent work

### Bridges AI / AI consulting
- AI engineering and consulting work involving production LLM workflows, backend/data systems, automation, and client delivery.
- AppRise News work includes automated news-content workflows involving AP-sourced content, script generation, HeyGen video generation, approval/admin workflows, scheduling, Redis/Postgres, workers, and automation infrastructure.
- Built GPT-4o multi-step prompt-chaining/content-publishing workflows across FastAPI and Next.js.
- Built an Anthropic Claude LMS-to-video-lecture platform using Cloudflare Workers and D1.
- Production debugging/ownership examples include Canvas publishing and recall correctness, Cloudflare D1 versus browser-storage state consistency, draft-versus-static accessibility evaluation, partial HeyGen job failures/billing behavior, complete Canvas catalog synchronization, and live-versus-snapshot state correctness.

### M Science / Jefferies
- Quantitative Equity Research Associate — Industrials, approximately late 2022 to early 2023. Resume versions differ slightly on exact month boundaries; use the dates on the submitted resume for applications.
- Sourced and processed alternative datasets including satellite imagery, job postings, point-of-sale transactions, and company fundamentals using SQL and Python.
- User-confirmed analysis included job-posting data and SKU/item-availability changes observed through web/cart interactions to estimate product sales over time.
- Built predictive equity models in PySpark/Databricks using millions of transactions and job-posting observations.
- Produced 10+ research reports.
- Automated FactSet/REST workflows, reducing reporting effort by approximately 20% and moving reporting cycles from quarterly to monthly.
- This experience supports claims about alternative-data research, signal/feature development, quantitative equity research, Python/SQL, PySpark/Databricks, data processing, web-derived SKU/inventory signals, and communicating research.
- Do **not** claim that a specific methodology was a tradeable index, that you personally owned an index product, or that a specific normalization/backtest procedure was used unless separately reconstructed and verified.

## Earlier experience

### Goodfill — Backend Software Engineer, July–September 2022
- Built backend/investor-onboarding work in Python using FINRA APIs.
- Worked on Go services using AWS Lambda, SQS, and SNS.
- Worked with IB Gateway / TWS API integrations in Docker.

### PerceiveNow — Data Analyst, May–September 2022
- Used Hugging Face NLP over 50,000+ research articles.
- Built Python REST pipeline work that reduced reporting latency from minutes to seconds and infrastructure costs by approximately 12%.

### AMD — Yield Analysis, January–May 2022
- Applied nearest-neighbor anomaly detection across 100,000+ wafer samples.
- Worked with real-time failure-alert workflows drawing from 12 Snowflake sources.
- Power BI output was used by 20+ engineers.

### Robotics / ML project work
- DeepSORT feature-network work using Triplet Loss improved trajectory tracking by approximately 8%.
- Autonomous-navigation work used Python, C++, and ROS.

## Strong ML / computer-vision system

- Built/worked on an ML/CV platform over 3M+ property records.
- Modeling included LightGBM/XGBoost, YOLOv11 + CLIP, and PyTorch with local GPU training.
- Backend architecture included 13 services on AWS ECS Fargate with PostgreSQL + PostGIS.
- Treat exact ownership boundaries and any additional performance/latency metrics as unknown unless supported by a project record or resume.

## Technical areas with demonstrated evidence

- Python
- SQL
- Go
- backend/API development
- FastAPI
- Next.js
- LLM workflows and APIs
- GPT-4o / Anthropic Claude application work
- RAG / agentic-system exposure
- data pipelines
- PostgreSQL / PostGIS
- Redis
- Docker
- AWS Lambda / SQS / SNS / ECS Fargate exposure
- PyTorch
- LightGBM / XGBoost
- YOLO / CLIP
- Hugging Face NLP
- PySpark / Databricks
- Snowflake exposure
- REST APIs / FactSet workflows
- Alternative-data signals from job postings, transactions, satellite imagery, fundamentals, and SKU/cart availability changes

## Facts still requiring reconstruction before they can be used as verified detail

### M Science methodology details
- Exact formulae for each signal/index/feature.
- Exact normalization and weighting methodology.
- Exact entity-resolution procedure.
- Exact point-in-time/backtest design and validation metrics.
- How individual outputs fed investment decisions or client deliverables beyond the verified 10+ reports.

A best-effort inferred reconstruction is maintained separately in `M_SCIENCE_RECONSTRUCTION.md`. That document may be used to prepare for interviews and generate hypotheses, but inferred details must not be presented as remembered facts without user confirmation.

### Production incident story
- A single incident with exact chronology: detection -> diagnosis -> root cause -> fix -> prevention -> impact.
- Several candidate Bridges AI/Lectura incidents are known, but the details must be reconstructed before using them as a behavioral story.

## Hard truth rules

- Personal/portfolio projects are not professional production experience.
- Coursework is not professional experience.
- Using a technology once is not equivalent to years of experience.
- Do not turn team accomplishments into sole ownership.
- Do not invent scale, latency, revenue, accuracy, cost savings, users, datasets, or uptime.
- Do not say a system was production if it was a prototype unless the underlying source explicitly supports production use.
- Numeric YOE questions must be answered by the user or by explicit dated employment evidence, not inferred by an LLM.
- When two verified sources disagree on employment month boundaries, use the dates on the resume actually submitted to that employer.
