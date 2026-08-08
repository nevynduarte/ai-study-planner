-- ─────────────────────────────────────────────────────────────
-- 003_tandem_tiers.sql — run the tier-one lane in tandem with the
-- Series B–D floor. Additive only: nothing from 002 is dropped or
-- rewritten. Unlike 002, every statement here is idempotent, so
-- re-running against remote is safe.
-- ─────────────────────────────────────────────────────────────

-- Same funnel counts as v_funnel, but grouped by tier — so "is the
-- tier-one lane converting, or only the floor?" is a query, not a hope.
-- Leaves v_funnel untouched (the overall numbers still come from there).
DROP VIEW IF EXISTS v_funnel_by_tier;
CREATE VIEW v_funnel_by_tier AS
SELECT
  COALESCE(tier, 'untagged')                                            AS tier,
  COUNT(*)                                                              AS applied,
  COALESCE(SUM(CASE WHEN stage IN ('screen','onsite','offer','closed') THEN 1 ELSE 0 END),0) AS reached_screen,
  COALESCE(SUM(CASE WHEN stage IN ('onsite','offer','closed')          THEN 1 ELSE 0 END),0) AS reached_onsite,
  COALESCE(SUM(CASE WHEN stage IN ('offer','closed')                   THEN 1 ELSE 0 END),0) AS offers
FROM applications
GROUP BY COALESCE(tier, 'untagged');

-- The one deliberate spike: a public writeup of existing production work
-- at the alt-data × production-AI intersection. This is the shared
-- differentiator for BOTH lanes (frontier-adjacent applied + quant), which
-- is why it is promoted to phase 1 rather than deferred to the month-12
-- artifact track. It writes up work that already exists — it is not a new
-- build, so it is not the "reproductions as avoidance" trap in not_doing.
-- Guarded so re-running 003 never duplicates it.
INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT
  'Alt-data × production-AI writeup', 'blog-post', 'search', 'planned',
  'One published writeup (LETF scanner or Valorem) stating problem, architecture, and real eval numbers — demonstrating the alt-data-signals + production-ML intersection, not just claiming it. Linked from resume and pinned repos. Done when public with a URL and at least one hard metric.',
  1, datetime('now'), datetime('now')
WHERE NOT EXISTS (
  SELECT 1 FROM artifacts WHERE title = 'Alt-data × production-AI writeup'
);
