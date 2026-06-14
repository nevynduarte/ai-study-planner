#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# AI Study Planner — one-shot GitHub + Cloudflare + SMS setup
# Run this from inside the ai-study-planner/ folder
# Requires: git, gh (GitHub CLI), node 18+
# ─────────────────────────────────────────────────────────────
set -e

echo ""
echo "=== Step 1: Create GitHub repo ==="
# gh CLI handles auth — will prompt if not logged in
gh repo create ai-study-planner \
  --public \
  --description "Elite AI Engineering Study Planner — Claude-powered tutoring + daily SMS briefings" \
  --source=. \
  --remote=origin \
  --push

echo ""
echo "=== Step 2: Add GitHub Secrets ==="
echo "You'll be prompted for each value."
echo ""

read -p "ANTHROPIC_API_KEY (sk-ant-...): " ANTHROPIC_KEY
gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_KEY"

read -p "TWILIO_ACCOUNT_SID (ACxxxxx): " TWILIO_SID
gh secret set TWILIO_ACCOUNT_SID --body "$TWILIO_SID"

read -p "TWILIO_AUTH_TOKEN: " TWILIO_TOKEN
gh secret set TWILIO_AUTH_TOKEN --body "$TWILIO_TOKEN"

read -p "TWILIO_FROM_NUMBER (+1...): " FROM_NUM
gh secret set TWILIO_FROM_NUMBER --body "$FROM_NUM"

read -p "TO_PHONE_NUMBER (your cell, +1...): " TO_NUM
gh secret set TO_PHONE_NUMBER --body "$TO_NUM"

read -p "CURRENT_MONTH (1-12, which month are you on?): " CUR_MONTH
gh secret set CURRENT_MONTH --body "$CUR_MONTH"

echo ""
echo "=== Step 3: Test the SMS workflow now ==="
gh workflow run "Daily AI Study Briefing"
echo "SMS workflow triggered — check your phone in ~30 seconds."

echo ""
echo "=== Done! ==="
REPO_URL=$(gh repo view --json url -q .url)
echo ""
echo "Your repo: $REPO_URL"
echo ""
echo "Next steps (manual, ~5 min each):"
echo ""
echo "1. CLOUDFLARE PAGES DEPLOY:"
echo "   → pages.cloudflare.com → Create project → Connect to Git"
echo "   → Select ai-study-planner → Framework: Vite → Build: npm run build → Output: dist"
echo "   → Environment variables → Add: ANTHROPIC_API_KEY = sk-ant-..."
echo "   → Save and Deploy"
echo ""
echo "2. CLOUDFLARE ACCESS (LOGIN GATE):"
echo "   → dash.cloudflare.com → Zero Trust → Access → Applications"
echo "   → Add application → Self-hosted"
echo "   → Domain: your-pages-url.pages.dev"
echo "   → Policy: Allow → Emails → nevynjduarte@gmail.com"
echo "   → Identity provider: Google (2 min setup)"
echo "   → Save"
echo ""
echo "That's it. Your planner is live, login-gated, and texting you at 6am ET."
