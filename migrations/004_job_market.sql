-- Job-market skill-demand scan (weekly, from P620 via JobSpy).
-- Apply with: wrangler d1 execute ai-study-planner --remote --file=migrations/004_job_market.sql
CREATE TABLE IF NOT EXISTS job_market (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  content      TEXT NOT NULL,
  generated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_job_market_date ON job_market(date);
