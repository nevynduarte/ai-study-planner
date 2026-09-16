# M Science / Jefferies — Best-Effort Methodology Reconstruction

This document is intentionally split into evidence levels:

- **VERIFIED / USER-CONFIRMED:** supplied by Nevyn, his resume, or the user-provided M Science architecture diagram.
- **INFERRED:** reconstructed for interview preparation. Do not state inferred details as remembered facts unless Nevyn confirms them.

## 1. Role and actual reporting workflow

**USER-CONFIRMED**
- Quantitative Equity Research Associate — Industrials.
- Worked with Python, SQL and PySpark/Databricks.
- Alternative data included satellite imagery, job postings, point-of-sale/transaction data, fundamentals, and web/cart-derived SKU availability changes.
- Helped create research reports for BlueMatrix.
- Reviewed prior monthly reports while preparing the current month's report.
- Started building a Power BI dashboard whose data was pulled with PySpark commands/queries.
- Worked inside the M Science architecture shown in the supplied diagram; this was an existing enterprise platform, not something Nevyn should claim to have designed himself.

## 2. Architecture context from the supplied M Science diagram

The supplied architecture shows the following enterprise flow:

```text
Sources
  sensors/IoT | RDBMS | media | files/logs | business apps | other clouds
        ↓
Ingest
  AWS IoT Core | Kinesis | AWS DMS | AppFlow | Glue
        ↓
Storage / Transform
  Amazon S3 + Delta Lake bronze/silver/gold
  Databricks Lakehouse
  Delta Live Tables / Auto Loader / Spark / Photon
        ↓
Governance / orchestration
  Unity Catalog
  Databricks Workflows
  CI/CD / MLOps support
        ↓
Query / ML
  Databricks SQL / Serverless SQL
  ML Runtime / AutoML / MLflow / Feature Store
        ↓
Serve
  model serving | data sharing | operational databases / Snowflake
        ↓
Analysis / output
  Apps | BI tools | BlueMatrix | Tableau | third parties
```

### Nevyn's likely position in that architecture — grounded by his description

Nevyn was primarily on the **query/process -> analysis/output** side of this architecture, consuming transformed research datasets rather than engineering the entire ingestion/lakehouse stack.

A defensible description is:

> "M Science had a fairly mature AWS/Databricks data platform behind the research process. My work sat closer to the research and analytics layer. I used PySpark/Databricks to pull and analyze transformed alternative datasets, helped turn those analyses into recurring BlueMatrix research reports, reviewed prior monthly reports to understand historical context and changes, and had started building a Power BI dashboard over the same data environment."

This is stronger and more accurate than claiming ownership of the architecture.

## 3. Monthly report workflow

**USER-CONFIRMED:** Past monthly reports were reviewed as part of creating the current month's report.

A likely working loop was:

```text
prior BlueMatrix monthly reports
        +
current Databricks/PySpark data pulls
        +
company fundamentals / FactSet context
        ↓
compare current vs prior period
        ↓
identify meaningful changes / inflections
        ↓
update charts, tables, analysis and narrative
        ↓
review / publish through BlueMatrix
```

### Why reviewing prior reports mattered — INFERRED

The purpose was likely more than copying prior prose. In recurring equity research, the prior report provides:
- previous signal values and trend direction;
- what the team previously expected;
- which KPIs/companies required follow-up;
- prior explanations for anomalies;
- continuity in chart/table definitions;
- a check against accidentally interpreting a recurring seasonal pattern as a new inflection.

### Interview-safe description

> "The reporting process was recurring, so before working on the current month's analysis I reviewed the previous reports to understand what had changed and what the team had already said. Then I pulled the current data in Databricks/PySpark, compared the new observations with the historical trend and fundamentals, and helped update the analysis that went into BlueMatrix."

## 4. Power BI dashboard work

**USER-CONFIRMED:** Started building a Power BI dashboard using PySpark commands/queries to pull data.

A safe description is:

> "I had also started moving some of that recurring analysis toward a Power BI dashboard. The data lived in the Databricks/Spark environment, so I was using PySpark to query and shape the relevant datasets for the dashboard rather than manually rebuilding the same views each month."

Do not claim the dashboard was completed or deployed unless later confirmed.

This experience is valuable for current data/ML roles because it shows the connection between:

```text
large transformed datasets
 -> distributed query/processing with PySpark
 -> research-ready aggregates
 -> BI/dashboard layer
 -> analyst/client output
```

---

# 5. Job-posting data signal

**USER-CONFIRMED:** Job-posting data was one of the report inputs/analyses.

## Likely research question — INFERRED

Use hiring activity as a proxy for business activity, demand expectations, capacity expansion/contraction, geographic expansion, or changes in role mix.

Possible measures include active postings, new postings, removed postings, hiring by geography/function, growth rates, and company-vs-peer changes.

## Plausible processing — INFERRED

