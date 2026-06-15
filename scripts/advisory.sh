#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Nightly on P620 (cron, 11pm ET). Generates a brutally honest
# multi-track plan-health advisory from curriculum + status + log,
# writes the prose to D1 advisory, and upserts any skill-coverage
# changes the advisory reports into D1 skill_coverage.
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

TODAY="$(date +%Y-%m-%d)"
LOG="$PROJECT/logs/advisory.log"
mkdir -p "$(dirname "$LOG")"

CTX="$(mktemp)"; build_context "$CTX"

RAW="$(claude -p "$(cat "$DIR/advisory-prompt.txt")

$(cat "$CTX")" 2>>"$LOG")"

rm -f "$CTX"

if [ -z "$RAW" ]; then
  echo "[$(date)] WARN: empty advisory" >> "$LOG"
  exit 0
fi

# Split the prose (stored in D1) from the machine-readable coverage block.
# render: writes prose to $PROSE and a JSON array of coverage rows to $COVJSON.
PROSE="$(mktemp)"; COVJSON="$(mktemp)"
RAW_CONTENT="$RAW" PROSE_OUT="$PROSE" COV_OUT="$COVJSON" node <<'NODE'
const fs = require("fs");
const raw = process.env.RAW_CONTENT || "";
const start = raw.indexOf("<<<COVERAGE");
const end = raw.indexOf("COVERAGE>>>");
let prose = raw, cov = "[]";
if (start !== -1 && end !== -1 && end > start) {
  prose = (raw.slice(0, start) + raw.slice(end + "COVERAGE>>>".length)).trim();
  cov = raw.slice(start + "<<<COVERAGE".length, end).trim() || "[]";
}
fs.writeFileSync(process.env.PROSE_OUT, prose);
// Validate JSON; fall back to empty array on any parse problem.
let rows = [];
try { rows = JSON.parse(cov); if (!Array.isArray(rows)) rows = []; } catch { rows = []; }
fs.writeFileSync(process.env.COV_OUT, JSON.stringify(rows));
NODE

# 1) Store the prose advisory.
ADVISORY="$(cat "$PROSE")"
if [ -n "$ADVISORY" ]; then
  d1_put_content advisory "$TODAY" "$ADVISORY"
  echo "[$(date)] Advisory written to D1" >> "$LOG"
fi

# 2) Upsert skill-coverage changes, if any.
SQL="$(mktemp)"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)" COV_OUT="$COVJSON" node > "$SQL" <<'NODE'
const fs = require("fs");
const rows = JSON.parse(fs.readFileSync(process.env.COV_OUT, "utf8"));
const now = process.env.NOW;
const valid = new Set(["not-started", "learning", "built", "interview-ready"]);
const esc = v => String(v).replace(/'/g, "''");
for (const r of rows) {
  if (!r || !r.track || !r.skill || !valid.has(r.status)) continue;
  console.log(
    `INSERT INTO skill_coverage (track,skill,status,updated_at) ` +
    `VALUES ('${esc(r.track)}','${esc(r.skill)}','${esc(r.status)}','${now}') ` +
    `ON CONFLICT(track,skill) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at;`
  );
}
NODE

if [ -s "$SQL" ]; then
  d1_file "$SQL"
  echo "[$(date)] Coverage updated ($(wc -l < "$SQL") skills)" >> "$LOG"
else
  echo "[$(date)] No coverage changes" >> "$LOG"
fi

rm -f "$PROSE" "$COVJSON" "$SQL"
