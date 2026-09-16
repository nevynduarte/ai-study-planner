# November 2026: AI engineering readiness plan

Reviewed September 16, 2026. November is the main interview-readiness window, following Nevyn's explicit preference. October 31 is a diagnostic checkpoint, not a ban on earlier applications or a promise of an offer. A good opportunity can be pursued sooner. Weekly availability and current interview dates remain unconfirmed; the existing 10-hour weekly setting is the provisional baseline.

## What changes

Prioritize applied AI / AI software engineering, then customer-facing FDE where the delivery requirements fit, then MLE. Keep data science and quant/alternative-data roles as selective adjacent opportunities. Do not prepare for four different careers equally every week. Finance and industrial experience provide useful project context; they do not establish mastery of every technology in the older plans.

Build one defensible flagship first. Add a compact classical-ML lifecycle project if capacity permits. Incorporate ingestion and retrieval into the flagship. Keep autonomous coding agents, GPU serving, fine-tuning, and a tiny transformer as bounded extensions triggered by a relevant interview or a measured learning gap.

Practice engineering judgment: define requirements, compare alternatives, measure failures, own deployment and rollback, explain decisions, and incorporate feedback. Six weeks of projects can demonstrate these habits; it cannot substitute for years of senior production ownership.

## Capacity and calendar

September 16–October 31 provides about 6.5 weeks. The budgets below are planning assumptions, not claims about available time. All activities are included in the totals; portfolio work is not extra homework on top.

| Weekly capacity | Build + design | Coding + SQL | ML foundations | Mocks + career work | Realistic October outcome |
|---|---:|---:|---:|---:|---|
| 10 hours, current provisional setting | 5 | 2 | 2 | 1 | About 65 total hours. Small flagship or a substantive improvement to an existing app; ML project deferred unless already partly built. |
| 25 hours | 10 | 5 | 4 | 6 | About 163 total hours. Flagship plus compact ML project and repeated mocks. |
| 40 hours | 16 | 8 | 6 | 10 | About 260 total hours. Both projects plus targeted depth; do not spend the extra time adding every framework. |

At 10 hours, the build/design block includes one short recorded walkthrough each week; the career block covers the funnel and a rotating mock. At higher capacity, add two full mocks a week. A scheduled interview replaces lower-priority project extensions. Missed milestones trigger scope reduction and a dated reassessment, not abandonment of all other tracks.

| Window | Build outcome | Fundamentals and interview practice |
|---|---|---|
| Sep 16–20 | Audit existing usable code; select one workflow and dataset; capture baseline failures | Unaided Python/SQL exercise, ML explanation, 15-minute architecture walkthrough; record gaps |
| Sep 21–27 | One end-to-end document-to-answer/extraction path, source references, reproducible local run | Python data structures, SQL joins/windows, train/validation/test, precision/recall, HTTP and database basics |
| Sep 28–Oct 4 | Frozen evaluation set, baseline comparison, measured errors and first improvement | Retrieval metrics versus answer quality, embeddings/attention intuition, confidence intervals and sampling |
| Oct 5–11 | Durable job state, bounded tool use, failure recovery, authorization checks | Transactions, idempotency, queues, retries/timeouts; practical debugging and AI system-design mock |
| Oct 12–18 | Deploy flagship, demonstrate rollback; start compact ML project only if flagship works | Regularization, feature leakage, temporal/group splits, calibration; model-selection exercise |
| Oct 19–25 | Close the largest measured weakness; finish ML project at higher capacity | Serving consistency, monitoring and retraining decisions; two role-specific practice loops |
| Oct 26–31 | Feature freeze, clean README/demo, reproduce results, readiness review | Unseen coding/SQL retests, design under changing constraints, six factual experience stories |
| November | Main application and interview campaign, with continued targeted practice | Repair the weakest observed interview stage; recheck job availability and compensation before applying |

## Project 1: Evidence Workbench — trustworthy document workflows

**Priority:** first for AI engineering and FDE. Budget 30–45 focused build hours for a narrow version if an existing app can be reused; allow more if the baseline audit finds no usable foundation. These are estimates, not deadlines.

**User and task:** an analyst or operations user uploads a small, explicitly licensed/public document collection, extracts a defined schema, asks evidence-backed questions, and reviews a draft report. Pick one domain initially: financial/industrial reports make use of Nevyn's experience. An industrial maintenance version is a later domain adaptation, not a second application to build simultaneously. Never reuse private employer/client data without authorization.

**Minimum architecture:** Python API, Postgres, a straightforward worker for long-running jobs, a minimal web interface, one model provider, and one deployment environment. Start with direct structured model calls and deterministic workflow steps. Compare text search with embeddings before adding a reranker. Add an MCP adapter only after the underlying read-only tool works and a target role benefits from interoperability.

