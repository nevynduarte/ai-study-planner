#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# One-time setup on an always-on Linux box (e.g. a work laptop, or
# later a Google Cloud / Oracle Always-Free VM).
#
# Installs the CLIs, wires up an ET-correct cron schedule, and sends a
# test push. All Claude intelligence runs via your Claude Max login
# (`claude -p`, no API key) and results are written to the remote D1
# the web app reads. Runs the ntfy push path (not the legacy email-to-SMS).
#
# Run once after `git clone`/`git pull`:
#     bash scripts/setup-linux.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="$(cd "$DIR/.." && pwd)"          # repo root — not hardcoded
TZ_ET="America/New_York"                  # cron runs in ET regardless of system tz (DST-safe)

say()  { printf '  %s\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }

echo "Setting up AI Study Planner on $(hostname) ($PROJECT)..."

# 1. Prerequisites: node + npm (everything else installs through npm).
command -v node >/dev/null || { echo "ERROR: Node.js 18+ not found. Install Node first (nvm or your distro's package), then re-run."; exit 1; }
command -v npm  >/dev/null || { echo "ERROR: npm not found alongside Node."; exit 1; }
ok "Node $(node -v)"

# 2. Claude Code CLI (Claude Max — no API key).
if ! command -v claude >/dev/null; then
  say "Installing @anthropic-ai/claude-code..."
  npm install -g @anthropic-ai/claude-code
fi
ok "claude $(command -v claude)"

# 3. wrangler (writes results to D1).
if ! command -v wrangler >/dev/null; then
  say "Installing wrangler..."
  npm install -g wrangler
fi
ok "wrangler $(command -v wrangler)"

# 4. Make the scripts executable.
chmod +x "$PROJECT/scripts/"*.sh
ok "scripts executable"

# 5. ntfy config (gitignored, so it doesn't arrive via git — create it here).
NOTIFY="$PROJECT/config/notify.local.json"
if [ ! -f "$NOTIFY" ]; then
  cp "$PROJECT/config/notify.example.json" "$NOTIFY"
  warn "Created $NOTIFY from the example — edit ntfy_topic to match your phone's subscription before this works."
else
  ok "ntfy config present"
fi

# 6. Auth checks (non-fatal — they just tell you what's still needed).
if timeout 60 claude -p "reply with exactly: ok" >/dev/null 2>&1; then
  ok "Claude Max authenticated"
else
  warn "Claude not authenticated yet. Run:  claude login   (device-code flow — open the printed URL on any browser)"
fi
if wrangler whoami >/dev/null 2>&1; then
  ok "wrangler authenticated"
else
  warn "wrangler not authenticated. Either run 'wrangler login', or (better for a headless box) export a scoped token:"
  warn "  export CLOUDFLARE_API_TOKEN=...   (D1:Edit on the ai-study-planner database) — add it to ~/.profile so cron sees it"
fi

# 7. Install/refresh cron (idempotent — strips our previous lines first).
#    CRON_TZ pins the schedule to Eastern so 6am/11pm are correct year-round.
#    A PATH line is written from the live tool locations so cron (minimal env,
#    no nvm) can still find node/claude/wrangler.
TOOLBIN="$(dirname "$(command -v node)"):$(dirname "$(command -v claude)"):$(dirname "$(command -v wrangler)")"
CRON_TMP="$(mktemp)"
crontab -l 2>/dev/null \
  | grep -v "ai-study-planner/scripts/" \
  | grep -vE '^(CRON_TZ|PATH|MAILTO)=' > "$CRON_TMP" || true
cat >> "$CRON_TMP" <<EOF
CRON_TZ=$TZ_ET
PATH=$TOOLBIN:/usr/local/bin:/usr/bin:/bin
MAILTO=""
0 6 * * *  $PROJECT/scripts/daily-briefing.sh    # 6am ET  — briefing + plan + frontier
0 * * * *  $PROJECT/scripts/answer-questions.sh  # hourly  — answer tutor questions
0 23 * * * $PROJECT/scripts/advisory.sh          # 11pm ET — plan health advisory
EOF
crontab "$CRON_TMP"
rm -f "$CRON_TMP"
ok "cron installed (CRON_TZ=$TZ_ET): 6am briefing · hourly tutor · 11pm advisory"

# 8. Seed D1 from current status.json (non-fatal if D1 isn't reachable yet).
say "Syncing status.json → D1..."
bash "$PROJECT/scripts/sync-to-d1.sh" && ok "status synced to D1" || warn "sync skipped — check wrangler auth / D1 setup"

# 9. Test push via ntfy.
# shellcheck source=/dev/null
source "$DIR/lib.sh"
if send_push "AI Study Planner — setup OK" "This box ($(hostname)) is now the scheduled runner. 6am briefing · hourly tutor · 11pm advisory." "$APP_URL"; then
  ok "test push sent — check your phone"
else
  warn "test push failed — verify config/notify.local.json (ntfy_topic)"
fi

echo
echo "─────────────────────────────────────────────"
echo "Done. This box now runs the schedule (Eastern):"
echo "  6am  → briefing + plan + frontier"
echo "  hourly → tutor answers"
echo "  11pm → advisory"
echo
echo "Verify:        crontab -l"
echo "Test a run:    bash $PROJECT/scripts/daily-briefing.sh"
echo "Watch logs:    tail -f $PROJECT/logs/briefing.log"
echo
echo "REPLACE the P620: on the P620 (Windows PowerShell) disable its tasks so they don't double-run:"
echo "  Disable-ScheduledTask -TaskName AIStudyPlanner-Briefing,AIStudyPlanner-Tutor,AIStudyPlanner-Advisory"
echo "─────────────────────────────────────────────"
