# M Science / Jefferies — Best-Effort Methodology Reconstruction

This document is intentionally split into three evidence levels:

- **VERIFIED:** supported by the resume, user notes, or existing application facts.
- **USER-CONFIRMED:** directly supplied by Nevyn in conversation.
- **INFERRED:** reconstructed from Nevyn's confirmed work plus public descriptions of M Science's historical/current research model, Industrials coverage, Automotive methodology, and common alternative-data practice. Inferred items are for interview preparation and hypothesis generation; do not state them as remembered facts unless Nevyn confirms them.

## 1. Role and research model

**VERIFIED**
- Quantitative Equity Research Associate — Industrials.
- Used Python, SQL, PySpark/Databricks, FactSet/REST workflows.
- Worked with satellite imagery, job postings, point-of-sale transactions, company fundamentals, and millions of observations.
- Produced 10+ research reports.

**PUBLIC-CONTEXT INFERENCE**
M Science's research model is to take raw alternative datasets, map them to company/industry KPIs, test whether those measures provide timely information about demand, volume, inventory, pricing, share, or operating activity, and publish analyst-curated research rather than simply hand raw data to clients. Public M Science materials describe signal detection around inflections, estimate revisions, share shifts and demand changes, and current data-science roles emphasize testing data assets, panel improvement, statistical modeling, Python/SQL/PySpark and large unstructured data.

A useful mental model for Nevyn's work is therefore:

```text
raw alternative observations
    -> source/data audit
    -> entity/SKU/company mapping
    -> cleaning and deduplication
    -> aggregation to a stable KPI proxy
    -> normalization / seasonal adjustment
    -> historical comparison and validation
    -> triangulation with fundamentals / other datasets
    -> company or industry research conclusion
    -> report/dashboard/client discussion
```

---

# 2. Job-posting data signal

**USER-CONFIRMED:** Job-posting data was one of the report inputs/analyses.

## Likely research question — INFERRED

Use hiring activity as a proxy for business activity, demand expectations, capacity expansion/contraction, geographic expansion, or changes in role mix.

For an industrial company, examples could include:
- total active postings over time;
- new postings per week/month;
- posting removals/fill rates;
- hiring by geography;
- hiring by function: manufacturing, engineering, sales, field service, supply chain, corporate;
- company hiring relative to peers;
- acceleration/deceleration before earnings or reported headcount/capex changes.

## Plausible pipeline — INFERRED

```text
raw posting records
 -> normalize company / subsidiary names
 -> dedupe reposted or syndicated jobs
 -> normalize title, location and function
 -> distinguish new vs still-active vs removed postings
 -> aggregate by company/week/function/location
 -> create growth / change features
 -> compare with reported KPIs and peers
```

Potential derived measures:

```text
active_jobs_t
new_jobs_t
removed_jobs_t
net_job_change_t = new_jobs_t - removed_jobs_t
job_growth_4w = active_jobs_t / active_jobs_{t-4w} - 1
function_share = postings_in_function / total_postings
company_vs_peer_z = standardized(company_growth - peer_growth)
```

## Why normalization probably mattered — INFERRED

Raw posting counts are not directly comparable because:
- firms have different absolute workforces;
- postings are duplicated across locations/boards;
- company career-site practices change;
- seasonality differs by hiring function;
- a posting can remain open for weeks without implying incremental hiring each day.

Reasonable research transformations would therefore include percentage changes, rolling averages, company-specific baselines, peer-relative measures, and possibly z-scores rather than comparing raw counts.

## Interview-safe phrasing

> "One dataset I worked with was job postings. The value wasn't the raw count by itself; the work was turning noisy posting histories into a company-level hiring signal—cleaning duplicates, structuring jobs by company/function/location, looking at changes over time, and then comparing that signal with fundamentals and other datasets to see whether it told us anything incremental about business activity."

The dedupe/function/location details above are inferred unless specifically remembered.

---

# 3. SKU / cart-availability sales proxy

**USER-CONFIRMED:** A report/analysis monitored changes in an item's SKU state by simulating putting an item into a cart, and used those changes to estimate the number of units sold over time.

This is one of the strongest Forum-style examples because it shows how an apparently mundane web behavior can be converted into a quantitative proxy for an economically meaningful variable.

## Likely measurement model — INFERRED

Suppose a retailer or manufacturer site exposes some inventory/availability signal when the same SKU is queried or added to cart repeatedly.

```text
SKU s at time t
 -> observed available quantity / availability state Q[s,t]
 -> repeated snapshot at t+1
 -> downward movement may indicate unit depletion
```

A naive sales proxy might be:

```text
estimated_units_sold[s,t] = max(Q[s,t-1] - Q[s,t], 0)
```