**Acceptance evidence:**

1. A versioned document manifest and clear schema; content hashing and repeat-ingestion tests. Record document count and licensing basis rather than promising an arbitrary huge corpus.
2. A working vertical slice: ingest → extract/index → answer with page/source references → reviewer approves a draft. A citation must support the actual claim; a link alone does not pass.
3. Start with 30–50 manually reviewed tasks covering ordinary, ambiguous, numeric, missing-answer, and malicious-document cases. Separate development cases from a frozen held-out set by source document where possible. Repeat stochastic cases and report denominators, variability, and limitations. This is a useful small evaluation, not statistical proof of universal reliability.
4. Compare a simple baseline with the improved workflow on the same tasks. Measure schema validity, field accuracy, answer correctness, citation support, abstention, task completion, latency distribution, and cost per successful task. Calibrate any model judge against human labels; report disagreement, not just one aggregate score.
5. Demonstrate recovery from duplicate submission, worker interruption, provider timeout, malformed output, and tool failure. Bound retries, time, tokens, and tool calls. Test read authorization using two users; demonstrate that document text cannot grant tool permissions or authorize actions. Draft exports require explicit reviewer approval.
6. A repeatable deployment, redacted traces, one rollback exercise, and an operations note explaining what alerts deserve attention. Public demo limitations must be visible; describe simulated load as simulated load.
7. A five-minute demo, an architecture diagram, three short decision records, and a failure analysis. Reimplement one critical function without AI assistance and defend what would change at 10× traffic.

**Do not require upfront:** Go gateway, Kafka, Spark, Redis plus another queue, EKS, ArgoCD, Terraform for every resource, multiple agents, or multiple vector databases. Add a component only when a measured constraint justifies it or a bounded interview exercise specifically requires it. A managed deployment and an honest load test are sufficient for the initial portfolio.

**Differentiation:** evaluate task completion and review effort, not merely chatbot fluency. If measuring time saved, use paired runs of the same workflow with a documented sample and a human review requirement. Do not invent a percentage or describe a solo benchmark as customer ROI.

## Project 2: Decision Model — a compact complete ML lifecycle

**Priority:** second; particularly useful for MLE and data science. Budget 20–30 focused build hours after data access is confirmed. At the 10-hour baseline, continue this in November rather than compromising the flagship.

Choose an existing defensible dataset/problem first. Otherwise select a public, licensed tabular prediction problem with a useful decision and documented labels. Select temporal or group validation when the actual data-generating process calls for it; do not fabricate event times. Freeze a target, prediction horizon if applicable, leakage risks, and cost of errors before modeling.

Deliver a simple baseline and one stronger model; reproducible data preparation; held-out evaluation; error slices; calibration/threshold selection for classification or residual/interval analysis for regression; a versioned training artifact; an API or batch scoring job using the same feature logic; input validation; a measured load test; and a rollback. Monitoring should distinguish input shift from delayed evidence of performance loss. Demonstrate retraining in a controlled experiment; do not automatically retrain because one drift statistic fired.

For a quant-facing variant, add point-in-time availability, walk-forward evaluation, a naive comparator, transaction costs where relevant, and multiple-testing caveats. This is a research-method demonstration, not a claim of profitable alpha. Only add this specialization for a credible active opportunity.

## Disposition of the existing projects

| Existing plan | Decision |
|---|---|
| agent-platform | Keep the core, narrow it to Evidence Workbench, complete a baseline before orchestration complexity |
| data-platform | Merge ingestion, data contracts, retrieval and lineage into Project 1; defer a separate distributed-data platform |
| ml-platform | Keep lifecycle rigor as Project 2; defer the multi-runtime GPU platform |
| autonomous-swe | Optional 6–10 hour experiment after core readiness: a small task set, sandbox, bounded actions, test-based scoring, failure analysis |
| Atlas Evals + Atlas Agent | Combine as the flagship's evaluation and tool-use milestones; reuse Atlas only after confirming what actually runs |
| Serve It | Optional 6–10 hour serving experiment for an ML infrastructure interview; measure throughput, latency, memory and one optimization |
| Tune It / nevyn-lm | Optional 6–10 hour learning lab; compare prompt/retrieval/baseline against adaptation on held-out examples; a negative result is valid |
| Show It | Required packaging throughout, with a final feature freeze; not a separate two-week project |
| Pipeline Proof | Reuse as an architecture/interview story after verifying its implementation and actual usage; avoid building another job tracker |
| Say It / voice-agent | Only for a credible voice-specific role; interruption handling, latency and task success justify the specialization |

Do at most one optional lab before the main November campaign. Research depth continues after placement; it is not discarded.

