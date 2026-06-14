# AI Study Planner — nevynduarte

Elite AI engineering study planner. Claude-powered tutoring, frontier paper search, daily 6am SMS briefings.

**Total annual cost: $0** — runs on Claude Max + P620 + T-Mobile email-to-SMS.

## Architecture

```
Cloudflare Pages          → hosts the React web app (free)
Cloudflare Access         → Google login gate, only nevynjduarte@gmail.com (free)
Cloudflare Pages Function → secure API proxy, ANTHROPIC_API_KEY never in browser (free)
P620 cron (6am ET)        → claude -p "..." → email to 9176500432@tmomail.net (free)
```

## First time on P620

```bash
cd ~/projects
git clone https://github.com/nevynduarte/ai-study-planner.git
cd ai-study-planner
bash scripts/setup.sh
```

That's it. Setup installs mailutils, adds the cron job, and sends a test text.

## Daily workflow

- **6am**: text arrives on your phone with today's focus, frontier paper, and don't-skip item
- **Morning**: open the web app, hit "Generate plan" for a time-blocked 10-hour schedule
- **Evening**: log your session on the Today tab
- **Wednesday**: Frontier tab → fetch digest for latest papers
- **Every 2 weeks**: Advisory tab → run health check

## Advancing months

Edit `config/status.json`:
```json
{
  "current_month": 2,
  "month_title": "Classical ML — Theory to Production"
}
```
Then `git add config/status.json && git commit -m "Month 2" && git push`.
The P620 cron picks up the new month automatically next morning.

## Web app deploy (Cloudflare Pages)

1. pages.cloudflare.com → Create project → Connect to Git → `ai-study-planner`
2. Framework: Vite | Build: `npm run build` | Output: `dist`
3. Environment variable: `ANTHROPIC_API_KEY = sk-ant-...`
4. Deploy

### Add login gate (Cloudflare Access)
1. dash.cloudflare.com → Zero Trust → Access → Applications → Add
2. Self-hosted → domain: your `.pages.dev` URL
3. Policy: Allow → Emails → `nevynjduarte@gmail.com`
4. Identity: Google → Save

## Files

```
ai-study-planner/
├── src/
│   ├── main.jsx                 # React entry
│   └── App.jsx                  # 6-tab planner app
├── functions/
│   └── api.js                   # Cloudflare Pages Function (API proxy)
├── scripts/
│   ├── setup.sh                 # One-time P620 setup
│   ├── daily-briefing.sh        # Cron script — runs claude -p, sends text
│   └── briefing-prompt.txt      # Prompt Claude Code reads every morning
├── config/
│   └── status.json              # Current month, hours, notes — update this
├── logs/
│   └── briefing.log             # Auto-created, gitignored
├── index.html
├── vite.config.js
├── package.json
└── wrangler.toml
```

## Updating current month

When you complete a month, update `config/status.json` and push. The cron picks it up automatically — no other changes needed.

## Testing the briefing manually

```bash
bash ~/projects/ai-study-planner/scripts/daily-briefing.sh
```

## Checking cron logs

```bash
tail -f ~/projects/ai-study-planner/logs/briefing.log
```

## Verifying cron is set

```bash
crontab -l
```
