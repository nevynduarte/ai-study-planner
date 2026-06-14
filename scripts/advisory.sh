#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Nightly on P620 (cron, 11pm ET). Generates a brutally honest
# plan-health advisory from status + study log, writes to D1 advisory.
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

TODAY="$(date +%Y-%m-%d)"
LOG="$PROJECT/logs/advisory.log"
mkdir -p "$(dirname "$LOG")"

CTX="$(mktemp)"; build_context "$CTX"

ADVISORY="$(claude -p "$(cat "$DIR/advisory-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"

if [ -n "$ADVISORY" ]; then
  d1_put_content advisory "$TODAY" "$ADVISORY"
  echo "[$(date)] Advisory written to D1" >> "$LOG"
else
  echo "[$(date)] WARN: empty advisory" >> "$LOG"
fi

rm -f "$CTX"
