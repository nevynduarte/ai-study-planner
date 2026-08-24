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

if (s.thesis) out.push(`THESIS: ${s.thesis}`);
if (s.dominant_risk) out.push(`DOMINANT RISK: ${s.dominant_risk}`);
out.push("");

// ── Where we are: date, month number, phase ────────────────────────────────
const today = new Date();
const todayStr = today.toISOString().slice(0, 10);
const started = status.started_date ? new Date(status.started_date + "T00:00:00Z") : null;
let monthN = 1;
if (started && !isNaN(started)) {
  monthN = Math.max(1, Math.floor((today - started) / (30.44 * 24 * 3600 * 1000)) + 1);
}
out.push(`TODAY: ${todayStr} — Month ${monthN} of the 12-month plan (started ${status.started_date || "?"}).`);
const phase = (cur.phases || []).find(p => {
  const [lo, hi] = String(p.months).split("-").map(Number);
  return monthN >= lo && monthN <= (hi || lo);
}) || (cur.phases || [])[(cur.phases || []).length - 1];
if (phase) {
  out.push(`PHASE ${phase.n} — ${phase.name} (months ${phase.months}, ${phase.window}). Goal: ${phase.goal}`);
  if (phase.note) out.push(`  Note: ${phase.note}`);
}

// ── Applications open date ─────────────────────────────────────────────────
const appsOpen = status.applications_open_date || "2026-11-01";
if (todayStr < appsOpen) {
  out.push(`APPLICATIONS: NOT OPEN YET — they open ${appsOpen}. The delay is deliberate: build the floor first, land in the Nov–Jan hiring window. Do not schedule applications, networking outreach, or portfolio work before then.`);
} else {
  out.push(`APPLICATIONS: OPEN (since ${appsOpen}). Target cadence 15–20/week, tracked.`);
}
out.push("");

// ── Gate with live countdown ───────────────────────────────────────────────
if (cur.gate) {
  const g = cur.gate;
  const gd = new Date((g.target_date || "2026-10-31") + "T00:00:00Z");
  const days = Math.ceil((gd - today) / (24 * 3600 * 1000));
  const countdown = days >= 0 ? `${days} days remaining` : `${-days} days PAST DUE`;
  out.push(`GATE: ${g.name} — target ${g.target_date} (${countdown}). Criteria:`);
  for (const c of g.criteria || []) {
    out.push(`- [${c.id}] ${c.text} → if failed: ${c.fail_response}`);
  }
  if (g.all_fail_response) out.push(`If ALL fail: ${g.all_fail_response}`);
  out.push("");
}

// ── Not-doing list ─────────────────────────────────────────────────────────
if (cur.not_doing && cur.not_doing.length) {
  out.push("EXPLICITLY NOT DOING (do not schedule, do not recommend):");
  for (const nd of cur.not_doing) out.push(`- ${nd}`);
  out.push("");
}

// ── Named failure modes ────────────────────────────────────────────────────
if (cur.failure_modes && cur.failure_modes.length) {
  out.push("NAMED FAILURE MODES (check the log against these):");
  for (const fm of cur.failure_modes) out.push(`- ${fm.name}: ${fm.detail}`);
  out.push("");
}

out.push("TARGET ROLES (each maps to the tracks that train for it):");
for (const role of cur.roles || []) {
  out.push(`- ${role.name} → tracks: ${(role.primary_tracks || []).join(", ")}${role.note ? ` (${role.note})` : ""}`);
}
out.push("");

const weekTotal = Object.values(cur.tracks || {})
  .reduce((sum, t) => sum + (Number(t.weekly_hours) || 0), 0);
out.push(`ACTIVE TRACKS (parallel, weighted across the ${weekTotal}h week). For each: weekly hours, current month focus, and per-skill coverage [status]:`);
const trackPos = status.tracks || {};
for (const [id, t] of Object.entries(cur.tracks || {})) {
  const pos = trackPos[id] || {};
  const monthN = Number(pos.current_month) || 1;
  const month = (t.months || []).find(m => m.n === monthN) || (t.months || [])[0] || {};
  const pct = weekTotal ? Math.round(((Number(t.weekly_hours) || 0) / weekTotal) * 100) : 0;
  out.push(`\n### ${t.name} [${id}] — ${pct}% of the week (${t.weekly_hours}h/week, ~${t.daily_hours}h/day)`);
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

console.log(out.join("\n"));
