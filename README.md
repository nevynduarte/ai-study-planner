# AI Study Planner — nevynduarte

Elite AI engineering study planner with Claude-powered tutoring, frontier paper search, and daily 6am SMS briefings.

## Stack

| Layer | Service | Cost |
|-------|---------|------|
| Frontend hosting | Cloudflare Pages | Free |
| Serverless API proxy | Cloudflare Pages Functions | Free (100K req/day) |
| **Auth (login gate)** | **Cloudflare Access** | **Free for 1 user** |
| Daily cron + SMS | GitHub Actions + Twilio | ~$0 (trial covers ~300 texts) |
| AI | Anthropic API | Pay-as-you-go |

## Features

- **6 tabs**: Today (plan + log), Tutor (chat), Frontier (live paper search), Advisory (health check), Log, Roadmap
- **Secure**: API key lives only in Cloudflare env vars — never in the browser
- **Login-gated**: Cloudflare Access requires Google/GitHub login before the app loads
- **Daily SMS**: GitHub Actions cron sends a Claude-generated briefing at 6am ET

## Setup

### 1. Create GitHub repo and push

```bash
cd ai-study-planner
git init
git add .
git commit -m "Initial commit"
# Create repo at github.com/nevynduarte/ai-study-planner (PUBLIC for free Actions minutes)
git remote add origin https://github.com/nevynduarte/ai-study-planner.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Cloudflare Pages

1. [pages.cloudflare.com](https://pages.cloudflare.com) → Create project → Connect to Git → select `ai-study-planner`
2. Build settings:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
3. **Environment variables** (Settings → Environment variables):
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```
4. Save and Deploy → your app is live at `https://ai-study-planner-XXX.pages.dev`

### 3. Add login gate with Cloudflare Access (FREE)

1. In Cloudflare dashboard → **Zero Trust** → **Access** → **Applications**
2. Add application → **Self-hosted**
3. Application name: `AI Study Planner`
4. Application domain: `ai-study-planner-XXX.pages.dev` (your Pages URL)
5. Under **Policies** → Add policy:
   - Action: Allow
   - Include: **Emails** → `nevynjduarte@gmail.com`
6. Identity providers → add **Google** (free, 2 min setup)
7. Save

Now anyone hitting your URL gets a Google login prompt. Only your email can proceed.

**Optional custom domain**: Add `planner.nevyn.tech` in Cloudflare Pages → Custom domains (must have domain on Cloudflare DNS).

### 4. Set up daily 6am SMS

#### Get Twilio credentials
1. [twilio.com](https://twilio.com) → sign up (no card, 100 free SMS)
2. Verify YOUR phone number in Twilio Console
3. Get a free Twilio number (your FROM number)
4. Copy Account SID and Auth Token from Console dashboard

#### Add GitHub Secrets
Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `TWILIO_ACCOUNT_SID` | `ACxxxxx...` |
| `TWILIO_AUTH_TOKEN` | your auth token |
| `TWILIO_FROM_NUMBER` | `+15551234567` (Twilio number) |
| `TO_PHONE_NUMBER` | `+19085551234` (your real number) |
| `CURRENT_MONTH` | `1` (update as you advance) |

#### Test immediately
Actions tab → "Daily AI Study Briefing" → Run workflow → check your phone in ~30s.

### 5. Advancing months

Update the `CURRENT_MONTH` secret in GitHub when you complete a month. No code change needed.

### 6. Prevent GitHub Actions auto-disable

GitHub disables scheduled workflows after 60 days of repo inactivity. Just push a commit (update CURRENT_MONTH in README, etc.) every 60 days to keep it active.

## Project structure

```
ai-study-planner/
├── src/
│   ├── main.jsx              # React entry point
│   └── App.jsx               # Full 6-tab planner app
├── functions/
│   └── api.js                # Cloudflare Pages Function (secure API proxy)
├── scripts/
│   └── daily-briefing.js     # 6am SMS generator
├── .github/
│   └── workflows/
│       └── daily-briefing.yml
├── index.html
├── vite.config.js
├── package.json
└── wrangler.toml
```

## Security model

```
Browser → Cloudflare Access (Google login) → Cloudflare Pages
                                                    ↓
                                          /api/* Pages Function
                                                    ↓
                                          Anthropic API (key never leaves CF)
```

The `ANTHROPIC_API_KEY` is only accessible to the Cloudflare Pages Function, not the browser bundle.