But real research would need to account for inventory replenishment and site behavior:

```text
observed inventory change = sales depletion - replenishment +/- measurement noise
```

So the useful signal likely came from repeated observations and aggregation rather than treating every decrease as a literal sale.

## Likely cleaning / anomaly issues — INFERRED

- page/cart API errors;
- max-cart caps that hide true inventory;
- SKU restocks causing positive jumps;
- SKU replacement / product relabeling;
- regional warehouse differences;
- out-of-stock flags vs exact quantity;
- site redesigns changing scrape/cart behavior;
- product bundles or variants;
- bots/rate limiting;
- cancelled carts or reservations that temporarily reduce visible availability.

## Plausible signal construction — INFERRED

At the SKU level:

```text
inventory_drop[s,t] = max(Q[s,t-1] - Q[s,t], 0)
replenishment[s,t] = max(Q[s,t] - Q[s,t-1], 0)
```

Then aggregate across SKUs and time:

```text
sales_proxy[t] = sum_s adjusted_inventory_drop[s,t]
```

Possible adjustments:
- exclude implausible one-step drops;
- flag restock periods;
- require repeated observations before accepting a transition;
- smooth daily signal with rolling averages;
- aggregate by product family/brand/region;
- normalize against SKU coverage so additions/removals do not mechanically change the index.

## Validation — INFERRED

The most likely validation pattern in an institutional research setting would be to compare the web-derived sales proxy against some combination of:
- reported unit/revenue trends;
- company guidance;
- POS/transaction data;
- seasonal patterns;
- known product launches/promotions;
- peer/company fundamentals.

Rather than optimizing a complicated ML model immediately, a strong research workflow would first test whether the web-derived proxy tracks known historical activity consistently and whether it adds lead time or granularity to traditional data.

## Interview-safe phrasing

> "A good example was SKU-level web data. We could repeatedly interact with an item through the site's cart flow and observe changes in the apparent availability of that SKU. By tracking those changes over time and handling things like restocks and noisy observations, we could turn the web behavior into a proxy for product sell-through. The important part wasn't the scrape itself; it was deciding when a change represented economic activity versus site or inventory noise, then aggregating the SKU-level observations into something useful for equity research."

This framing is supported by the user-confirmed mechanism; the exact filters/aggregation are reconstructed.

---

# 4. Point-of-sale / transaction panels

**VERIFIED:** Point-of-sale transactions were used. Millions of transaction observations were used in predictive equity modeling.

## Likely use — INFERRED

Estimate company/brand/product demand, revenue trend, market share, or growth before reported financial results.

Typical pipeline:

```text
transactions
 -> merchant/product mapping
 -> remove duplicates/refunds/bad observations
 -> aggregate spend/units by company and period
 -> normalize for panel composition/coverage
 -> seasonality / calendar adjustments
 -> year-over-year / sequential growth
 -> compare against reported revenue / same-store sales / units
```

A critical issue is panel stability. If the underlying sample of consumers or merchants changes, raw spending can move without the business changing. A credible signal therefore likely uses stable cohorts, weights, or normalization against panel totals.

## Interview-safe phrasing

> "For transaction/POS data, the hard part was making sure movement in the panel represented movement in the company rather than movement in the sample. We aggregated the observations into company-level measures and tested them against reported fundamentals and other alternative datasets rather than treating raw transaction totals as ground truth."

The exact panel-weighting method remains inferred.

---

# 5. Satellite imagery

**VERIFIED:** Satellite imagery was among the alternative datasets used.

## Likely Industrials uses — INFERRED

Depending on the covered company/industry, imagery could proxy physical activity such as:
- facility utilization;
- inventory/storage levels;
- construction progress;
- parking/vehicle activity;
- equipment/yard activity;
- distribution/logistics activity.

For M Science's publicly described Industrials coverage, relevant sectors include Building Products and Heavy Machinery. A plausible research use would be converting physical activity visible at facilities/dealers/yards into a time-series proxy, then triangulating it with hiring, transactions, inventory, pricing, or fundamentals.

## Methodology — INFERRED

```text
image/time/location
 -> geofence facility/dealer/yard
 -> extract/count relevant object/area/activity measure
 -> quality-control cloud/angle/coverage issues
 -> aggregate site -> company
 -> normalize for site coverage and seasonality
 -> compare with reported/other alt-data trends
```

Do not claim specific objects were counted unless remembered.

---

# 6. Automotive / inventory signals — public M Science context

**PUBLIC CONTEXT, not necessarily Nevyn's exact personal assignment:** Current M Science automotive products publicly track retail unit sales, dealership inventories, market share, pricing and aging, with daily low-lag estimates across major OEMs/models. Historical public descriptions of M Science also reference vehicle registration, inventory-management and automotive transaction datasets.

