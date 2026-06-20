# Aaru — Software Engineer, Data Integration
**Complete Interview Preparation Guide**  
_Nevyn Duarte · Prepared June 2026_

Aaru simulates entire human populations with AI agents calibrated against real demographic, behavioral, and census data. This role builds the data foundation that makes those simulations trustworthy — entity resolution, schema harmonization, and pipeline reliability across enormous, messy, multimodal datasets. This guide takes you from the first-round screen through take-home, system design, and final-round behavioral conversations.

## Part 1 — Company & Role Intelligence
### 1.1 What Aaru Actually Builds
Aaru was founded in March 2024 by Cameron Fink, Ned Koh, and John Kessler. The company generates thousands of AI agents — synthetic individuals with detailed demographic, behavioral, and media-consumption profiles — that interact within simulated environments to forecast how real populations will respond to products, messaging, policy, or political events. Their flagship private-sector model is called Lumen.
As of late 2025, Aaru raised a Series A led by Redpoint Ventures at a blended valuation near $1B (with some shares priced at a $1B headline tier). Enterprise partners and investors include Accenture (via Accenture Ventures and Accenture Song) and EY, who used Aaru to replicate a 3,600-respondent global wealth management survey via simulation. Aaru has also publicly demonstrated election-prediction accuracy, including the NY Democratic primary.
Competitively, Aaru sits in the "synthetic population / synthetic interaction" category alongside Simile, CulturePulse, Listen Labs, Keplar, and Outset — but Aaru's specific bet is full population simulation grounded in real data rather than just AI-moderated surveys.
### 1.2 Why This Matters for the Data Integration Role
Every simulation Aaru runs is only as good as the data calibrating it. Their EY case study explicitly describes blending census data, proprietary datasets, and behavioral/social data, then validating synthetic output against real survey results using Spearman correlation, RMSE, and Euclidean distance. That validation step depends entirely on clean, resolved, well-joined upstream data — which is exactly this role.
Read the JD's responsibilities again with this lens: "link, query, and trust data at scale," "entity resolution, deduplication, schema harmonization across imperfect or incongruent datasets," "data quality checks, validation logic." This isn't generic ETL — it's the literal plumbing behind a company whose product claim is statistical fidelity to real human populations. If your pipeline silently double-counts a demographic segment or misjoins a census tract, the simulation's output is wrong in a way that's hard to detect downstream.
### 1.3 Culture & Velocity Signals
The JD repeatedly signals small-team intensity: "small, dedicated, mission-driven team," "ownership, trust, space to operate without bureaucratic friction," "work with urgency and intellectual honesty," "match our velocity," "thrive at the frontier." In-office 5 days/week in NYC. This is not a place to project a big-company, process-heavy answer style. Be ready to talk about moving fast with imperfect information and owning outcomes end-to-end — your Bridges AI CTO role and solo full-stack builds (Houston Mobile Mixology, Valorem) are strong evidence here.

## Part 2 — Round 1: Recruiter/Hiring Screen Recap
You already have a separate one-pager for this, but the core points worth repeating: lead with your alternative-data experience at M Science (satellite imagery, job postings, POS transaction data — explicitly named as a "strong candidate" signal in the JD), and bridge to your Bridges AI Valorem pipeline (3M+ property records, multimodal fusion of aerial imagery + tabular data, 13-service FastAPI/GraphQL architecture on AWS). The throughline: you've been both a consumer of messy alt data who needed it clean, and a builder of the systems that produce it.
Have ready, cold, no notes:
60-second answer to "walk me through a time you integrated data from very different sources"
60-second answer to "how do you think about data quality when you don't control the source"
A genuine point of view on AI-simulated populations — why this approach, what excites you, what you're skeptical of
Two or three questions to ask them (see Part 7)

## Part 3 — Round 2 (Expected): Technical Take-Home or Live Data Exercise
### 3.1 What to Expect
Data integration roles at this stage almost always include a hands-on exercise before any system design round. Expect one of these formats:
A take-home: 2-4 multi-source CSV/JSON files with overlapping but inconsistent entities (e.g., company names, person records, or product IDs across sources), asking you to clean, join, deduplicate, and flag quality issues.
A live CoderPad-style session: smaller version of the same, done while talking through your reasoning out loud.
Given Aaru's domain — demographic/census data, proprietary behavioral data, third-party panels — a highly plausible exercise theme is: "here are two datasets describing the same population from different sources; resolve entities and reconcile schema, then flag what you don't trust." This is structurally identical to the Woodline take-home you already mastered (TransactionData + ReportedData, mixed date formats, entity resolution graded explicitly), just in a demographic/behavioral data context instead of equities.
### 3.2 The Framework — Adapted From Your Woodline Prep
You already internalized a 9-section take-home skeleton for Woodline. Reuse it almost unchanged — the skill being graded (entity resolution, schema harmonization, documented data quality reasoning) is the same skill, just applied to people/demographic records instead of equities/transactions. Below is the Aaru-flavored version.
"""
AARU DATA INTEGRATION EXERCISE
Name: Nevyn Duarte
"""

