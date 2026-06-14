#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Hourly on P620 (cron). Answers tutor questions submitted from the web.
# Reads unanswered rows from D1 tutor_qa, runs local Claude, writes back.
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

LOG="$PROJECT/logs/tutor.log"
mkdir -p "$(dirname "$LOG")"
log_line() { echo "[$(date)] $*" >> "$LOG"; }

# Fetch unanswered questions as: "<id> <base64(question)>" per line.
QJSON="$(d1_json "SELECT id, question FROM tutor_qa WHERE answer IS NULL ORDER BY id ASC LIMIT 10;")"
ROWS="$(printf "%s" "$QJSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s),r=(j[0]&&j[0].results)||[];for(const x of r)console.log(x.id+" "+Buffer.from(String(x.question)).toString("base64"));}catch(e){}})')"

if [ -z "$ROWS" ]; then
  log_line "No unanswered questions."
  exit 0
fi

CTX="$(mktemp)"; build_context "$CTX"

while read -r ID Q_B64; do
  [ -z "$ID" ] && continue
  QUESTION="$(printf "%s" "$Q_B64" | base64 -d)"
  log_line "Answering #$ID: $QUESTION"

  ANSWER="$(claude -p "$(cat "$DIR/tutor-prompt.txt")

$(cat "$CTX")

QUESTION:
$QUESTION" 2>>"$LOG")"

  if [ -z "$ANSWER" ]; then
    log_line "Empty answer for #$ID, skipping"
    continue
  fi

  NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  TMP="$(mktemp)"
  printf "UPDATE tutor_qa SET answer='%s', answered_at='%s' WHERE id=%s;\n" \
    "$(sql_escape "$ANSWER")" "$NOW" "$ID" > "$TMP"
  d1_file "$TMP"
  rm -f "$TMP"
  log_line "Answered #$ID"
done <<< "$ROWS"

rm -f "$CTX"
log_line "Tutor run complete."
