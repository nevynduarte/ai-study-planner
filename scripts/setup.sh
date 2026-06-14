#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# One-time setup on P620
# Run once after git clone/pull: bash scripts/setup.sh
# ─────────────────────────────────────────────────────────────
set -e

PROJECT="$HOME/projects/ai-study-planner"
echo "Setting up AI Study Planner on P620..."

# 1. Install mailutils if not present (for email-to-SMS)
if ! command -v mail &>/dev/null; then
  echo "Installing mailutils..."
  sudo apt-get install -y mailutils
else
  echo "mailutils already installed ✓"
fi

# 2. Install wrangler (Cloudflare CLI — writes results to D1)
if ! command -v wrangler &>/dev/null; then
  echo "Installing wrangler..."
  npm install -g wrangler
else
  echo "wrangler already installed ✓"
fi

# 3. Make scripts executable
chmod +x "$PROJECT/scripts/"*.sh
echo "Scripts executable ✓"

# 4. Check Claude Code is available (Claude Max — no API key needed)
if ! command -v claude &>/dev/null; then
  echo "ERROR: Claude Code not found. Install with: npm install -g @anthropic-ai/claude-code"
  exit 1
else
  echo "Claude Code found ✓"
fi

# 5. Install/refresh cron jobs (idempotent — removes our old lines first).
#    Times use EST (UTC-5); for EDT (summer) subtract 1 hour from each UTC value.
CRON_TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "ai-study-planner/scripts/" > "$CRON_TMP" || true
cat >> "$CRON_TMP" <<EOF
0 11 * * * $PROJECT/scripts/daily-briefing.sh    # 6am ET  — briefing + plan + frontier
0 * * * *  $PROJECT/scripts/answer-questions.sh  # hourly  — answer tutor questions
0 4 * * *  $PROJECT/scripts/advisory.sh          # 11pm ET — plan health advisory
EOF
crontab "$CRON_TMP"
rm -f "$CRON_TMP"
echo "Cron jobs installed ✓"

# 6. Sync current status.json into D1
echo "Syncing status.json → D1..."
bash "$PROJECT/scripts/sync-to-d1.sh" || echo "  (skipped — create the D1 database first, see below)"

# 7. Send a test text
echo "Test email from AI Study Planner setup" | mail -s "Setup Test" 9176500432@tmomail.net
echo "Test text sent to your T-Mobile number ✓"

echo ""
echo "─────────────────────────────────────────────"
echo "ONE-TIME Cloudflare D1 setup (if not done yet):"
echo "  wrangler login"
echo "  wrangler d1 create ai-study-planner      # paste the database_id into wrangler.toml"
echo "  wrangler d1 execute ai-study-planner --remote --file=$PROJECT/schema.sql"
echo "─────────────────────────────────────────────"
echo ""
echo "Setup complete."
echo "  6am ET  → briefing + plan + frontier"
echo "  hourly  → tutor answers"
echo "  11pm ET → advisory"
echo ""
echo "Update your month:   nano $PROJECT/config/status.json && bash $PROJECT/scripts/sync-to-d1.sh"
echo "Test the briefing:   bash $PROJECT/scripts/daily-briefing.sh"
echo "Check logs:          tail -f $PROJECT/logs/briefing.log"
