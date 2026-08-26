#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Nightly job scan → D1 job_postings.
#
# Folded in from the bracketlens prototype (archived 2026-08). Scrapes several
# boards, scores each posting against public/curriculum.json, and upserts into
# D1. The 6am briefing reads the shortlist from v_posting_shortlist.
#
# Postings are NOT applications. They land in job_postings and only become an
# `applications` row when you actually apply — otherwise v_funnel would report
# dozens of "applied" for jobs nobody applied to, and the funnel exists to make
# stall diagnosis a query rather than a feeling. See migrations/004.
#
#   bash scripts/scan-jobs.sh              # scrape + write to D1
#   bash scripts/scan-jobs.sh --dry-run    # show config, touch nothing
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

LOG="$PROJECT/logs/scan-jobs.log"
mkdir -p "$(dirname "$LOG")"
log_line() { echo "[$(date)] $*" | tee -a "$LOG"; }

if [ "${1:-}" = "--dry-run" ]; then
  python3 "$DIR/scan_jobs.py" --dry-run
  exit 0
fi

log_line "Starting job scan..."
RAW="$(mktemp)"
if ! python3 "$DIR/scan_jobs.py" --limit "${SCAN_LIMIT:-25}" > "$RAW" 2>>"$LOG"; then
  log_line "WARN: scraper failed — see $LOG"
  rm -f "$RAW"; exit 0        # a failed scrape must never fail the cron chain
fi

N="$(node -e 'const j=require(process.argv[1]);console.log(j.n||0)' "$RAW")"
if [ "$N" -eq 0 ]; then
  log_line "No postings returned (boards rate-limited or nothing new) — nothing written"
  rm -f "$RAW"; exit 0
fi

# Build the upsert. Re-seeing a posting refreshes last_seen and its score but
# never resets `status` — a posting you dismissed stays dismissed.
SQL="$(mktemp)"
node > "$SQL" <<'NODE'
const fs = require("fs");
const j = JSON.parse(fs.readFileSync(process.env.RAW, "utf8"));
const esc = v => v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
const num = v => (v === null || v === undefined || v === "") ? "NULL" : Number(v);
for (const p of j.postings) {
  console.log(
    `INSERT INTO job_postings
       (external_id,title,company,location,job_url,source,salary_min,salary_max,
        date_posted,skills,skill_score,comp_score,score,first_seen,last_seen)
     VALUES (${esc(p.external_id)},${esc(p.title)},${esc(p.company)},${esc(p.location)},
             ${esc(p.job_url)},${esc(p.source)},${num(p.salary_min)},${num(p.salary_max)},
             ${esc(p.date_posted)},${esc(JSON.stringify(p.skills || []))},
             ${num(p.skill_score)},${num(p.comp_score)},${num(p.score)},
             ${esc(p.first_seen)},${esc(p.last_seen)})
     ON CONFLICT(external_id) DO UPDATE SET
       last_seen=excluded.last_seen, score=excluded.score,
       skill_score=excluded.skill_score, comp_score=excluded.comp_score,
       skills=excluded.skills, salary_min=excluded.salary_min,
       salary_max=excluded.salary_max;`.replace(/\s+/g, " "));
}
NODE

RAW="$RAW" d1_file "$SQL" >/dev/null 2>>"$LOG" \
  && log_line "Wrote $N postings to D1" \
  || log_line "WARN: D1 write failed — see $LOG"

rm -f "$RAW" "$SQL"
log_line "Job scan complete."
