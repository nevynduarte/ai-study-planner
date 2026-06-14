#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Daily 6am AI Study Briefing
# Runs via cron on P620, uses Claude Code, sends via T-Mobile email-to-SMS
# ─────────────────────────────────────────────────────────────

PROMPT_FILE="$HOME/projects/ai-study-planner/scripts/briefing-prompt.txt"
TO="9176500432@tmomail.net"
LOG="$HOME/projects/ai-study-planner/logs/briefing.log"

mkdir -p "$(dirname "$LOG")"
echo "[$(date)] Starting daily briefing..." >> "$LOG"

# Run Claude Code with the prompt, capture output
BRIEFING=$(claude -p "$(cat "$PROMPT_FILE")" 2>> "$LOG")

if [ -z "$BRIEFING" ]; then
  echo "[$(date)] ERROR: Empty response from Claude" >> "$LOG"
  exit 1
fi

# Send via email-to-SMS (T-Mobile gateway)
echo "$BRIEFING" | mail -s "AI Study Briefing" "$TO"

echo "[$(date)] Briefing sent to $TO" >> "$LOG"
echo "[$(date)] ---" >> "$LOG"
