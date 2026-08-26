-- 004: job_postings — scraped leads, folded in from the bracketlens prototype.
--
-- DESIGN NOTE (deliberate deviation, please read before "simplifying" this):
-- Scraped postings do NOT go into `applications`. That table feeds `v_funnel`,
-- which computes `applied` as COUNT(*) over every row. Inserting a nightly
-- scrape there would report dozens of "applied" for jobs never applied to, and
-- the funnel exists precisely so stall diagnosis is a query rather than a
-- feeling. It would also fight the v2 phase discipline: applications are
-- deliberately deferred to 2026-11-01 behind the 2026-10-31 gate, so nothing
-- should be creating application rows during Phase 1 at all.
--
-- So: postings live here, and a posting becomes an application only when the
-- human applies (see `promoted_application_id`). The funnel stays truthful.

CREATE TABLE IF NOT EXISTS job_postings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id   TEXT NOT NULL UNIQUE,   -- stable hash of job_url; dedupes re-scrapes
  title         TEXT NOT NULL,
  company       TEXT,
  location      TEXT,
  job_url       TEXT NOT NULL,
  source        TEXT,                   -- indeed / linkedin / glassdoor / ...
  salary_min    INTEGER,
  salary_max    INTEGER,
  date_posted   TEXT,

  -- Scoring, computed at scrape time from public/curriculum.json.
  skills        TEXT,                   -- JSON array of matched curriculum skills
  skill_score   REAL DEFAULT 0,         -- 0..1 fraction of tracked skills matched
  comp_score    REAL DEFAULT 0,         -- 0..1 vs the student's target band
  score         REAL DEFAULT 0,         -- combined rank used by the briefing

  status        TEXT NOT NULL DEFAULT 'new',  -- new / saved / dismissed / promoted
  promoted_application_id INTEGER,      -- set when this becomes a real application
  first_seen    TEXT NOT NULL,
  last_seen     TEXT NOT NULL,

  FOREIGN KEY (promoted_application_id) REFERENCES applications(id)
);

CREATE INDEX IF NOT EXISTS idx_postings_rank
  ON job_postings(status, score DESC, last_seen DESC);

-- What the 6am briefing reads: unseen, undismissed, best first.
DROP VIEW IF EXISTS v_posting_shortlist;
CREATE VIEW v_posting_shortlist AS
SELECT id, title, company, location, job_url, source,
       salary_min, salary_max, skills, skill_score, comp_score, score, first_seen
FROM job_postings
WHERE status = 'new'
ORDER BY score DESC, last_seen DESC;