```text
raw posting records
 -> company/subsidiary mapping
 -> dedupe/repost handling
 -> normalize title/location/function
 -> aggregate company x period
 -> change/growth measures
 -> compare with history, peers and fundamentals
```

### Interview-safe phrasing

> "One dataset I worked with was job postings. The useful information wasn't the raw posting count by itself; we looked at how hiring activity changed over time and used that as another read on company operating activity alongside fundamentals and other alternative datasets."

---

# 6. SKU / cart-availability sales proxy

**USER-CONFIRMED:** An analysis monitored changes in an item's SKU state by simulating putting the item into a cart and used those changes to estimate units sold over time.

This is one of the strongest Forum-style examples because it converts a mundane digital observation into a proxy for an economically meaningful variable.

## Measurement model — partly inferred

Repeatedly query the same SKU through the site's cart/availability behavior:

```text
SKU s at time t
 -> apparent quantity / availability Q[s,t]
 -> observe again at t+1
 -> downward movement can contain information about sell-through
```

Naive proxy:

```text
estimated_depletion[s,t] = max(Q[s,t-1] - Q[s,t], 0)
```

But observed inventory can also change because of restocks, website behavior and measurement noise. The research problem is therefore separating likely economic activity from data-generation artifacts and then aggregating the SKU-level observations into a useful time series.

### Interview-safe phrasing

> "A good example was SKU-level web data. We could interact with an item through the site's cart flow and observe changes in its apparent availability. Tracking that repeatedly gave us a way to estimate sell-through over time. The interesting part was that the raw web observation wasn't itself the business metric—we had to turn those repeated observations into a stable signal that could be compared with the company's reported performance and the other datasets we were following."

---

# 7. Point-of-sale / transaction panels

**VERIFIED:** POS/transaction data and millions of observations were used in predictive equity modeling.

Likely research use — **INFERRED:** estimate demand, growth, revenue/share trends, and compare those measures with reported fundamentals.

Important conceptual issue: panel composition can change, so raw transaction totals are not automatically equivalent to company growth. This is a useful principle to discuss even if the exact M Science weighting method is not remembered.

---

# 8. Satellite imagery

**VERIFIED:** Satellite imagery was among the alternative datasets used.

The exact imagery methodology is not remembered. Do not claim particular objects/sites were measured. The safe point is that physical-world observations were another independent source that could be compared with digital/transaction/fundamental signals.

---

# 9. Automotive / Industrials context

Public M Science materials describe automotive research around unit sales, dealership inventories, share, pricing and aging and Industrials coverage across Building Products and Heavy Machinery. This is useful context for understanding the broader team's work but is **not evidence that Nevyn personally produced every one of those datasets or KPIs**.

A general M Science research mental model is:

```text
multiple imperfect alternative datasets
 -> understand what each observation represents
 -> clean / transform / aggregate
 -> construct research KPIs or predictive features
 -> compare against history / fundamentals / peers
 -> triangulate independent signals
 -> publish a recurring research view
```

---

# 10. Forum-ready M Science story — revised

> "At M Science I was on the Industrials quantitative research team. The company had a mature AWS/Databricks data platform behind the research process, and my work was closer to the analytics and reporting layer. I used Python, SQL and PySpark/Databricks to work with alternative datasets including job postings, point-of-sale data, satellite imagery and web-derived product data. One analysis I remember particularly well tracked SKU availability through a site's cart flow and used changes over time to estimate product sell-through. I helped turn analyses like those into recurring BlueMatrix reports. Each month I would review the prior reports, pull the current data, compare what had changed, and help update the analysis and narrative. I had also started building a Power BI dashboard using PySpark queries so some of that recurring analysis could be surfaced more directly. What I took from the role was that the hard part of alternative data isn't collecting a weird dataset—it's understanding what the observation actually means, turning it into a stable measure, and then deciding whether it tells you something incremental about the underlying business. That's the part that maps directly to Forum's attention-index problem."

This version now cleanly separates the enterprise architecture from Nevyn's actual contribution.

---

# 11. Likely Forum follow-ups

Be ready for:

**"What did you personally own?"**

> "I wasn't building M Science's entire data platform. I was consuming the research datasets in Databricks/PySpark, doing analysis and modeling, contributing to the recurring BlueMatrix research, and beginning the Power BI dashboard work."

**"How did you know a signal worked?"**

Answer with remembered specifics if available. If not:

> "The standard I learned was that a signal had to be compared against the historical series, reported fundamentals and other independent datasets. I don't want to invent the exact validation statistic we used for every report, but the research process was explicitly about determining whether the alternative dataset added information rather than treating the raw series as ground truth."

**"Why is this relevant to attention indices?"**

> "Because the fundamental measurement problem is the same. A cart-state change isn't literally a sale, just like a social mention isn't literally attention. You have to understand the data-generation process, filter artifacts, normalize the measure, aggregate it into something stable, and validate that the resulting index behaves the way you claim it does."
