# v2 Migration — Elite curriculum → MLE search plan

Migrated 2026-08-06, on branch `claude/v2-mle-migration-rqf9p3`.

## What changed and why

The v1 plan (4 elite tracks, ~21h/week, $300–600K Head-of-AI target) assumed
full-time study capacity that doesn't exist alongside Bridges AI consulting.
v2 is built around what is actually true: **10 hours/week**, targeting an
**MLE role at $200–300K TC**, with applications **deliberately deferred to
2026-11-01** (the Nov–Jan hiring window) behind a **hard readiness gate on
2026-10-31**. The thesis: not under-skilled — under-legible and under-drilled.

### `public/curriculum.json`

- v1 content **moved to a top-level `archive` object** (`elite_tracks`,
  `crash_course`, `student_elite`) — parked, not deleted. Never edit or
  delete `archive`; it's the year-2 continuation.
- New `student` (10h/week commitment, $200–300K target, `thesis`,
  `dominant_risk`), `phases` (Build the Floor → Apply and Convert → Close →
  Land Well), `gate` (four criteria, each with an explicit `fail_response`),
  `not_doing`, and `failure_modes`.
- Four new tracks: `dsa` (5h/wk), `ml-recall` (2h), `sys-design` (2h),
  `search` (1h), each with 12 months of focus text and a `weekly_hours` field.
- `roles[].primary_tracks` and `research[].track` remapped
  (`ai-eng`/`ml-eng` → `sys-design`, `data-sci`/`quant` → `ml-recall`);
  added the `mle-general` primary target role. `roi_priority` removed.

### `migrations/002_v2_plan.sql`

- `applications` (stage state machine: applied → screen → onsite → offer →
  closed) + `v_funnel` view so stall diagnosis is a query, not a feeling.
- `artifacts` — separate completion semantics from study; `done_when` is
  explicit and `shipped` requires evidence.
- `gate_check` — seeded with the four criteria; `checked_at` makes "one more
  month" an explicit dated decision.
- Remaps historical `study_log.track` / `skill_coverage.track` rows (kept,
  not dropped); seeds three phase-1 artifacts; inserts `plan_version`,
  `applications_open_date`, `gate_date` status rows.

### `worker/index.js`

- `VALID_TRACKS` → new IDs. New endpoints: `POST`/`PATCH /api/application`
  (PATCH always bumps `last_touch`), `POST`/`PATCH /api/artifact` (**PATCH
  refuses `shipped` without an `evidence_url`**, checking the existing row),
  `PATCH /api/gate` (stamps `checked_at`). `GET /api/data` now also returns
  `applications`, `artifacts`, `gate`, `funnel` (empty defaults if the
  migration hasn't run). OPTIONS handler + CORS headers added.

### `scripts/`

- `render-context.cjs` now emits: today's date + computed month number +
  matching phase, whether applications are open (and that the delay is
  deliberate when not), the gate with a live day countdown and per-criterion
  fail responses, the not-doing list, the named failure modes, and the
  thesis/dominant-risk lines. Per-track lines show `weekly_hours`;
  `roi_priority` line dropped.
- `plan-prompt.txt` — 2-hour plans, DSA nearly every session with others
  rotating, phase discipline (no applications/networking/portfolio in
  Phase 1; artifact track opens Phase 4), never schedules `not_doing` items;
  Wrap = DO NOT SKIP / GATE MOVE / COVERAGE MOVE.
- `advisory-prompt.txt` — checks all three failure modes every run, reports
  per-criterion gate readiness with weeks remaining, refuses to praise
  not-doing hours while DSA lags, assesses the funnel in Phase 2+. Coverage
  block kept with new track IDs. Stale Aaru/Equi urgency block removed.
- `briefing-prompt.txt` — **hardcoded June-2026 Aaru/Equi urgency block
  deleted** (it had been firing for two months); replaced with generic
  `prep_window_days` logic that stays silent when nothing is upcoming.
  Output sections unchanged.
- `tutor-prompt.txt` — new tracks; checks `not_doing` before recommending
  more material and names the real bottleneck.
- `frontier-prompt.txt` — swept to the new tracks (was still naming the
  four elite tracks).
- `sync-to-d1.sh` — also syncs `plan_version`, `weekly_target_hours`,
  `applications_open_date`, `gate_date` to the D1 status table.

### App + config

- `src/App.jsx`: `DAILY_HOURS = 2`, `WEEKLY_TARGET = 10`. `crash_course`
  moved into `archive`, and the app reads `cur?.crash_course || null`, so
  the Sprint tab degrades to its "No crash course configured" empty state
  (verified in `wrangler dev`).
- `config/status.json`: new track IDs at month 1, `started_date`
  2026-08-06, `plan_version`, `weekly_target_hours`, dates.

## Deliberately NOT done

- **No Pipeline or Gate UI tabs.** The new tables are API-only. Gets built
  in October, right before applications open.
- No new dependencies; single-file React kept.

## Verification

- `render-context.cjs` output: Month 1, Phase 1, four gate criteria with an
  86-day countdown to 2026-10-31, four tracks summing to 10h/week. ✓
- `npm run build` passes. ✓
- Migration applied to **local** D1; gate rows, seeded artifacts, and
  `v_funnel` verified; all new endpoints exercised via `wrangler dev`
  (including the shipped-without-evidence refusal). ✓
- **Remote D1 migration and `wrangler deploy` still pending** — the
  migration environment has no Cloudflare credentials. Run:
  `wrangler d1 execute ai-study-planner --remote --file=migrations/002_v2_plan.sql`
  then `npm run build && wrangler deploy`.

## Stale things found but left alone

- `roles` still contains Aaru/Equi/D.E. Shaw/Woodline entries with June-2026
  interview notes, and `interviews` keeps the past Aaru/Equi dates — kept as
  history; the briefing logic now ignores past dates.
- `crash-course/` directory and its `schema.sql` are v1-era; untouched.
- `scripts/setup-*.ps1/.sh` and notify/smtp example configs unreviewed.

---

## Addendum — tandem tier-one lane (2026-08-07, migration 003)

### Why

v2 as first written optimized for the *broadest, easiest-to-land* target:
`search` M3 aimed 60% Series B–D applied-AI/infra, 20% mid-size, 10% quant
engineering, 10% hyperscaler — and **0% frontier labs**. That is a strong
low-variance bet for landing *a* $200–300K MLE seat fast, but the longer-term
$500K thesis rests on the tiers this list under-weights: frontier-lab
FDE/applied and top quant. The two goals only conflict if the first job isn't
on a ladder that reaches $500K — and a tier-blind funnel can't tell you which
it is.

The resolution is **tandem, not either/or**, and it is nearly free because the
expensive part of the plan — Phase 1's floor (DSA, ML recall, sys-design,
positioning) — is *identical* regardless of target tier. Fanning applications
across tiers costs clicks, not study hours. What it does NOT support is two
deep specializations or two narratives; the 10h/week buys one spike. So:

- **Floor:** the existing Series B–D lane — protects time-to-first-offer.
- **Upside (in tandem):** a frontier-lab + quant-eng lane, applied
  opportunistically at lower volume.
- **One spike, shared by both lanes:** the alt-data × production-AI writeup —
  the rarest, highest-leverage differentiator, and the one thing worth going
  deep on. Everything else stays at "competent floor."

The real risk of tandem is not hours — it's `failure_mode` #3 (holding out for
the perfect offer), because tier-one loops run longer and lower-yield. Hence a
**decision rule committed in writing, before it's emotional:** take the first
good floor offer (real comp ladder) UNLESS a tier-one loop is already at
onsite. Tier-two is the floor; tier-one is upside — not a reason to let a good
offer expire.

### What changed (additive only — nothing from v1/v2 removed)

- `public/curriculum.json` — `search` M3 target-list text kept **verbatim**;
  appended the tier-one lane framing, per-application tier tagging, and the
  offer-discipline rule. No percentages rewritten.
- `migrations/003_tandem_tiers.sql` (new) — `v_funnel_by_tier` view
  (`v_funnel` untouched) so tier conversion is a query, not a hope; seeds the
  alt-data × production-AI writeup as a phase-1 `blog-post` artifact. **Every
  statement is idempotent** (view via `DROP … IF EXISTS`; artifact via a
  guarded `INSERT … WHERE NOT EXISTS`), unlike 002 — verified by applying it
  twice against local D1 with the writeup staying at exactly one row.
- `worker/index.js` — `VALID_TIERS`
  (`series-bd/midsize/quant-eng/hyperscaler/frontier-lab`); `tier` validated
  on `POST /api/application` **only when provided** (non-breaking); and
  `funnel_by_tier` added to `GET /api/data` with an empty-array fallback.

### Verification

- `npm run build` ✓
- 003 applied twice to local D1 → idempotent (3 → 4 artifacts, writeup = 1) ✓
- `wrangler dev`: `frontier-lab` accepted, bogus tier → 400, `funnel_by_tier`
  grouped correctly in `/api/data` ✓
- 003 applied to **remote** D1 (3 → 4 artifacts, writeup = 1, view live) and
  `wrangler deploy` shipped (Version `d4239148`) ✓

### Still deliberately not done

- **No UI.** `funnel_by_tier` and the writeup artifact are API-only until the
  Pipeline tab is built in October — the tier breakdown is the thing worth
  surfacing there.
- The tandem lane activates in Phase 2 (Month 4, applications open); the
  plumbing is just ready ahead of time. `config/status.json` still starts at
  Month 1 / Phase 1, unchanged.
