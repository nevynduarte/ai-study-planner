#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Write the full hour-by-hour tutorial for one portfolio day.
# Uses local Claude Max (claude -p), no API key. Output:
#   crash-course/tutorials/day-NN.md
#
#   bash scripts/write-tutorial.sh 3        # write Day 3
#   bash scripts/write-tutorial.sh          # write the next day with no tutorial
#   bash scripts/write-tutorial.sh 3 --force  # overwrite an existing one
#
# The daily 6am job calls this for tomorrow, so a tutorial is always
# waiting before you need it.
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/lib.sh"

TUT_DIR="$PROJECT/crash-course/tutorials"
mkdir -p "$TUT_DIR"

DAY="${1:-}"
FORCE=0
[ "${2:-}" = "--force" ] && FORCE=1
[ "${1:-}" = "--force" ] && { FORCE=1; DAY=""; }

# Pick the next day lacking a tutorial if none given.
if [ -z "$DAY" ]; then
  for n in $(seq 1 35); do
    f="$TUT_DIR/day-$(printf %02d "$n").md"
    [ -f "$f" ] || { DAY="$n"; break; }
  done
fi
[ -n "$DAY" ] || { echo "All 35 days have tutorials."; exit 0; }

NN="$(printf %02d "$DAY")"
OUT="$TUT_DIR/day-$NN.md"
if [ -f "$OUT" ] && [ "$FORCE" = 0 ]; then
  echo "day-$NN.md already exists (use --force to rewrite)"; exit 0
fi

# The day's row, the project brief, and an existing tutorial as the style exemplar.
ROW="$(DAY="$DAY" PF="$PROJECT/public/portfolio.json" node -e '
const fs=require("fs");
const p=JSON.parse(fs.readFileSync(process.env.PF,"utf8"));
const d=p.projects.flatMap(x=>x.days).find(x=>x.n===Number(process.env.DAY));
const proj=p.projects.find(x=>x.n===d.week);
console.log(JSON.stringify({day:d.n,date:d.date,week:d.week,project:proj.id,repo:proj.repo,
  goal:proj.goal,sentence:proj.sentence,stack:proj.stack,title:d.title,build:d.build,run:d.run,done:d.done,
  prev:proj.days.filter(x=>x.n<d.n).map(x=>({n:x.n,title:x.title,done:x.done})),
  next:proj.days.filter(x=>x.n>d.n).slice(0,1).map(x=>({n:x.n,title:x.title}))},null,1));
')"
BRIEF_ID="$(echo "$ROW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).project))')"
BRIEF="$(cat "$PROJECT/crash-course/projects/$BRIEF_ID.md" 2>/dev/null || echo "(no brief)")"
EXEMPLAR="$(cat "$TUT_DIR/day-02.md" 2>/dev/null || echo "")"

echo "Writing day-$NN.md ($BRIEF_ID)…"
PROMPT="$(mktemp)"
{
  cat "$DIR/tutorial-prompt.txt"
  printf "\n\n=== TODAY'S ROW (JSON) ===\n%s\n" "$ROW"
  printf "\n=== PROJECT BRIEF ===\n%s\n" "$BRIEF"
  printf "\n=== STYLE EXEMPLAR — match this depth, structure and voice exactly (this is Day 2) ===\n%s\n" "$EXEMPLAR"
} > "$PROMPT"
claude -p < "$PROMPT" > "$OUT"
rm -f "$PROMPT"

if [ ! -s "$OUT" ]; then
  echo "ERROR: empty output, removing $OUT" >&2; rm -f "$OUT"; exit 1
fi
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
node "$DIR/build-portfolio-json.cjs"
