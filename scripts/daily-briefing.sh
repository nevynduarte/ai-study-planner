#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Daily 6am run on P620 (cron). Uses local Claude Max (no API key).
#   1. SMS briefing  → T-Mobile email-to-SMS
#   2. 10-hour plan  → D1 daily_plan
#   3. Frontier digest (web search) → D1 frontier
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

TODAY="$(date +%Y-%m-%d)"
LOG="$PROJECT/logs/briefing.log"
mkdir -p "$(dirname "$LOG")"
log_line() { echo "[$(date)] $*" | tee -a "$LOG"; }

log_line "Starting daily run..."

CTX="$(mktemp)"; build_context "$CTX"

# 1) SMS briefing → email-to-SMS
BRIEFING="$(claude -p "$(cat "$DIR/briefing-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"
if [ -n "$BRIEFING" ]; then
  echo "$BRIEFING" | mail -s "AI Study Briefing" "$SMS_TO"
  log_line "Briefing texted to $SMS_TO"
else
  log_line "WARN: empty briefing, no SMS sent"
fi

# 2) Today's 10-hour plan → D1
PLAN="$(claude -p "$(cat "$DIR/plan-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"
if [ -n "$PLAN" ]; then
  d1_put_content daily_plan "$TODAY" "$PLAN"
  log_line "Plan written to D1"
else
  log_line "WARN: empty plan"
fi

# 3) Frontier digest (web search) → D1
FRONTIER="$(claude -p "$(cat "$DIR/frontier-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"
if [ -n "$FRONTIER" ]; then
  d1_put_content frontier "$TODAY" "$FRONTIER"
  log_line "Frontier written to D1"
else
  log_line "WARN: empty frontier"
fi

rm -f "$CTX"
log_line "Daily run complete."
