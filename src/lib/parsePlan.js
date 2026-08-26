// Parses a P620-generated markdown plan into renderable blocks.
// Extracted from App.jsx unchanged — pure, and the piece most worth testing
// in isolation if this ever gets a test runner.
const guessTrack = (s) => { for (const [re, id] of TRACK_GUESS) if (re.test(s)) return id; return null; };
export function parsePlan(md) {
  const blocks = [], wrap = [];
  let inWrap = false;
  for (const raw of (md || "").split("\n")) {
    const line = raw.trim();
    if (/^#{1,4}\s*wrap/i.test(line)) { inWrap = true; continue; }
    const m = /^([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (!m) continue;
    // The persistence key: identical stripping to planItemLabels below, so
    // checked state keeps working across renderer versions.
    const label = m[2].replace(/^\[[ xX]\]\s*/, "").replace(/[*`]/g, "").trim();
    if (!label) continue;
    if (inWrap) {
      const km = /^(DO NOT SKIP|GATE MOVE|COVERAGE MOVE|SHIP TODAY)\s*:?\s*(.*)$/i.exec(label);
      wrap.push({ label, kind: km ? km[1].toUpperCase() : null, text: km ? km[2] : label });
      continue;
    }
    let rest = label, time = null, track = null, mode = null;
    const tm = /^(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})\s*/.exec(rest);
    if (tm) { time = `${tm[1]}–${tm[2]}`; rest = rest.slice(tm[0].length); }
    let bm;
    while ((bm = /^\[([^\]]+)\]\s*/.exec(rest))) {
      const tag = bm[1].trim();
      if (/^(THEORY|IMPLEMENTATION)$/i.test(tag)) mode = tag.toUpperCase();
      else track = guessTrack(tag) || track;
      rest = rest.slice(bm[0].length);
    }
    rest = rest.replace(/^[—–-]\s*/, "");
    if (!track) track = guessTrack(rest);
    let task = rest, doneWhen = null;
    const dw = /(?:·\s*)?done when\s*:\s*/i.exec(rest);
    if (dw) { task = rest.slice(0, dw.index).replace(/[·\s]+$/, "").trim(); doneWhen = rest.slice(dw.index + dw[0].length).trim(); }
    blocks.push({ label, time, track, mode, task, doneWhen });
  }
  return { blocks, wrap };
}

// ─── Helpers ──────────────────────────────────────────────────────
const todayFmt = () => new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
const fmtDate  = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "";
const fmtTs    = (ts)  => ts ? new Date(ts).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }) : "";
const roiColor = (s) => s >= 85 ? "#185FA5" : s >= 75 ? "#3B6D11" : s >= 65 ? "#BA7517" : "#A32D2D";

// Skill-coverage status → color + short label.
