# Day 1 — Ingest · Inspect · Quality Log  (~2.5 hrs)

**Goal:** load all 3 feeds, understand the mess, and produce a data-quality log.
**File you edit:** `pipeline/ingest.py` (admin feed is worked for you — fill the `# TODO`s).

## Steps
- [ ] `pip install -r requirements.txt`
- [ ] `python pipeline/ingest.py` — see the admin inspection + 1 example logged issue
- [ ] Inspect the other two feeds (uncomment the two `inspect(...)` lines in `__main__`)
- [ ] Implement `find_panel_issues()` — log the **negative AUM**, **future vintage year**, **duplicate panel_id**
- [ ] Implement `find_format_issues()` — log **mixed date formats**, **`'$2.2B'` string AUM**, **3 strategy vocabularies**
- [ ] Re-run — the quality log should print **~6+ issues** as a table

## Done when
All 3 feeds inspected, and `quality_log` catches every injected panel issue **plus** the
format issues. That printed table is your deliverable.

## Drill (30 min, then log it in the dashboard)
pandas muscle — for each feed, get these without looking them up:
`.shape` · `.dtypes` · `.isna().sum()` · `.duplicated().sum()` · `.value_counts()` on one column.
Then write on paper the SQL that surfaces the duplicate:
`SELECT panel_id FROM panel GROUP BY panel_id HAVING COUNT(*) > 1;`

## Interview rep (15 min — write 3 sentences)
> "When I ingest an untrusted feed, the first thing I do is ___, because ___.
> The issue I'd flag hardest in this data is ___, because downstream it would ___."

## Tomorrow — Day 2 preview
Harmonize what you logged today: AUM → USD millions, dates → real `DATE`,
strategy → one taxonomy. Output the typed **silver** table. (No need to read ahead.)
