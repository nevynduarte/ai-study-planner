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
  if (cur && l.startsWith("**Week goal:**")) {
    let s = strip(l.replace("**Week goal:**", ""));
    let j = i + 1; while (j < lines.length && lines[j].trim() !== "") { s += " " + strip(lines[j]); j++; }
    cur.goal = s; continue;
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

// ── Hour-by-hour schedule per day, derived from the row (deterministic, no LLM) ──
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const splitSteps = text => {
  const parts = text.split(/(?<=[.;])\s+(?=\S)/).map(x => x.trim()).filter(x => x.length > 3);
  if (parts.length <= 6) return parts;
  const head = parts.slice(0, 5), tail = parts.slice(5).join(" ");
  return [...head, tail];
};
for (const p of projects) for (const d of p.days) {
  const isMWF = [1, 3, 5].includes(new Date(d.date + "T12:00:00").getDay());
  const body = d.build.startsWith(d.title) ? d.build.slice(d.title.length).replace(/^[.:]?\s*/, "") : d.build;
  const raw = splitSteps(body).filter(x => !/^Send applications|^Applications \d/.test(x));
  const appStep = /applications? \d|Send applications|Applications \d/i.test(d.build);
  const n = Math.max(1, raw.length);
  const slot = Math.max(30, Math.round((300 / n) / 15) * 15);
  let t = 9 * 60, lunch = false;
  const steps = [];
  const push = (kind, mins, text, coach) => {
    if (!lunch && t >= 12 * 60) { steps.push({ time: `${hhmm(t)}–${hhmm(t + 30)}`, kind: "BREAK", text: "Lunch. Step away from the screen." }); t += 30; lunch = true; }
    steps.push({ time: `${hhmm(t)}–${hhmm(t + mins)}`, kind, text, coach }); t += mins;
  };
  const ctx = `I am on Week ${p.n}, Day ${d.n} ("${d.title}") of my ${p.id} repo. Today's row says: BUILD — ${d.build} RUN — ${d.run} DONE WHEN — ${d.done}.`;
  raw.forEach((s, i) => push("BUILD", slot, s,
    `${ctx}\n\nWalk me through step ${i + 1} of ${n}: "${s}". First explain in plain words what each file or tool in this step is for and how data flows through it. Then help me build it in small pieces, running something after each piece. Stop and quiz me on why we made each choice before moving on.`));
  push("RUN", 45, `Run and verify: ${d.run}`, `${ctx}\n\nHelp me run today's command and verify the done-when condition. If anything fails, help me debug it and then write a FAILURES.md line in the format "date · tried · saw · changed to · result".`);
  const adr = d.build.match(/ADR-\d+[^.;]*/g);
  push("DEFEND", 30, adr ? `Write ${adr.join(", ").replace(/\s+/g, " ")} and any FAILURES.md lines from today.` : "Write one FAILURES.md line for anything that broke, then three sentences: \"In an interview I'd describe today's work as…\"",
    `${ctx}\n\nInterview me for 10 minutes on what I built today using the six levels (what, how, why this, why not X, what breaks at 10×, how do you know). Then help me write ${adr ? adr.join(" and ") : "the FAILURES.md lines"} with the ADR template: context, requirements, options, decision, why, tradeoff, evidence, would-change-if.`);
  if (appStep) push("APPLY", 45, "Send today's applications (see the row) and log them in applications.md with date, role, link, status, materials.", `${ctx}\n\nHelp me tailor my résumé summary and a 4-sentence note for each application named in today's row, using measured numbers from BENCHMARKS.md and the live URL.`);
  if (isMWF) push("DRILL", 25, "One LeetCode 150 problem, 25-minute timer. Timer ends → read the solution, write one sentence on the trick, move on.");
  d.steps = steps;
}

// ── Project briefs: crash-course/projects/<id>.md → public/projects/<id>.md ──
const briefDir = path.join(ROOT, "public", "projects");
fs.mkdirSync(briefDir, { recursive: true });
for (const p of projects) {
  const src = path.join(ROOT, "crash-course", "projects", `${p.id}.md`);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(briefDir, `${p.id}.md`)); p.brief = `/projects/${p.id}.md`; }
}

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
