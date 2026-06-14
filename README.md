# AI Study Planner — nevynduarte

Elite AI engineering study planner. Claude-powered tutoring, frontier paper search, daily 6am SMS briefings.

**Total annual cost: $0** — all Claude intelligence runs locally on P620 (Claude Max, no API key). Results are written to Cloudflare D1; the web app just reads them.

## Architecture

```
P620 (Claude Max, local)  → all intelligence: briefing, plan, frontier, advisory, tutor answers
        │                    runs claude -p (no Anthropic API key needed)
        ├── writes ────────→ Cloudflare D1 (daily_plan, frontier, advisory, status, tutor_qa)
        └── 6am email ─────→ T-Mobile email-to-SMS (9176500432@tmomail.net)

Cloudflare Worker         → serves the React app (static [assets]) + the D1 API
        /api/data (read), /api/log + /api/ask (the only writes from the browser)
Cloudflare Access         → Google login gate, only nevynjduarte@gmail.com (free)
```

The web app is read-mostly: it displays what P620 produced. The only writes from the
browser are **logging a study session** and **submitting a tutor question**; P620 answers
questions on its next hourly run and writes the answer back to D1.

## One-time Cloudflare D1 setup

```bash
wrangler login
wrangler d1 create ai-study-planner          # paste the printed database_id into wrangler.toml
wrangler d1 execute ai-study-planner --remote --file=schema.sql
```

The `DB` binding is declared in `wrangler.toml`, so it's applied automatically on deploy —
no dashboard binding step needed.

## First time on P620

```bash
cd ~/projects
git clone https://github.com/nevynduarte/ai-study-planner.git
cd ai-study-planner
bash scripts/setup.sh
```

Setup installs `mailutils` + `wrangler`, makes the scripts executable, installs the cron
jobs, syncs `status.json` to D1, and sends a test text.

## Cron schedule (installed by setup.sh)

| When (ET) | Script | Writes |
|-----------|--------|--------|
| 6am daily | `daily-briefing.sh` | SMS briefing + `daily_plan` + `frontier` |
| every hour | `answer-questions.sh` | tutor answers in `tutor_qa` |
| 11pm daily | `advisory.sh` | `advisory` |

## Daily workflow

- **6am**: text arrives with today's focus, frontier paper, and don't-skip item; the full
  10-hour plan and frontier digest land in the web app automatically
- **During the day**: open the web app — the plan is already there. Log sessions on the Today tab.
- **Tutor tab**: type a question; it's answered on the next hourly cron run
- **Advisory tab**: read the nightly plan-health check

## Advancing months

```bash
nano config/status.json          # set current_month + month_title
bash scripts/sync-to-d1.sh       # push it to D1 (or just rerun setup.sh)
git add config/status.json && git commit -m "Month N" && git push
```

## Web app deploy (Cloudflare Worker + static assets)

Deployed as a Worker via Workers Builds (connected to this Git repo):
- Build command:  `npm run build`  (outputs to `dist/`)
- Deploy command: `npx wrangler deploy`

`wrangler.toml` defines everything — the Worker entry (`worker/index.js`), the static
`[assets]` (`dist`), and the `DB` D1 binding — so the deploy is self-contained. No
`ANTHROPIC_API_KEY` needed (the frontend never calls Claude).

Validate locally before pushing: `npm run build && npx wrangler deploy --dry-run`.

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
│   └── App.jsx                  # 6-tab planner — reads D1, logs sessions, asks tutor
├── worker/
│   └── index.js                 # Worker: serves the app + /api/data, /api/log, /api/ask
├── scripts/
│   ├── lib.sh                   # shared config + D1 helpers
│   ├── setup.sh                 # one-time P620 setup (deps, cron, D1 sync)
│   ├── daily-briefing.sh        # 6am — SMS + plan + frontier → D1
│   ├── answer-questions.sh      # hourly — answer tutor questions → D1
│   ├── advisory.sh              # 11pm — plan-health advisory → D1
│   ├── sync-to-d1.sh            # push config/status.json → D1 status table
│   └── *-prompt.txt             # prompts for briefing/plan/frontier/advisory/tutor
├── config/status.json           # current month, hours, notes
├── logs/                        # auto-created, gitignored
├── schema.sql                   # D1 schema
├── index.html / vite.config.js / package.json / wrangler.toml
```

## Testing on P620

```bash
bash scripts/daily-briefing.sh     # briefing + plan + frontier now
bash scripts/answer-questions.sh   # answer any pending tutor questions
bash scripts/advisory.sh           # generate an advisory now
tail -f logs/briefing.log          # watch logs
crontab -l                         # verify cron
```