This makes the following general research pattern consistent with the organization:

```text
vehicle / dealer / listing / registration observations
 -> VIN/make/model normalization
 -> remove duplicate listings/records
 -> classify new vs used / model / powertrain
 -> track inventory additions/removals and age
 -> aggregate dealer -> make/model/OEM
 -> derive sales / inventory / days-supply / share / price measures
 -> compare with reported industry/OEM data
```

Potential derived KPIs:
- sales index;
- daily selling rate;
- inventory index;
- days supply;
- sales share / inventory share;
- average listed price;
- discounts / percent on sale;
- days on lot.

These KPIs are publicly described by M Science today. Do not claim Nevyn personally produced all of them.

---

# 7. Industrials research context

**PUBLIC CONTEXT:** M Science publicly describes Industrials coverage focused on Building Products and Heavy Machinery, including companies such as Caterpillar, Cummins, Deere, PACCAR, Rockwell Automation, United Rentals, Carrier, Trane, Stanley Black & Decker, Vertiv and Whirlpool.

A plausible multi-source Industrials research workflow — **INFERRED** — would combine:
- job postings as a labor/capacity/demand signal;
- SKU/inventory/web activity for sell-through and channel activity where available;
- transaction/POS panels for demand;
- satellite/physical activity proxies;
- company fundamentals / FactSet estimates;
- potentially dealer/distributor inventory, pricing or web data depending on the name.

The goal is not to make every dataset predict earnings independently. It is to triangulate several imperfect proxies into a more robust view of operating trends.

---

# 8. Likely statistical framework

The exact M Science implementation is unknown. For interview preparation, the most defensible reconstruction is a transparent panel/signal workflow before sophisticated ML.

## Level 1: clean raw measures

```text
x_company,t
```

## Level 2: transform / normalize

Common candidates:

```text
log1p(x)
percent change
YoY growth
rolling mean
rolling median
z-score vs company history
peer-relative z-score
share of industry total
```

Example:

```text
z_t = (x_t - mean(x_{t-L:t-1})) / std(x_{t-L:t-1})
```

Robust alternative:

```text
z_robust = (x_t - median(window)) / (1.4826 * MAD(window))
```

## Level 3: combine multiple features

For predictive modeling, likely candidates include linear/regression baselines, regularized models, tree/boosting models, or other statistical ML depending on target. The resume confirms predictive equity models in PySpark/Databricks but not the exact algorithms.

## Level 4: validate out of sample

Likely principles:
- temporal train/test split rather than random split;
- point-in-time inputs only;
- compare against naive/traditional baseline;
- test stability across companies/periods;
- examine feature importance/sensitivity;
- compare signal with realized company KPI/reported result.

Again, these are appropriate reconstructions, not remembered implementation details.

---

# 9. Forum-ready M Science story

Use this as the **working** 90-second story, editing any part that sounds wrong:

> "At M Science I worked on the Industrials quantitative research team using alternative data to build earlier reads on company fundamentals. The datasets were pretty different—job postings, point-of-sale/transaction data, satellite imagery, fundamentals, and web-derived product data. One example I remember well was monitoring SKU availability through a site's cart flow. Repeated changes in an item's apparent inventory could be turned into a proxy for sell-through over time, but only after separating likely sales from restocks and site noise and aggregating the SKU-level observations into a stable series. We also used job-posting histories as a measure of hiring and operating activity and worked with millions of observations in PySpark/Databricks. The general research process was to understand how the raw data was generated, clean and normalize it, construct a company-level signal, compare it with fundamentals and other independent datasets, and then turn the results into institutional research. That's why Forum is interesting to me—the raw data is different, but the core problem of turning noisy behavioral observations into a trustworthy, interpretable index is very familiar."

The cart/SKU mechanism and major dataset categories are verified/user-confirmed. References to separating restocks/site noise, normalization, and triangulation are best-effort reconstruction of the likely methodology and should be corrected if memory contradicts them.

---

# 10. Forum follow-up drill

If asked "How would you translate that experience to Forum?" use the same research pattern:

```text
search/social/streaming raw data
 -> audit source generation process
 -> entity/topic mapping
 -> dedupe/bot/noise filtering
 -> source-specific normalization
 -> transparent baseline index
 -> cross-source weighting / breadth
 -> point-in-time backtest
 -> manipulation + outage stress tests
 -> publish methodology and confidence diagnostics
```

The strongest connection to M Science is not "I already built exactly this index." It is:

> "I've already done the core alternative-data research problem: deciding what a noisy digital observation means economically and turning many observations into a stable signal that an investor can reason about."
