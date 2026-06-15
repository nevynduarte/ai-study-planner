#!/usr/bin/env node
/**
 * Renders the curriculum + live status + skill coverage into a compact text
 * block that grounds every Claude prompt. Single source of truth is
 * public/curriculum.json; live positions come from config/status.json; skill
 * coverage comes from D1 (passed in via the COVERAGE_JSON env var, which holds
 * the raw `wrangler d1 execute --json` output).
 *
 * Usage: COVERAGE_JSON='<d1 json>' node render-context.js <curriculum.json> <status.json>
 */
const fs = require("fs");

const [, , curriculumPath, statusPath] = process.argv;

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}

const cur = readJSON(curriculumPath, null);
const status = readJSON(statusPath, {});

if (!cur) { console.log("(curriculum.json unavailable)"); process.exit(0); }

// Parse D1 coverage rows: [{ track, skill, status }]
let coverage = [];
try {
  const parsed = JSON.parse(process.env.COVERAGE_JSON || "[]");
  coverage = (Array.isArray(parsed) && parsed[0] && parsed[0].results) || [];
} catch { coverage = []; }
const covLookup = {};
for (const r of coverage) covLookup[`${r.track}:::${r.skill}`] = r.status;

const out = [];
const s = cur.student || {};
out.push(`STUDENT: ${s.name || ""}`);
if (s.background) out.push(`BACKGROUND: ${s.background}`);
if (s.commitment) out.push(`COMMITMENT: ${s.commitment}`);
if (s.income_target) out.push(`INCOME TARGET: ${s.income_target}`);
out.push("");

out.push("TARGET ROLES (each maps to the tracks that train for it):");
for (const role of cur.roles || []) {
  out.push(`- ${role.name} → tracks: ${(role.primary_tracks || []).join(", ")}${role.note ? ` (${role.note})` : ""}`);
}
out.push("");

out.push("ACTIVE TRACKS (parallel, daily-weighted). For each: weight of the 10h day, current month focus, and per-skill coverage [status]:");
const trackPos = status.tracks || {};
for (const [id, t] of Object.entries(cur.tracks || {})) {
  const pos = trackPos[id] || {};
  const monthN = Number(pos.current_month) || 1;
  const month = (t.months || []).find(m => m.n === monthN) || (t.months || [])[0] || {};
  const pct = Math.round((t.weight || 0) * 100);
  out.push(`\n### ${t.name} [${id}] — ${pct}% of day (~${t.daily_hours}h)`);
  out.push(`  Now: Month ${monthN}/12 — ${month.title || ""}: ${month.focus || ""}`);
  const skills = (t.skills || []).map(sk => {
    const st = covLookup[`${id}:::${sk}`] || "not-started";
    return `${sk} [${st}]`;
  });
  out.push(`  Skills coverage: ${skills.join("; ")}`);
}
out.push("");

// Coverage tally so prompts can reason about "ground covered".
const counts = { "not-started": 0, "learning": 0, "built": 0, "interview-ready": 0 };
let totalSkills = 0;
for (const [id, t] of Object.entries(cur.tracks || {})) {
  for (const sk of t.skills || []) {
    totalSkills++;
    const st = covLookup[`${id}:::${sk}`] || "not-started";
    if (counts[st] !== undefined) counts[st]++;
  }
}
out.push(`COVERAGE TALLY (of ${totalSkills} skills): not-started ${counts["not-started"]}, learning ${counts["learning"]}, built ${counts["built"]}, interview-ready ${counts["interview-ready"]}.`);

if (cur.roi_priority) out.push(`\nROI PRIORITY ORDER: ${cur.roi_priority.join(" → ")}. Keep low-ROI / Tier 3-4 topics under 20% of weekly hours.`);

console.log(out.join("\n"));
