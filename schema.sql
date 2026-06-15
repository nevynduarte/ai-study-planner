-- AI Study Planner — Cloudflare D1 schema
-- Apply with: wrangler d1 execute ai-study-planner --remote --file=schema.sql
--
-- P620 (Claude Max, local) writes daily_plan / frontier / advisory / status.
-- The web app only writes study_log (session logging) and tutor_qa (questions).

CREATE TABLE IF NOT EXISTS daily_plan (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  content      TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS frontier (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  content      TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS advisory (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  content      TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  hours      REAL NOT NULL,
  topic      TEXT NOT NULL,
  track      TEXT,            -- which curriculum track (ai-eng / ml-eng / data-sci / quant); NULL = unassigned
  notes      TEXT,
  created_at TEXT NOT NULL
);

-- Migration for existing DBs (no-op if the column already exists):
--   ALTER TABLE study_log ADD COLUMN track TEXT;

-- Skill coverage matrix — the unit of "ground covered". One row per
-- (track, skill). Status is one of: not-started / learning / built /
-- interview-ready. P620's nightly advisory upserts this from the study log.
CREATE TABLE IF NOT EXISTS skill_coverage (
  track      TEXT NOT NULL,
  skill      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'not-started',
  evidence   TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (track, skill)
);

CREATE TABLE IF NOT EXISTS status (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL
);

-- Tutor Q&A: the web app inserts a question (answer NULL); P620's hourly
-- answer-questions.sh fills in answer + answered_at.
CREATE TABLE IF NOT EXISTS tutor_qa (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT,
  created_at  TEXT NOT NULL,
  answered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_date ON daily_plan(date);
CREATE INDEX IF NOT EXISTS idx_frontier_date   ON frontier(date);
CREATE INDEX IF NOT EXISTS idx_advisory_date   ON advisory(date);
CREATE INDEX IF NOT EXISTS idx_study_log_date  ON study_log(date);
CREATE INDEX IF NOT EXISTS idx_study_log_track ON study_log(track);
CREATE INDEX IF NOT EXISTS idx_tutor_unanswered ON tutor_qa(answer);
CREATE INDEX IF NOT EXISTS idx_coverage_track  ON skill_coverage(track);
