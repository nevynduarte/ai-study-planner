# AI Study Planner — nevynduarte

A personal preparation planner targeting **AI engineering interviews in November 2026**, with MLE and selected data/quant roles as adjacent paths. Build one defensible AI flagship, practice fundamentals and interviews alongside it, and add a compact ML lifecycle project when capacity permits.

Start with [the November readiness plan](crash-course/NOVEMBER_READINESS.md), including the job-tracker audit, project scope, capacity options and interview checks. The current **10 hours/week is provisional**, not a promise to finish four platforms.

## Curriculum model

`public/curriculum.json` supplies the profile, learning tracks and coaching context. `crash-course/november-plan.json` supplies the milestone plan shown in the Plan and Projects tabs; `npm run portfolio` validates and generates `public/portfolio.json`. The detailed guide is `crash-course/NOVEMBER_READINESS.md`. Historical plans are retained under `archive` and in the archived portfolio document.

The former daily sprint's completion records are preserved, but do not mark the new milestones complete. November is a readiness target; projects and selective applications can happen before then.

Live state lives separately so the curriculum file stays static:
- `config/status.json` — per-track current month, hours, notes.
- D1 `skill_coverage` — each skill's status (`not-started` → `learning` → `built` → `interview-ready`), advanced nightly by the advisory from your study log.

## Architecture

```
P620 (Claude Max, local)  → all intelligence: briefing, plan, frontier, advisory, tutor answers
        │                    runs claude -p (no Anthropic API key needed)
        │                    grounded by public/curriculum.json + status + skill_coverage
        ├── writes ────────→ Cloudflare D1 (daily_plan, frontier, advisory, status, tutor_qa, skill_coverage, study_log.track)
        └── 6am push ──────→ ntfy push notification (SMS fallback)

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

## First time on the P620

### Windows (Git Bash + Task Scheduler)

The P620 runs Windows. Scheduling is done with Task Scheduler, and the 6am text is
sent via SMTP (Linux `mail` doesn't exist on Windows).

```bash
# 1. configure SMTP for the briefing text (gitignored, never committed)
cp config/smtp.example.json config/smtp.local.json
#    then edit config/smtp.local.json with your SMTP host/user/app-password

# 2. register the scheduled tasks
powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
```

The tasks run via `conhost --headless` with the working directory set to the project
(required so Node/wrangler get a console and a writable cache under Task Scheduler).
They run only while you're logged on (a locked session counts).

### Linux (cron) — recommended for an always-on box

Use this for any always-on Linux machine (a spare/work laptop now, a Google Cloud
or Oracle Always-Free VM later) so your main computer doesn't have to stay on.

```bash
cd ~/projects && git clone https://github.com/nevynduarte/ai-study-planner.git
cd ai-study-planner
npm install -g @anthropic-ai/claude-code wrangler   # if not already present
claude login                                         # Claude Max (device-code flow; no API key)
export CLOUDFLARE_API_TOKEN=...                       # D1:Edit token; add to ~/.profile so cron sees it
cp config/notify.example.json config/notify.local.json && nano config/notify.local.json  # set ntfy_topic
bash scripts/setup-linux.sh                           # installs an ET-correct cron + sends a test push
```

`setup-linux.sh` pins the schedule to Eastern via `CRON_TZ` (DST-safe) and writes a
`PATH` line so cron can find node/claude/wrangler. To make this box the *only* runner,
disable the P620's tasks (PowerShell on the P620):
`Disable-ScheduledTask -TaskName AIStudyPlanner-Briefing,AIStudyPlanner-Tutor,AIStudyPlanner-Advisory`.

The older `scripts/setup.sh` targets the original email-to-SMS path and a fixed-offset
cron; prefer `setup-linux.sh`.

## Schedule

| When (ET) | Script | Writes |
|-----------|--------|--------|
| 4:30am daily | `scan-jobs.sh` | scored job leads → `job_postings` |
| 6am daily | `daily-briefing.sh` | push briefing + track-weighted `daily_plan` + per-track `frontier` |
| every hour | `answer-questions.sh` | tutor answers in `tutor_qa` |
| 11pm daily | `advisory.sh` | `advisory` + `skill_coverage` updates |

All are grounded by `build_context()` (in `lib.sh`), which injects the curriculum, per-track positions, skill coverage, and the recent study log into every prompt.

## Daily workflow

- **6am**: text arrives with today's focus, frontier paper, and don't-skip item; the full
  3-hour plan and frontier digest land in the web app automatically
- **During the day**: open the web app — the plan is already there. Log sessions on the Today tab, tagging each with its track so the weekly balance and coverage stay accurate.
- **Coverage tab**: see the skill heatmap per track — your map of ground covered vs. remaining.
- **Tutor tab**: type a question; it's answered on the next hourly cron run
- **Advisory tab**: read the nightly plan-health check (also advances the coverage matrix)

## Advancing months

Each track advances independently. Bump the track(s) you've completed in `config/status.json`:

```bash
nano config/status.json          # set tracks.<id>.current_month per track
bash scripts/sync-to-d1.sh       # push status → D1 + seed any new skills into skill_coverage
git add config/status.json && git commit -m "Advance tracks" && git push
```

`sync-to-d1.sh` is idempotent: it seeds any curriculum skills not yet in `skill_coverage` as
`not-started` without overwriting progress already recorded.

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
├── public/
│   └── curriculum.json          # SINGLE SOURCE OF TRUTH — roles, 4 tracks, skills (served at /curriculum.json)
├── src/
│   ├── main.jsx                 # React entry
│   └── App.jsx                  # 7-tab planner — per-track progress, coverage heatmap, log, tutor
├── worker/
│   └── index.js                 # Worker: serves the app + /api/data, /api/log, /api/ask
├── scripts/
│   ├── lib.sh                   # shared config + D1 helpers + build_context()
│   ├── render-context.cjs       # renders curriculum + status + coverage into prompt context
│   ├── setup.sh                 # one-time P620 setup (deps, cron, D1 sync)
│   ├── daily-briefing.sh        # 6am — push + plan + frontier → D1
│   ├── answer-questions.sh      # hourly — answer tutor questions → D1
│   ├── advisory.sh              # 11pm — plan-health advisory + coverage updates → D1
│   ├── sync-to-d1.sh            # push status.json → D1 + seed skill_coverage
│   └── *-prompt.txt             # track-aware prompts for briefing/plan/frontier/advisory/tutor
├── config/status.json           # per-track current month, hours, notes
├── logs/                        # auto-created, gitignored
├── schema.sql                   # D1 schema (incl. study_log.track + skill_coverage)
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
