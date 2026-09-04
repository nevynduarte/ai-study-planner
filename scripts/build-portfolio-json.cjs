#!/usr/bin/env node
// Turns crash-course/PORTFOLIO.md (single source of truth) into public/portfolio.json
// for the web app's Today / Plan / Projects tabs. Run: npm run portfolio
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "crash-course", "PORTFOLIO.md");
const OUT = path.join(ROOT, "public", "portfolio.json");
const START_DATE = "2026-09-03"; // Day 1
const GITHUB_USER = "nevynduarte";

const md = fs.readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");
const lines = md.split("\n");

const title = (lines.find(l => l.startsWith("# ")) || "# Portfolio").slice(2).trim();
const strip = s => s.replace(/\*\*/g, "").replace(/`/g, "").trim();
const cells = line => line.split("|").slice(1, -1).map(c => c.trim());
const dateOf = n => {
  const d = new Date(START_DATE + "T12:00:00");
  d.setDate(d.getDate() + (n - 1));
  return d.toISOString().slice(0, 10);
};

const projects = [];
const proves = {};
let cur = null;
let summary = "";
let inAssume = false;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith("**What \"5 weeks\" assumes:**")) { inAssume = true; summary = strip(l.replace(/^\*\*What "5 weeks" assumes:\*\*/, "")); continue; }
  if (inAssume) { if (l.trim() === "") inAssume = false; else summary += " " + strip(l); continue; }

  const wk = l.match(/^## Week (\d+) — `([^`]+)`/);
  if (wk) { cur = { n: +wk[1], id: wk[2], repo: `https://github.com/${GITHUB_USER}/${wk[2]}`, sentence: "", stack: [], days: [] }; projects.push(cur); continue; }
  if (l.startsWith("## ") && cur) { cur = null; }

  if (cur && l.startsWith("**One sentence:**")) {
    let s = strip(l.replace("**One sentence:**", ""));
    let j = i + 1; while (j < lines.length && lines[j].trim() !== "") { s += " " + strip(lines[j]); j++; }
    cur.sentence = s; continue;
  }
  if (cur && l.startsWith("**Stack:**")) {
    let s = strip(l.replace("**Stack:**", ""));
    let j = i + 1; while (j < lines.length && lines[j].trim() !== "") { s += " " + strip(lines[j]); j++; }
    cur.stack = s.split("·").map(x => x.trim()).filter(Boolean); continue;
  }

  if (!l.startsWith("|") || /^\|\s*-+/.test(l)) continue;
  const c = cells(l);
  // overview table: | # | `repo` | proves |
  if (!cur && c.length === 3 && /^\d+$/.test(c[0])) { proves[+c[0]] = strip(c[2]); continue; }
  // day rows: | Day | Build | Run | Done when |
  if (cur && c.length === 4 && /^\d+/.test(c[0])) {
    const n = parseInt(c[0], 10);
    const checked = /✅/.test(c[0]);
    const build = c[1];
    const bold = build.match(/^\*\*([^*]+)\*\*/);
    let t = bold ? bold[1].replace(/\.$/, "") : strip(build).split(/[.,]/)[0];
    if (!bold && t.length < 12) t = strip(build).slice(0, 60);
    if (t.length > 70) t = t.slice(0, 67) + "…";
    cur.days.push({ n, week: cur.n, date: dateOf(n), title: strip(t), build: strip(build), run: strip(c[2]), done: strip(c[3]), checked });
  }
}

for (const p of projects) { p.title = p.id; p.proves = proves[p.n] || ""; p.start = p.days[0]?.date; p.end = p.days[p.days.length - 1]?.date; }

// Applications list (## Austin applications ...)
let applications = [];
const appIdx = lines.findIndex(l => l.startsWith("## Austin applications"));
if (appIdx >= 0) {
  let s = ""; let j = appIdx + 1;
  while (j < lines.length && !lines[j].startsWith("## ")) { s += " " + lines[j]; j++; }
  applications = s.split("·").map(x => strip(x)).map(x => x.replace(/^\d+\.\s*/, "")).filter(x => /—|\(/.test(x) && x.length < 90);
}

const days = projects.flatMap(p => p.days);
const out = {
  title, summary, start_date: START_DATE, total_days: days.length, generated_at: new Date().toISOString(),
  projects, applications,
  // Compatibility shape for the app's existing "crash course" day logic.
  crash_course: { title, summary, start_date: START_DATE, project: projects.map(p => p.id).join(" → "),
    days: days.map(d => ({ n: d.n, week: d.week, title: `${projects[d.week - 1]?.id}: ${d.title}`, build: d.build, drill: d.run, done: d.done, checked: d.checked })) },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`portfolio.json: ${projects.length} projects, ${days.length} days (${days.filter(d => d.checked).length} checked), ${applications.length} applications`);
if (days.length !== 35) console.warn(`WARN: expected 35 days, parsed ${days.length}`);
