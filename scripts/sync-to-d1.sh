#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Sync config/status.json → D1 status table.
# Run whenever you edit status.json (current month, hours, notes).
#   bash scripts/sync-to-d1.sh
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

export STATUS_FILE="$PROJECT/config/status.json"
export NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

TMP="$(mktemp)"
node > "$TMP" <<'NODE'
const fs = require("fs");
const s = JSON.parse(fs.readFileSync(process.env.STATUS_FILE, "utf8"));
const now = process.env.NOW;
const esc = v => String(v).replace(/'/g, "''");
const rows = [
  ["current_month", s.current_month ?? 1],
  ["total_hours",   s.total_hours_logged ?? 0],
  ["month_title",   s.month_title ?? ""],
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
echo "Synced config/status.json → D1 status table."