## Interview preparation that transfers

Use a repeating cycle: attempt unaided → explain the model → implement → test/break → explain the repair → retest after roughly 1, 3, 7 and 14 days. An AI-generated repository is not evidence that its author can independently reason through it. During learning, request hints and critiques before complete solutions. For an employer's assessment, follow that employer's assistance rules.

| Stage | Practice artifact | Local readiness check, not an employer guarantee |
|---|---|---|
| Recruiter | 60-second introduction; why this role; truthful experience/compensation/location answers | Explain relevance without unsupported seniority or inflated metrics |
| Python / algorithms | Unseen problems with tests and complexity explanation | Solve 4 of 5 role-appropriate timed tasks across two sessions without solution assistance; review communication and edge cases as well as correctness |
| SQL / data | Joins, windows, deduplication, nulls, aggregation and leakage exercises | Correct results on adversarial fixtures and explain grain/cardinality |
| Practical AI exercise | Small API or ingestion change, evaluated behavior, debugging | Implement and test one critical change independently, then explain limitations |
| ML fundamentals | Small derivations and implementations plus project-linked explanations | Explain and apply leakage, bias/variance, regularization, metrics, calibration, uncertainty and validation |
| AI / ML system design | 45-minute sessions: requirements → baseline → data flow → evaluation → failure handling → cost | Two consecutive mocks with no critical omission; justify a changed design when constraints change |
| FDE / customer | Discovery role-play and a scoped prototype proposal | Ask useful questions, agree an acceptance metric, identify dependencies, explain an adoption plan |
| Behavioral | Six source-backed stories: delivery, failure, ambiguity, disagreement, ownership, learning | Separate personal contribution from team work, give evidence, explain lessons; draw from application-engine/FACTS.md and STORIES.md |

Do not make one failed coding screen block every suitable role. Shift practice toward observed bottlenecks. After approximately 15–20 well-matched applications, inspect response rates; after several screens, inspect stage losses. These are diagnostic review points, not statistically conclusive thresholds.

## Fundamentals and the frontier

