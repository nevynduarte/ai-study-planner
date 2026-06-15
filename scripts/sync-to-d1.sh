#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Sync config/status.json → D1 status table, and seed the
# skill_coverage matrix from public/curriculum.json (any skill not
# already present is inserted as 'not-started'; existing rows are kept).
# Run whenever you edit status.json (per-track months, hours, notes)
# or add skills to the curriculum.
#   bash scripts/sync-to-d1.sh
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

export STATUS_FILE="$PROJECT/config/status.json"
export CURRICULUM_FILE="$PROJECT/public/curriculum.json"
export NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# 1) status.json → status table (tracks stored as a JSON value).
TMP="$(mktemp)"
node > "$TMP" <<'NODE'
const fs = require("fs");
const s = JSON.parse(fs.readFileSync(process.env.STATUS_FILE, "utf8"));
const now = process.env.NOW;
const esc = v => String(v).replace(/'/g, "''");
const rows = [
  ["tracks",        JSON.stringify(s.tracks ?? {})],
  ["total_hours",   s.total_hours_logged ?? 0],
  ["started_date",  s.started_date ?? ""],
  ["notes",         s.notes ?? ""],
];
for (const [k, v] of rows) {
  console.log(
    `INSERT INTO status (key,value,updated_at) VALUES ('${k}','${esc(v)}','${now}') ` +
    `ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`
  );
}
NODE
d1_file "$TMP"
rm -f "$TMP"

# 2) Seed skill_coverage from curriculum (idempotent — ON CONFLICT DO NOTHING
#    keeps any progress already recorded).
TMP2="$(mktemp)"
node > "$TMP2" <<'NODE'
const fs = require("fs");
const cur = JSON.parse(fs.readFileSync(process.env.CURRICULUM_FILE, "utf8"));
const now = process.env.NOW;
const esc = v => String(v).replace(/'/g, "''");
for (const [id, t] of Object.entries(cur.tracks || {})) {
  for (const skill of t.skills || []) {
    console.log(
      `INSERT INTO skill_coverage (track,skill,status,updated_at) ` +
      `VALUES ('${esc(id)}','${esc(skill)}','not-started','${now}') ` +
      `ON CONFLICT(track,skill) DO NOTHING;`
    );
  }
}
NODE
d1_file "$TMP2"
rm -f "$TMP2"

echo "Synced status.json → D1 status, and seeded skill_coverage from curriculum.json."
