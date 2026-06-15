#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Shared config + Cloudflare D1 helpers for the P620 scripts.
# All Claude intelligence runs locally (Claude Max) — no API key.
# Results are written to the remote D1 the Pages app reads from.
# ─────────────────────────────────────────────────────────────

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="${PROJECT:-$(cd "$LIB_DIR/.." && pwd)}"   # repo root (parent of scripts/)
DB_NAME="ai-study-planner"

# Task Scheduler launches a minimal shell that can't find claude/wrangler/node.
# Add their dirs to PATH on Windows (Git Bash) so scheduled runs work.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    export PATH="$PATH:$HOME/.local/bin:$HOME/AppData/Roaming/npm:/c/Program Files/nodejs"
    ;;
esac

APP_URL="https://ai-study-planner.nevynjduarte.workers.dev"
SMS_TO="9176500432@tmomail.net"   # T-Mobile email-to-SMS gateway (legacy fallback)

# Send a push notification via ntfy (open-source). Reads server/topic from
# config/notify.local.json. Supports a title, emoji tags, a tap-to-open link,
# and Markdown formatting in the body.
#   send_push "<title>" "<markdown body>" "<click url>"
send_push() {
  local title="$1" body="$2" click="$3" cfg="$PROJECT/config/notify.local.json"
  [ -f "$cfg" ] || { echo "send_push: missing $cfg" >&2; return 1; }
  # Use ntfy's JSON publishing API: message/title travel in JSON fields, so UTF-8
  # (emoji, em dashes) and Markdown survive and the body isn't misread as a file.
  local tmp server rc
  tmp="$(mktemp)"
  server="$(TITLE="$title" BODY="$body" CLICK="$click" node -e '
    const fs=require("fs");
    const cfg=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
    const payload={topic:cfg.ntfy_topic,title:process.env.TITLE,message:process.env.BODY,
      click:process.env.CLICK,tags:["sunny","books"],markdown:true};
    fs.writeFileSync(process.argv[2],JSON.stringify(payload));
    process.stdout.write(cfg.ntfy_server||"https://ntfy.sh");
  ' "$cfg" "$tmp")"
  curl -fsS -H "Content-Type: application/json" --data-binary @"$tmp" "$server" >/dev/null
  rc=$?
  rm -f "$tmp"
  return $rc
}

# Send the daily briefing as a text. On Windows (Git Bash) use a PowerShell SMTP
# helper that reads config/smtp.local.json; on Linux fall back to `mail`.
send_sms() {
  local body="$1"
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      local tmp rc
      tmp="$(mktemp)"; printf "%s" "$body" > "$tmp"
      powershell.exe -NoProfile -ExecutionPolicy Bypass \
        -File "$(cygpath -w "$LIB_DIR/send-sms.ps1")" \
        -BodyFile "$(cygpath -w "$tmp")"
      rc=$?
      rm -f "$tmp"
      return $rc
      ;;
    *)
      printf "%s" "$body" | mail -s "AI Study Briefing" "$SMS_TO"
      ;;
  esac
}

# Escape single quotes for inline SQL string literals.
sql_escape() { printf "%s" "$1" | sed "s/'/''/g"; }

# Run a SQL file against the remote D1.
d1_file() { wrangler d1 execute "$DB_NAME" --remote --file="$1"; }

# Run a SQL command against the remote D1, return JSON to stdout.
d1_json() { wrangler d1 execute "$DB_NAME" --remote --json --command "$1"; }

# d1_put_content <table> <date> <content>
# One row per date (idempotent re-runs replace the day's row).
d1_put_content() {
  local table="$1" date="$2" content="$3" now tmp
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  tmp="$(mktemp)"
  {
    printf "DELETE FROM %s WHERE date='%s';\n" "$table" "$date"
    printf "INSERT INTO %s (date, content, generated_at) VALUES ('%s','%s','%s');\n" \
      "$table" "$date" "$(sql_escape "$content")" "$now"
  } > "$tmp"
  d1_file "$tmp"
  rm -f "$tmp"
}

# build_context <outfile>
# Dumps the curriculum (4 tracks + live positions + skill coverage) and the
# recent study log so every prompt is grounded. Curriculum is the single source
# of truth at public/curriculum.json; coverage comes from D1 skill_coverage.
build_context() {
  local out="$1" cov
  cov="$(d1_json "SELECT track,skill,status FROM skill_coverage;" 2>/dev/null || echo '[]')"
  {
    echo "=== STUDENT, ROLES & CURRICULUM (public/curriculum.json) ==="
    COVERAGE_JSON="$cov" node "$LIB_DIR/render-context.cjs" \
      "$PROJECT/public/curriculum.json" "$PROJECT/config/status.json" 2>/dev/null \
      || echo "(curriculum context unavailable)"
    echo
    echo "=== RECENT STUDY LOG (most recent 25; track in brackets) ==="
    d1_json "SELECT date,hours,topic,track,notes FROM study_log ORDER BY id DESC LIMIT 25;" 2>/dev/null \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s),r=(j[0]&&j[0].results)||[];if(!r.length){console.log("(none yet)");return;}for(const x of r)console.log(`${x.date}: ${x.hours}h [${x.track||"unassigned"}] — ${x.topic}${x.notes?" | "+x.notes:""}`);}catch(e){console.log("(log unavailable)");}})'
  } > "$out"
}
