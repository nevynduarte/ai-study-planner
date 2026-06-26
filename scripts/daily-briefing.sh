#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Daily 6am run on P620 (cron). Uses local Claude Max (no API key).
#   1. SMS briefing  → T-Mobile email-to-SMS
#   2. 3-hour plan   → D1 daily_plan
#   3. Frontier digest (web search) → D1 frontier
#
# Usage:
#   daily-briefing.sh              full run (briefing + plan + frontier)
#   daily-briefing.sh --plan-only  regenerate ONLY today's plan → D1
#                                   (skips the SMS briefing and frontier;
#                                    use to refresh today's plan on demand)
# ─────────────────────────────────────────────────────────────
set -e

PLAN_ONLY=0
case "${1:-}" in
  --plan-only) PLAN_ONLY=1 ;;
  "") ;;
  *) echo "Unknown option: $1 (use --plan-only or no args)" >&2; exit 2 ;;
esac

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

TODAY="$(date +%Y-%m-%d)"
LOG="$PROJECT/logs/briefing.log"
mkdir -p "$(dirname "$LOG")"
log_line() { echo "[$(date)] $*" | tee -a "$LOG"; }

log_line "$([ "$PLAN_ONLY" = 1 ] && echo "Starting plan-only run..." || echo "Starting daily run...")"

CTX="$(mktemp)"; build_context "$CTX"

# 1) SMS briefing → email-to-SMS  (skipped in --plan-only)
if [ "$PLAN_ONLY" = 0 ]; then
  BRIEFING="$(claude -p "$(cat "$DIR/briefing-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"
  if [ -n "$BRIEFING" ]; then
    if send_push "AI Study Briefing - $(date +'%a, %b %-d')" "$BRIEFING" "$APP_URL"; then
      log_line "Briefing pushed via ntfy"
    else
      log_line "WARN: push failed (check config/notify.local.json)"
    fi
  else
    log_line "WARN: empty briefing, nothing pushed"
  fi
fi

# 2) Today's 3-hour plan → D1
PLAN="$(claude -p "$(cat "$DIR/plan-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"
if [ -n "$PLAN" ]; then
  d1_put_content daily_plan "$TODAY" "$PLAN"
  log_line "Plan written to D1"
else
  log_line "WARN: empty plan"
fi

# 3) Frontier digest (web search) → D1  (skipped in --plan-only)
if [ "$PLAN_ONLY" = 0 ]; then
  FRONTIER="$(claude -p "$(cat "$DIR/frontier-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"
  if [ -n "$FRONTIER" ]; then
    d1_put_content frontier "$TODAY" "$FRONTIER"
    log_line "Frontier written to D1"
  else
    log_line "WARN: empty frontier"
  fi
fi

rm -f "$CTX"
log_line "$([ "$PLAN_ONLY" = 1 ] && echo "Plan-only run complete." || echo "Daily run complete.")"
