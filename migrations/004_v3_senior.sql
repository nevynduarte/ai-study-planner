-- 004: v3 senior/staff plan (20h/week, 520h budget, senior Nov 2026 / staff Feb 2027).
-- Every statement is idempotent, following 003's pattern (002 was not).
-- Safe to apply repeatedly against local or remote D1.

-- ---------------------------------------------------------------- gate 1
-- Senior applications do not open on a flagship that is merely "nearly
-- deployed", so Gate 1 gains a fifth criterion.
INSERT INTO gate_check (criterion, passed) VALUES ('flagship_live', 0)
ON CONFLICT(criterion) DO NOTHING;

-- ---------------------------------------------------------------- gate 2
-- Staff lane (2027-02-01). Prefixed staff_ so a single table carries both
-- gates without the API needing to know about the split.
INSERT INTO gate_check (criterion, passed) VALUES
  ('staff_load_test', 0),
  ('staff_writeup', 0),
  ('staff_depth', 0),
  ('staff_scope_narrative', 0)
ON CONFLICT(criterion) DO NOTHING;

-- ------------------------------------------------------------- artifacts
-- The six flagship deliverables plus the one foundations artifact worth
-- tracking centrally. These are the plan's actual output: study hours that
-- do not end in one of these produced no evidence.
INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Flagship M1 - design doc + ingestion live', 'system', 'flagship', 'planned',
       'Design doc with SLOs committed; ingestion running against real data', 1,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Flagship M1 - design doc + ingestion live');

INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Flagship M2 - eval harness with labelled set', 'system', 'flagship', 'planned',
       'Hand-labelled eval set + versioned harness + a measured before/after', 1,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Flagship M2 - eval harness with labelled set');

INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Flagship M3 - deployed and instrumented', 'system', 'flagship', 'planned',
       'Live service + dashboard showing p50/p99 latency and cost per 1K requests', 1,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Flagship M3 - deployed and instrumented');

INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Flagship M4 - load test report', 'system', 'flagship', 'planned',
       '100x load test: QPS, p50/p99 curves, cost curve, bottleneck analysis, the fix, the re-test', 2,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Flagship M4 - load test report');

INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Flagship M5 - public technical writeup', 'blog-post', 'flagship', 'planned',
       'Published, with real numbers, evidence_url set', 2,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Flagship M5 - public technical writeup');

INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Flagship M6 - onsite talk-track', 'system', 'flagship', 'planned',
       '20-minute deep-dive rehearsed out loud: context/architecture/tradeoff/failure/next', 3,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Flagship M6 - onsite talk-track');

INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at)
SELECT 'Foundations - autograd engine', 'reproduction', 'foundations', 'planned',
       'Working autograd engine with tests; backprop derivable on a whiteboard', 1,
       datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM artifacts WHERE title = 'Foundations - autograd engine');

-- ---------------------------------------------------------------- status
INSERT INTO status (key, value, updated_at) VALUES
  ('plan_version', 'v3-senior-staff-20h', datetime('now')),
  ('weekly_target_hours', '20', datetime('now')),
  ('gate_2_date', '2027-02-01', datetime('now')),
  ('staff_applications_open_date', '2027-02-01', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