# ── SECTION 1: SETUP ──
import pandas as pd, numpy as np
from rapidfuzz import fuzz  # or fuzzywuzzy if rapidfuzz unavailable
import warnings; warnings.filterwarnings('ignore')
pd.set_option('display.max_columns', None)

# ── SECTION 2: INSPECTION ──
# Load every file. Print shape, dtypes, head, nulls, duplicates per file.
# Look explicitly for: mixed date formats, inconsistent casing/whitespace
# in key fields, multiple spellings of the same entity, missing FKs.

# ── SECTION 3: DATA QUALITY LOG ──
# Build a running list — one dict per issue found. This is graded.
quality_log = []
def log_issue(field, issue, severity, fix):
quality_log.append({'field': field, 'issue': issue,
'severity': severity, 'fix': fix})

# ── SECTION 4: ENTITY RESOLUTION ──
# Build a canonical mapping dict for any entity that appears under
# multiple spellings/IDs across sources. Use blocking (group by first
# letter / zip / sorted tokens) before fuzzy matching to keep it tractable
# at scale. Print the full entity_map you constructed — always show this.

# ── SECTION 5: SCHEMA HARMONIZATION ──
# Normalize column names, units, date formats, categorical encodings
# across sources into one shared schema BEFORE joining.

# ── SECTION 6: JOIN / INTEGRATION ──
# Document join keys, join type, and what you did with non-matches
# (dropped? flagged? imputed?). Never silently drop rows.

# ── SECTION 7: VALIDATION ──
# Sanity checks post-join: row count deltas, duplicate detection,
# distribution sanity (no impossible values), referential integrity.

# ── SECTION 8: SUMMARY ──
# Print quality_log as a table. State confidence level in final
# dataset and what you'd verify with more time/access to source teams.
### 3.3 Entity Resolution — What to Actually Know
Be ready to explain and apply, not just name-drop:
Blocking: group records by a cheap key (zip code, first letter, sorted token set) before running expensive pairwise comparisons — this is what makes entity resolution tractable at >100TB scale, which the JD explicitly calls out.
String similarity: Levenshtein distance, Jaro-Winkler (better for names — weights prefix matches more heavily), token-sort ratio (handles reordered words, e.g. "Acme Corp" vs "Corp, Acme").
Probabilistic record linkage (Fellegi-Sunter): assign match/non-match probabilities based on agreement across multiple fields rather than one exact key — useful when no single field is reliable.
Embedding-based matching: encode records as vectors (e.g., via a small transformer or even TF-IDF) and use nearest-neighbor search — worth mentioning as the modern approach for very messy or multilingual text fields, especially since Aaru works with social/behavioral text data.
Transitive closure / clustering: once you have pairwise match scores, you need to resolve into final entity clusters (e.g., union-find / connected components) rather than just pairwise matching — a detail many candidates miss.
### 3.4 Schema Harmonization & Data Quality — Talking Points
Frame data quality across the standard dimensions, and have one concrete example ready for each from your own background:
Dimension
Definition
Your example
Completeness
No missing required fields/records
Valorem: missing parcel attributes across county sources
Consistency
Same fact agrees across sources/fields
Mixed date formats — Woodline take-home
Accuracy
Values reflect ground truth
M Science: validating POS proxy vs. reported sales
Timeliness
Data reflects current state, not stale
Satellite imagery lag vs. earnings calendar at M Science
Uniqueness
No duplicate entities/records
Entity resolution across ticker aliases
Validity
Values conform to expected format/range
Negative quantities/prices caught in EDA

### 3.5 SQL/Python Fluency Check
If the exercise is SQL-based rather than notebook-based, make sure these patterns are reflexive:
Window functions for dedup: ROW_NUMBER() OVER (PARTITION BY entity_key ORDER BY updated_at DESC) to keep the most recent record per entity.
Fuzzy join patterns: SQL doesn't do fuzzy matching natively — know how to stage a blocking key, self-join on it, then filter by a similarity threshold computed in a UDF or post-processed in pandas.
COALESCE chains for merging conflicting field values across sources by source priority.
GROUP BY + HAVING COUNT(*) > 1 to surface duplicate candidates before resolving them.

