-- ─────────────────────────────────────────────────────────────
-- 002_v2_plan.sql — v2 MLE plan (10h/week, $200-300K target,
-- applications open 2026-11-01, readiness gate 2026-10-31).
-- Adds the application pipeline, the artifact ledger, and the
-- Month-3 gate; remaps historical rows off the old track IDs.
-- ─────────────────────────────────────────────────────────────

-- The pipeline is a state machine, not a checklist: a row moves
-- applied → screen → onsite → offer → closed, and stalls are
-- diagnosed by which transition stops happening.
CREATE TABLE IF NOT EXISTS applications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  company      TEXT NOT NULL,
  role         TEXT NOT NULL,
  tier         TEXT,               -- series-bd / midsize / quant-eng / hyperscaler
  source       TEXT,               -- referral / recruiter / cold / inbound
  comp_low     INTEGER,
  comp_high    INTEGER,
  stage        TEXT NOT NULL DEFAULT 'applied',  -- applied → screen → onsite → offer → closed
  outcome      TEXT,               -- active / rejected / withdrawn / accepted / declined
  applied_date TEXT,
  last_touch   TEXT,
  contact      TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_applications_stage        ON applications (stage);
CREATE INDEX IF NOT EXISTS idx_applications_applied_date ON applications (applied_date);
CREATE INDEX IF NOT EXISTS idx_applications_last_touch   ON applications (last_touch);

-- Funnel counts, so stall diagnosis is a query rather than a feeling.
DROP VIEW IF EXISTS v_funnel;
CREATE VIEW v_funnel AS
SELECT
  COUNT(*)                                                              AS applied,
  COALESCE(SUM(CASE WHEN stage IN ('screen','onsite','offer','closed') THEN 1 ELSE 0 END),0) AS reached_screen,
  COALESCE(SUM(CASE WHEN stage IN ('onsite','offer','closed')          THEN 1 ELSE 0 END),0) AS reached_onsite,
  COALESCE(SUM(CASE WHEN stage IN ('offer','closed')                   THEN 1 ELSE 0 END),0) AS offers
FROM applications;

-- Artifacts have different completion semantics from study — a
-- reproduction is done when metrics match, not when a video is
-- watched — hence a separate table with an explicit done_when.
CREATE TABLE IF NOT EXISTS artifacts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  kind         TEXT NOT NULL,      -- reproduction / oss-pr / blog-post / system / resume
  track        TEXT,
  status       TEXT NOT NULL DEFAULT 'planned',  -- planned / in-progress / shipped
  evidence_url TEXT,               -- required to mark shipped (enforced by the API)
  done_when    TEXT,
  phase        INTEGER,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- Gate: checked_at exists so "one more month" has to be an explicit,
-- dated decision instead of a quiet extension.
CREATE TABLE IF NOT EXISTS gate_check (
  criterion  TEXT PRIMARY KEY,
  passed     INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT,
  evidence   TEXT,
  notes      TEXT
);
INSERT INTO gate_check (criterion, passed) VALUES
  ('dsa', 0), ('sysdesign', 0), ('recall', 0), ('assets', 0)
ON CONFLICT(criterion) DO NOTHING;

-- Remap historical rows off the old track IDs (keep the rows).
UPDATE study_log SET track = 'sys-design' WHERE track IN ('ai-eng', 'ml-eng');
UPDATE study_log SET track = 'ml-recall'  WHERE track IN ('data-sci', 'quant');
UPDATE skill_coverage SET track = 'sys-design' WHERE track IN ('ai-eng', 'ml-eng');
UPDATE skill_coverage SET track = 'ml-recall'  WHERE track IN ('data-sci', 'quant');

-- Phase-1 assets tracked as artifacts, each with an explicit done_when.
INSERT INTO artifacts (title, kind, track, status, done_when, phase, created_at, updated_at) VALUES
  ('Canonical resume', 'resume', 'search', 'planned',
   'One page, canonical frame "builds production ML systems that make money", leads with Valorem (3M+ property records, 13-service FastAPI/GraphQL pipeline on AWS), M Science as the credibility line; reviewed by one person who hires MLEs.',
   1, datetime('now'), datetime('now')),
  ('Alt-data swap-in block', 'resume', 'search', 'planned',
   'A drop-in bullet block that converts the canonical resume to a quant/alt-data variant in under 5 minutes.',
   1, datetime('now'), datetime('now')),
  ('3 pinned GitHub repos', 'system', 'search', 'planned',
   'Three pinned repos, each README stating the problem, the architecture, and one number.',
   1, datetime('now'), datetime('now'));

-- Plan-version markers.
INSERT INTO status (key, value, updated_at) VALUES
  ('plan_version',           'v2-mle-200-300k', datetime('now')),
  ('applications_open_date', '2026-11-01',      datetime('now')),
  ('gate_date',              '2026-10-31',      datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
