# v3 Migration — MLE floor → Senior/Staff ML/AI Engineer

Migrated 2026-08-24, on branch `claude/bracketlens-job-research-vxqcct`.

## Why

v2 targeted an MLE seat at $200–300K on 10h/week, with a deliberate deferral to
the Nov–Jan window. The target moved: **Senior ML/AI Engineer (L5/E5) at
$300–450K, staff as stretch**, at **20h/week**. Answers given at re-plan time:
20h/week capacity, senior applications still opening Nov 1 with a separate staff
lane in Feb, senior as the real target.

### The reframe this plan is built on

The request that triggered it asked for deep mathematics, ML fundamentals, and
from-scratch algorithm knowledge. That is worth having, and it is **not** what
gates senior. With a BS Mathematics and an MS Data Science already in hand, the
mathematics is present; nobody in a senior loop asks a candidate to derive the
ELBO. What they ask is: *take this design from 1K users to 10M and tell me what
breaks at each step*, and *tell me about a system you owned — what went wrong?*

So v3 keeps v2's thesis (**under-legible, not under-skilled**) and changes only
what has to be legible. A tier-two MLE seat needs a clean resume and a passed
coding screen. A senior seat needs **one system owned end to end with real scale
numbers, real failure modes, and defensible tradeoffs**. That is built, not
studied — which is why the largest line in the budget is a build, not a course.

The deep-fundamentals ask is honoured, but **bounded**: six from-scratch
implementations, 62 of 520 hours, each ending in an artifact. Capping it is not a
compromise — v2's own `failure_modes[1]` ("depth-chasing as avoidance") and its
`not_doing` list already named this exact pattern as the plan's main risk.

## The budget — 26 weeks × 20h = 520 hours, fully allocated

| Track | Phase 1 (10 wks) | Phase 2 (16 wks) | Total |
|---|---|---|---|
| `flagship` **(new)** | 5h | 6h | **146h** |
| `search` | 2h | 5h | 100h |
| `sys-design` | 3h | 4h | 94h |
| `dsa` | 5h | 2h | 82h |
| `foundations` **(new)** | 3h | 2h | **62h** |
| `ml-recall` | 2h | 1h | 36h |
| | **20h/wk** | **20h/wk** | **520h** |

`flagship` is the largest line because it is the only one that produces senior
evidence. `foundations` is capped at 12% — over-running it two weeks running is
the named avoidance signal, not a scheduling problem.

## What changed

### `public/curriculum.json`
- v2's `student`, `tracks`, `phases`, `gate` **moved to `archive.v2_*`** — parked,
  not deleted, and explicitly restorable if capacity proves to be 10h/week.
- New `student`: 20h commitment, $300–450K target, `target_level`, `budget`,
  `what_actually_gates_senior` (ranked by how often each decides the loop), and
  `scale_honesty`.
- Two new tracks: **`foundations`** (autograd → transformer → classic ML →
  inference internals → LoRA → distributed training, one deliverable per month)
  and **`flagship`** (design doc → eval harness → deploy → *scale until it breaks*
  → harden and publish → talk-track).
- `sys-design` months rewritten so **every design carries an explicit
  1K → 100K → 10M scale ladder** — the senior differentiator; mid-level
  candidates design for one scale and stop.
- `search` M1 rewritten: the resume reframes from *projects* to **owned systems
  with numbers**. Consulting work reads as projects unless forced into system
  language, and that is the single widest legibility gap to the senior band.
- `gate` gains a fifth criterion (`flagship_live`); new **`gate_2`** for the staff
  lane (load test, published writeup, depth, scope narrative).
- `not_doing` and `failure_modes` extended, including "the flagship never ships"
  and "capacity was aspirational".
- Aaru/Equi roles (June-2026 interviews, long past) moved to
  `archive.stale_2026_roles`; the primary role retargeted to Senior at $300–450K;
  a staff stretch role added.

### `migrations/004_v3_senior.sql` (new)
Gate-1 `flagship_live`, four `staff_*` Gate-2 criteria, the six flagship
deliverables plus the autograd artifact, and the new status rows. **Every
statement is idempotent** — verified by applying it three times to a SQLite build
of `schema.sql` + 002 + 003, with gate criteria and artifact titles staying
duplicate-free.

### Bugs found and fixed along the way
These were **pre-existing on `main`**, introduced when v2 dropped the v1 `weight`
field without updating its readers:

- `scripts/render-context.cjs` computed `pct` from `t.weight`, so **every track
  had been reported to Claude as "0% of the week"** in every briefing, advisory
  and tutor prompt since the v2 migration. Now derived from `weekly_hours`.
- The same file hardcoded `"the 10h week"` in the tracks header; now computed.
- `src/App.jsx` used `t.weight` in two more places — the weekly per-track target
  ring and the roadmap header (which also referenced a `t.summary` that no longer
  exists). Both now read `weekly_hours`.

### Other files
- `config/status.json` — `v3-senior-staff-20h`, 20h target, six tracks at month 1,
  `gate_2_date` and `staff_applications_open_date`.
- `worker/index.js` — `VALID_TRACKS` extended with `foundations` and `flagship`
  (additive; existing IDs untouched, so nothing already logged breaks).
- `src/App.jsx` — `DAILY_HOURS` 2 → 4, `WEEKLY_TARGET` 10 → 20.
- `scripts/plan-prompt.txt` — 2h → 4h plans, six tracks, the foundations cap and
  the flagship's precedence stated explicitly.
- `scripts/advisory-prompt.txt` — six tracks, 20h, senior target, plus two v3
  checks every run: foundations against its cap, and whether this month's flagship
  deliverable is on track. Also a capacity check — two consecutive weeks under 15h
  means restore `archive.v2_*` rather than run a 20h plan at half capacity.

## Verification

- `render-context.cjs` — Month 1, Phase 1, Gate 1 at 68 days, six tracks summing
  to 20h/week, percentages correct (25/25/15/15/10/10). ✓
- `npm run build` ✓
- 004 applied three times to a local SQLite build → idempotent; gate_check 4 → 9,
  artifacts 4 → 11, no duplicates. ✓
- **Remote D1 migration and `wrangler deploy` still pending** — no Cloudflare
  credentials in this environment. Run:
  `wrangler d1 execute ai-study-planner --remote --file=migrations/004_v3_senior.sql`
  then `npm run build && wrangler deploy`, then `bash scripts/sync-to-d1.sh` to
  seed the two new tracks' skills into `skill_coverage`.

## Deliberately not done

- **No UI for Gate 2.** Same call v2 made: API-only until the tab is worth
  building. Gate 2 is four rows; it does not need a screen in August.
- **No second flagship, and no expansion of the foundations list.** Both are in
  `not_doing` for the same reason.
- **`crash-course/`** — still v1-era, still untouched.

## The honest caveat

520 hours does not buy the years of production experience a senior loop is
implicitly pricing. What it buys is **one system deep enough that the experience
is real**, and the narrative to make existing Bridges AI work legible at that
level. That is a genuine path to senior. Staff in six months, from a consulting
background with no prior in-org staff scope, is a stretch — which is why it sits
behind Gate 2 with a fail response that says *apply senior-only*, rather than
being assumed.