## Part 4 — Round 3 (Expected): System Design / Architecture
### 4.1 Likely Prompt Shape
Given the JD's emphasis on >100TB scale, multimodal data, and "evaluate new data sources and determine how they can be joined with existing data assets," expect a prompt like: "Design a pipeline to ingest a new third-party data source (e.g., a new demographic panel or social media firehose) and integrate it with our existing population data so it's usable for simulation." Treat this as a real systems design interview, not a trivia round.
### 4.2 Structure Your Answer
Clarify scope: data volume/velocity, structured vs. unstructured, batch vs. streaming, freshness requirements, who consumes it downstream (the simulation/agent layer).
Ingestion layer: API/file/warehouse connectors, schema-on-read vs. schema-on-write decision, raw/bronze landing zone before any transformation (preserve raw data for reprocessing/audit).
Validation & quality gates: schema validation, null/range checks, anomaly detection on ingest — fail fast vs. quarantine-and-alert tradeoffs.
Entity resolution & harmonization layer: blocking + matching against your master entity registry; explicitly call out how you'd version/audit the entity map since it will need correction over time.
Storage: explain your bronze/silver/gold (or raw/staged/curated) layering, and why — this signals you think about reprocessing and lineage, not just one-shot ETL.
Orchestration & monitoring: DAG-based scheduling (Airflow/Dagster-style reasoning is fine even without hands-on tool experience), data quality dashboards, alerting on drift or failed validation.
Scale considerations: partitioning strategy, incremental processing vs. full reprocessing, cost/compute tradeoffs at >100TB.
Close with tradeoffs you'd flag explicitly and what you'd want from the data source's documentation/legal team before fully trusting it (ties to compliance below).
### 4.3 Specific Concepts to Be Fluent In
Medallion architecture (bronze/silver/gold) — even informally, shows layered thinking about raw vs. trusted data.
Idempotent pipelines — why reruns shouldn't duplicate or corrupt data (upserts vs. naive appends).
Data lineage / provenance — given Aaru blends census + proprietary + behavioral data, being able to trace "where did this number come from" matters a lot for their EY-style validation work.
CDC (change data capture) — relevant if any source updates incrementally rather than full-refreshing.
Privacy/compliance for sensitive demographic data — k-anonymity or differential privacy as concepts worth namedropping given Aaru works with PII-adjacent demographic/behavioral data (see Part 6).

## Part 5 — Behavioral Round
### 5.1 What They're Filtering For
Re-read the JD culture language: urgency, intellectual honesty, ownership without bureaucratic friction, thriving at the frontier. Expect questions probing for autonomy, fast iteration under ambiguity, and genuine intellectual curiosity about the simulation/agent-based modeling space — not just "can you do ETL."
### 5.2 Story Bank — Map Your Background to Likely Prompts
Likely prompt
Your story
Tell me about a time you had to integrate messy, untrustworthy data under time pressure.
Woodline take-home (mixed date formats) or M Science Industrials alt-data work — pick whichever you can speak to with more technical depth live.
Describe a time you owned something end-to-end with minimal oversight.
Bridges AI Valorem build — 13-service architecture, you as CTO, no one else to defer to.
Tell me about a decision you made with incomplete information.
Any architecture call on the Valorem pipeline or your home-lab LiteLLM routing decision — frame as calculated, reversible, fast.
How do you handle disagreement about technical approach?
Use a real Bridges AI co-founder disagreement if you have one, or a CU Boulder group project; keep it concrete and resolution-focused.
Why data integration, why Aaru, why now?
Bridge from M Science (alt data as a research lens) to Bridges AI (you now build the pipelines) to genuine interest in agent-based population simulation as the next frontier of that work.

Format every answer STAR-style (Situation, Task, Action, Result) but compress — at a fast-moving startup, rambling answers read as a velocity mismatch. Aim for 90 seconds, not four minutes.

## Part 6 — Data Ethics & Compliance Awareness
Aaru works with demographic, behavioral, and sometimes political/electoral data — areas where data provenance, consent, and bias matter more than in typical SaaS data engineering. You don't need to be a privacy lawyer, but showing awareness will differentiate you:
Sampling/representation bias: synthetic populations are only as unbiased as their training/calibration data — be ready to discuss how you'd detect a population segment being under- or over-represented.
Bot/fraud detection in source data: if ingesting social or behavioral signals, some "users" are bots or coordinated inauthentic activity — worth knowing this is a real upstream data quality problem in this space.
Data licensing boundaries: third-party data often comes with usage restrictions (e.g., can't be resold, can't be joined with certain other sources) — flagging this awareness shows maturity beyond "just make the join work."
PII handling for demographic data: even aggregated demographic data can become re-identifiable when joined across enough fields (mosaic effect) — relevant given Aaru's agents carry "hundreds of traits."

## Part 7 — Questions to Ask Them
Good questions at every round, calibrated to the round type:
Screen/early: "How does the data integration team's work plug into the simulation/agent layer day to day — are you mostly building once-and-done pipelines per new partner, or a more standardized ingestion framework over time?"
Technical round: "When you onboard a brand-new third-party data source, what does your current validation process look like before it's trusted enough to feed a simulation?"
Behavioral/final round: "With the Series A and enterprise partners like Accenture and EY now depending on simulation accuracy, how has the bar for data quality/governance changed as the company has scaled?"
Anytime: "What's the messiest data source you've had to integrate so far, and what made it hard?" — this often reveals real pain points you can speak to directly.

## Part 8 — Final Prep Checklist
- [ ] Re-read this guide's Part 3 framework the morning of any take-home
- [ ] Practice the entity-resolution notebook simulation (separate file) end-to-end, timed
- [ ] Rehearse the 5 behavioral stories out loud, 90 seconds each
- [ ] Have 3 questions ready, tailored to who you're meeting
- [ ] Review Aaru's EY and Accenture case studies once more for fresh, specific language to use in conversation
- [ ] Know your own M Science and Valorem data quality stories cold — these are your strongest cards
