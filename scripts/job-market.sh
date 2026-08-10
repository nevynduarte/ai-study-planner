#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Weekly on P620 (Sunday 9pm ET). Scrapes live postings for the
# target roles with JobSpy (job-market.py), and writes the
# skill-demand report to D1 job_market. build_context includes the
# latest report, so the briefing/plan/advisory see real market
# demand — including skills the curriculum doesn't cover.
# One-time setup: pip install "python-jobspy>=1.1.82"
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

TODAY="$(date +%Y-%m-%d)"
LOG="$PROJECT/logs/job-market.log"
mkdir -p "$(dirname "$LOG")"

PY="python3"
command -v python3 >/dev/null 2>&1 || PY="python"

REPORT="$("$PY" "$DIR/job-market.py" 2>>"$LOG")" || {
  echo "[$(date)] WARN: job-market scan failed (see above)" >> "$LOG"
  exit 0
}

if [ -z "$REPORT" ]; then
  echo "[$(date)] WARN: empty job-market report" >> "$LOG"
  exit 0
fi

d1_put_content job_market "$TODAY" "$REPORT"
echo "[$(date)] Job-market report written to D1" >> "$LOG"
