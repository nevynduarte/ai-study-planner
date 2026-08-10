#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# One-shot setup for the always-on ThinkPad L15 (Linux) as the
# job-market scan runner.
#
#   1. Ensures Tailscale and Chrome Remote Desktop start on boot
#      (systemd enable — reboot-proof, idempotent).
#   2. Installs the job-market scan deps (python-jobspy, wrangler),
#      applies the D1 migration, registers the Sunday 9pm cron, and
#      runs one scan now to verify end-to-end D1 connectivity.
#
# This laptop ONLY runs the weekly job-market scan — the P620 keeps
# the briefing/tutor/advisory schedule, so nothing double-runs.
#
#   bash scripts/setup-thinkpad.sh
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="$(cd "$DIR/.." && pwd)"

ok()   { printf "\033[32m✓ %s\033[0m\n" "$1"; }
warn() { printf "\033[33m! %s\033[0m\n" "$1"; }
fail() { printf "\033[31m✗ %s\033[0m\n" "$1"; exit 1; }

# ── 1a. Tailscale on boot ────────────────────────────────────
if command -v tailscale >/dev/null 2>&1; then
  sudo systemctl enable --now tailscaled >/dev/null 2>&1 || true
  if systemctl is-enabled tailscaled >/dev/null 2>&1; then
    ok "tailscaled enabled on boot ($(tailscale status --peers=false 2>/dev/null | head -1 || echo 'status unavailable'))"
  else
    warn "could not enable tailscaled — run: sudo systemctl enable --now tailscaled"
  fi
  # tailscale up persists across reboots once authenticated; just confirm.
  tailscale status >/dev/null 2>&1 || warn "tailscale not connected — run: sudo tailscale up"
else
  warn "tailscale not installed — https://tailscale.com/download/linux"
fi

# ── 1b. Chrome Remote Desktop on boot ────────────────────────
if [ -d /opt/google/chrome-remote-desktop ] || command -v chrome-remote-desktop >/dev/null 2>&1; then
  # CRD's host service is per-user; enabling the unit makes it start at boot
  # (host must already be registered via remotedesktop.google.com/access).
  sudo systemctl enable --now "chrome-remote-desktop@$USER" >/dev/null 2>&1 \
    || sudo systemctl enable --now chrome-remote-desktop >/dev/null 2>&1 || true
  if systemctl is-enabled "chrome-remote-desktop@$USER" >/dev/null 2>&1 \
     || systemctl is-enabled chrome-remote-desktop >/dev/null 2>&1; then
    ok "chrome-remote-desktop enabled on boot"
  else
    warn "could not enable CRD service — check: systemctl status chrome-remote-desktop@$USER"
  fi
else
  warn "chrome remote desktop not installed — https://remotedesktop.google.com/access (Set up via SSH / Debian package)"
fi

# Don't sleep when the lid closes / on idle — an always-on box must stay up.
if [ -f /etc/systemd/logind.conf ]; then
  if ! grep -q "^HandleLidSwitch=ignore" /etc/systemd/logind.conf 2>/dev/null; then
    sudo sed -i 's/^#\?HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
    sudo sed -i 's/^#\?HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
    sudo systemctl restart systemd-logind || true
  fi
  ok "lid close ignored (stays awake)"
fi

# ── 2a. Dependencies ─────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || fail "python3 missing — sudo apt install python3 python3-pip"
python3 -c "import jobspy" 2>/dev/null \
  || pip3 install --user --break-system-packages "python-jobspy>=1.1.82" 2>/dev/null \
  || pip3 install --user "python-jobspy>=1.1.82" \
  || fail "pip install python-jobspy failed"
ok "python-jobspy installed"

if ! command -v wrangler >/dev/null 2>&1; then
  command -v npm >/dev/null 2>&1 || fail "npm missing — sudo apt install nodejs npm (or use nvm)"
  npm install -g wrangler || fail "npm install -g wrangler failed"
fi
ok "wrangler installed"

# ── 2b. Cloudflare auth ──────────────────────────────────────
if wrangler whoami >/dev/null 2>&1; then
  ok "wrangler authenticated to Cloudflare"
else
  warn "wrangler not authenticated — opening login (or set CLOUDFLARE_API_TOKEN with D1:Edit)"
  wrangler login || fail "wrangler auth failed"
fi

# ── 2c. D1 migration (idempotent) ────────────────────────────
(cd "$PROJECT" && wrangler d1 execute ai-study-planner --remote --file=migrations/004_job_market.sql) \
  && ok "D1 job_market table ready" \
  || fail "D1 migration failed — check wrangler auth / database_id in wrangler.toml"

# ── 2d. Cron: Sunday 9pm ET, job-market scan only ────────────
CRON_TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "scripts/job-market.sh" > "$CRON_TMP" || true
cat >> "$CRON_TMP" <<EOF
CRON_TZ=America/New_York
0 21 * * 0 $PROJECT/scripts/job-market.sh   # Sun 9pm ET — job-market skill demand -> D1
EOF
crontab "$CRON_TMP"; rm -f "$CRON_TMP"
ok "cron registered: Sun 9pm ET job-market scan"

# ── 2e. Verify end-to-end with a live run ────────────────────
echo "Running a live scan now (takes a few minutes)…"
bash "$PROJECT/scripts/job-market.sh"
LATEST="$(cd "$PROJECT" && wrangler d1 execute ai-study-planner --remote --json \
  --command "SELECT date FROM job_market ORDER BY id DESC LIMIT 1" 2>/dev/null \
  | python3 -c "import sys,json;r=json.load(sys.stdin);print(r[0]['results'][0]['date'] if r and r[0]['results'] else '')" 2>/dev/null)"
if [ -n "$LATEST" ]; then
  ok "end-to-end verified — report for $LATEST is in Cloudflare D1"
else
  warn "scan ran but no row found in D1 — check logs/job-market.log"
fi

echo
echo "Done. This laptop now: keeps Tailscale + CRD up across reboots,"
echo "and pushes a weekly job-market report to D1 every Sunday 9pm ET."