Your [CMU self-study guide](https://app.notion.com/p/2de3fc210ff08137b572ea4f3a9c1eb5?pvs=204) describes a much larger program, roughly 1,260 hours over two years. Treat it as a reference map. Start with gaps revealed by the baseline: vector/matrix operations and gradients; conditional probability and estimation; linear/logistic models; trees; optimization; validation; attention/embeddings; and experimental reasoning. Select exercises from the relevant course, then use them in a project or an interview answer. Do not require completing the PhD-style sequence before applying.

At 10 hours/week, use 30 minutes from the ML/design budget for one current primary source every other week. At 25+ hours, use about one hour/week. Record what changed, the mechanism, when it helps, cost/limitations, and one small experiment when relevant. Reading without synthesis does not count as project progress.

[Full Stack Deep Learning](https://fullstackdeeplearning.com/course/2022/) provides a useful lifecycle reference for testing, data, deployment and monitoring. [Anthropic's agent design guidance](https://www.anthropic.com/engineering/building-effective-agents) supports starting with simple workflows and adding autonomy when justified. Its [agent evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) is useful for separating tasks, repeated trials, graders and actual outcomes. Use current product documentation when implementing; the 2024 design article itself warns that tooling has changed.

## The job tracker: findings and repair list

Reviewed all six tabs of the [Austin AI-ML Job Tracker](https://docs.google.com/spreadsheets/d/1qVHRZkf9axaV3NJ0B32sWNgup9KlWgJf-OzA9W3xmpQ/edit). This was a read-only audit. Counts describe the snapshot, not the entire job market or actual application history.

- All Jobs contains 145 unique dedup keys: 40 strong-family classifications, 48 watchlist-family, 57 rejected-family. Of all roles, 89 have no application URL; 21 of the 40 strong-family rows lack one.
- Strong Matches contains 40 rows; Watchlist contains only 44 of the 48 watchlist-classified rows. Missing keys: `envision|applied-ai-engineer-austin`, `centraprise|applied-ai-engineer-austin`, `zello|applied-ai-engineer`, `syndesus|machine-learning-engineer-austin`. Rejected - Too Senior contains 57 rows.
- In **Job Descriptions!D119:E125**, the source-quality label is in D and the description is in E, reversed relative to the header. Swap each pair, preserving all other columns. Affected employers: Verisoul (two roles), Striveworks, LangChain, LPL Financial, ePayPolicy and SHI.
- The status column contains 88 `Not applied`, 56 `Do not apply`, and one clearance-dependent do-not-apply status. There are no recorded applications or interviews in this snapshot. This does not establish that none happened elsewhere.
- 94 Job Descriptions rows are labeled historical summaries. Keep summaries distinct from exact employer requirements and retain capture dates. A recent Search Log entry does not establish that every row has recently been verified.

Before the main application campaign, give each shortlisted row a canonical employer URL/requisition ID, last verified date, required versus preferred experience, location/work authorization constraints, base salary distinct from total compensation, evidence-backed fit tier, one material gap, and next action/date. Do not score a 7-year principal role highly just because its stack resembles the portfolio. A range of 2–5 years is different from a hard 5-year minimum; label it for review.

### Primary-source sample, not a complete vacancy audit

| Role | Evidence and relevance | Current action |
|---|---|---|
| [MaintainX Applied AI Engineer](https://jobs.ashbyhq.com/maintainx/350058bd-7a0e-4bfb-8090-8d7f292308d0) | Employer listing describes document intelligence, structured outputs, evaluation and shipped LLM services. Strong match to Project 1's evidence. | Strong after preparation; verify location, level and exact compensation before applying. A portfolio does not erase a production-experience requirement. |
| [Redapt FDE, Agentic AI](https://job-boards.greenhouse.io/redapt/jobs/5396488008) | Employer page accessible with application form; asks for 3+ years client-facing technical work and 1+ year production AI; remote and up to 20% travel. | Strong after preparation if the factual experience history meets those requirements; add customer discovery and delivery mocks. |
| [PressW Applied AI Engineer – MSP](https://jobs.ashbyhq.com/pressw/3db2a443-d9ea-4938-a65b-c4b71a92c015) | Employer search result describes institutional-investor workflows; listed range $90K–$145K. | Relevant domain fit, with explicit compensation caveat: much of the range is below the $130K target. |
| [Fluidstack Applied AI Engineer](https://fluidstack.com/jobs/835e6b2c-bf7a-41e8-a308-71ecf4adad07) | Cached employer result was available, but direct page returned 404 during review. | Availability unconfirmed; do not treat as an active application target without a working official posting. |
| [Thumbtack AI/ML Infrastructure](https://careers.thumbtack.com/jobs/3efb1a7b-cfaf-475a-86a9-abff37581b4b) | Employer page retains the description but also says the role has been filled. | Treat as unavailable/needs confirmation; use the requirements for practice, not an assumed active vacancy. |

The broader tracker also contains Google, Tesla, Booz Allen, Zendesk and Deepgram leads. They were not all reverified in this review; retain them as leads until primary-source eligibility and availability checks are complete. Avoid an automatic senior-title exclusion where the real requirements fit, but do not upgrade a role solely for compensation.

For a good job, evaluate manager support, code review, ownership boundaries, production exposure, mentorship, on-call expectations, travel, working hours and stable base pay. Founding/high-autonomy roles can offer interesting work but may offer less of the mentorship that would accelerate your growth. Compare actual offers rather than top-of-band advertisements.

## Planner corrections

The review found four competing schedules: 10 hours/week, a four-system 12-week build, a generated five-system 35-day sprint, and biweekly project cards. The portfolio generator only recognized the old Markdown headings, so the current source could generate zero projects. The prompt context banned portfolio work before November. The student profile asserted technical readiness without testing it and used a GPA inconsistent with the resume evidence bank. Old June interviews were still represented as current plan context.

The active plan now uses a structured milestone source with explicit capacity assumptions, rather than pretending large milestones fit into one day. Historical plans remain available for reference. Old day completion records must not count toward new milestones. November is a target for preparation and conversion, not a hard prohibition on portfolio work or selective earlier applications. Job-tracker repairs listed above have not been applied to the live Sheet.

## Start here

Use the first two-hour session for: 25 minutes of unaided Python; 20 minutes of SQL; 20 minutes explaining model validation and leakage; 15 minutes drawing an existing system; 30 minutes getting an existing project running and recording what actually works; and 10 minutes choosing the smallest end-to-end workflow. Save the attempts and errors. The next build task should repair the most important observed gap, not start another course.

## Implementation and verification

The repository's active curriculum, Plan/Projects views, portfolio generator, and coaching prompts now follow this plan. Historical curriculum and project scope are archived. New milestone checkboxes use a separate versioned browser-storage key; they are self-assessments stored in that browser, not synchronized study-log evidence.

Validation includes the production frontend build, checks that invalid/empty plans cannot replace generated output, balanced time budgets, unique milestone identities, and a local browser check of Plan/Projects navigation and shared checkbox state. Test progress was reset. The local preview has no live database backend, so live study-log writes, scheduled coaching and production deployment were not verified. The update is a repository change, not a confirmed deployment. Installation reported six dependency advisories in the existing dependency tree; dependency upgrades were outside this review. The build also reports a large-bundle warning.
