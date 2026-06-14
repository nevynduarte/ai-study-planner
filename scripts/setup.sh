#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# One-time setup on P620
# Run once after git clone/pull: bash scripts/setup.sh
# ─────────────────────────────────────────────────────────────
set -e

PROJECT="$HOME/projects/ai-study-planner"
echo "Setting up AI Study Planner on P620..."

# 1. Install mailutils if not present
if ! command -v mail &>/dev/null; then
  echo "Installing mailutils..."
  sudo apt-get install -y mailutils
else
  echo "mailutils already installed ✓"
fi

# 2. Make scripts executable
chmod +x "$PROJECT/scripts/daily-briefing.sh"
echo "Scripts executable ✓"

# 3. Add cron job (11:00 UTC = 6:00am ET)
CRON_LINE="0 11 * * * $PROJECT/scripts/daily-briefing.sh"
# Only add if not already present
if crontab -l 2>/dev/null | grep -q "daily-briefing.sh"; then
  echo "Cron job already exists ✓"
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Cron job added ✓"
fi

# 4. Test Claude Code is available
if ! command -v claude &>/dev/null; then
  echo "ERROR: Claude Code not found. Install with: npm install -g @anthropic/claude-code"
  exit 1
else
  echo "Claude Code found ✓"
fi

# 5. Test mail is configured
echo "Test email from AI Study Planner setup" | mail -s "Setup Test" 9176500432@tmomail.net
echo "Test text sent to your T-Mobile number ✓"

echo ""
echo "Setup complete. Briefings will arrive at 6am ET daily."
echo ""
echo "To update your current month:"
echo "  nano $PROJECT/config/status.json"
echo ""
echo "To test the briefing right now:"
echo "  bash $PROJECT/scripts/daily-briefing.sh"
echo ""
echo "To check logs:"
echo "  tail -f $PROJECT/logs/briefing.log"
