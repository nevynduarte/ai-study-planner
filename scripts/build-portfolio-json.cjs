#!/usr/bin/env node
// Turns crash-course/PORTFOLIO.md (the project list) plus the per-project
// crash-course/<ID>_3_WEEK_PLAN.md day plans into public/portfolio.json for the
// web app's Today / Plan / Projects tabs. Run: npm run portfolio
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
// Each project is a three-week block. Day numbers are global and fixed per
// slot (project 2 starts at Day 22 even if project 1's plan is shorter), so a
// "Day N done" mark never drifts when a later plan file lands.
const DAYS_PER_PROJECT = 21;

// Summary: the first prose paragraph after the title (skips the "Revised" stamp).
let summary = "";
{
  let i = lines.findIndex(l => l.startsWith("# ")) + 1;
  while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith("**Revised"))) i++;
  const para = [];
  while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("|")) para.push(strip(lines[i++]));
  summary = para.join(" ");
}

// ── Projects: the "## Final portfolio" table — | Weeks | `repo` | What it proves | ──
const projects = [];
for (const l of lines) {
  if (!l.startsWith("|") || /^\|\s*-+/.test(l)) continue;
  const c = cells(l);
  const wk = c.length === 3 && c[0].match(/^(\d+)\s*[–-]\s*(\d+)$/);
  const id = c.length === 3 && c[1].match(/^`([^`]+)`$/);
  if (!wk || !id) continue;
  projects.push({ n: projects.length + 1, id: id[1], weeks: `${wk[1]}–${wk[2]}`, weekStart: +wk[1], weekEnd: +wk[2],
                  repo: `https://github.com/${GITHUB_USER}/${id[1]}`, proves: strip(c[2]), sentence: "", stack: [], days: [] });
}

// ── Per-project detail from its "# Project N — …" section: Goal, Core flow, Required stack ──
const fenced = (from) => { // lines of the first ``` block at/after `from`; returns [lines, indexAfter]
  let i = from; while (i < lines.length && !lines[i].startsWith("```")) { if (lines[i].startsWith("#")) return [[], i]; i++; }
  const out = []; i++;
  while (i < lines.length && !lines[i].startsWith("```")) out.push(lines[i++]);
  return [out, i + 1];
};
for (const p of projects) {
  const head = lines.findIndex(l => new RegExp(`^# Project ${p.n}\\b`).test(l));
  if (head < 0) continue;
  let end = lines.findIndex((l, i) => i > head && l.startsWith("# "));
  if (end < 0) end = lines.length;
  for (let i = head + 1; i < end; i++) {
    const l = lines[i];
    if (l === "## Goal") {
      let j = i + 1; while (j < end && lines[j].trim() === "") j++;
      const para = []; while (j < end && lines[j].trim() !== "" && !lines[j].startsWith("#")) para.push(strip(lines[j++]));
      p.sentence = para.join(" ");
    }
    if (/^## Core (flow|lifecycle)$/.test(l)) {
      const [block] = fenced(i + 1);
      // One node per non-arrow line; arrows (↓, ->, →) and blank lines separate them.
      p.flow = block.map(x => x.trim()).filter(x => x && !/^[↓→>|-]+$/.test(x) && !/^(->|→)/.test(x))
        .map(x => x.replace(/^(->|→)\s*/, "").trim()).filter(Boolean);
    }
    if (l === "## Required stack") {
      let j = i + 1;
      while (j < end && !lines[j].startsWith("#")) {
        const b = lines[j].match(/^-\s+(.+)$/);
        // The tool alone: drop a trailing qualifier sentence and any final period.
        if (b) p.stack.push(strip(b[1]).split(/;\s+/)[0].replace(/\s*\.$/, "").trim());
        j++;
      }
    }
  }
}

// ── Days: crash-course/<ID>_3_WEEK_PLAN.md, one "## Day N — title" section per day ──
// Each section carries **Learn:**, a **Build** bullet list, a **Run** code block
// and a **Done when** sentence; gate days use **Week N gate:** / **Final oral
// defense:** instead. Missing plan files leave the project with zero days.
const planFile = (id) => path.join(ROOT, "crash-course", `${id.toUpperCase().replace(/-/g, "_")}_3_WEEK_PLAN.md`);
for (const p of projects) {
  const f = planFile(p.id);
  if (!fs.existsSync(f)) { p.days = []; continue; }
  const pl = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n").split("\n");
  const heads = [];
  pl.forEach((l, i) => { const m = l.match(/^## Day (\d+)\s*[—–-]\s*(.+)$/); if (m) heads.push({ i, local: +m[1], title: m[2].trim() }); });
  heads.forEach((h, k) => {
    let end = k + 1 < heads.length ? heads[k + 1].i : pl.length;
    for (let i = h.i + 1; i < end; i++) if (/^#{1,2} /.test(pl[i])) { end = i; break; }
    const sec = pl.slice(h.i + 1, end);
    const checked = /✅/.test(h.title);
    const titleText = strip(h.title.replace(/✅/g, ""));
    const bullets = [], labelled = {};
    let label = null, run = "";
    for (let i = 0; i < sec.length; i++) {
      const l = sec[i];
      if (l.startsWith("```")) {
        const block = []; i++;
        while (i < sec.length && !sec[i].startsWith("```")) block.push(sec[i++]);
        if (label === "run" && !run) run = block.map(x => x.trim()).filter(x => x && !x.startsWith("#")).join(" && ");
        continue;
      }
      const lab = l.match(/^\*\*([^*]+?)\*\*:?\s*(.*)$/);
      if (lab) {
        const name = lab[1].replace(/:$/, "").trim();
        label = /^Build/i.test(name) ? "build" : /^Run\b/i.test(name) ? "run" : /^Done when/i.test(name) ? "done"
              : /gate$|^Final oral defense/i.test(name) ? "gate" : /^Learn/i.test(name) ? "learn" : "other:" + name;
        if (lab[2]) labelled[label] = (labelled[label] ? labelled[label] + " " : "") + strip(lab[2]);
        continue;
      }
      const b = l.match(/^-\s+(.+)$/);
      if (b) { bullets.push({ label, text: strip(b[1]) }); continue; }
      if (label && l.trim() && !l.startsWith("|") && !/^-{3,}$/.test(l.trim())) labelled[label] = (labelled[label] ? labelled[label] + " " : "") + strip(l);
    }
    const sentence = t => /[.!?]$/.test(t) ? t : t + ".";
    const buildBul = bullets.filter(b => b.label === "build");
    const plainBul = bullets.filter(b => b.label == null || b.label === "build");
    const build = (buildBul.length ? buildBul : plainBul).map(b => sentence(b.text)).join(" ")
               || labelled.build || "";
    const extras = Object.keys(labelled).filter(k => k.startsWith("other:"))
      .map(k => /[.!?]$/.test(k) ? `${k.slice(6)} ${labelled[k]}` : `${k.slice(6)}: ${labelled[k]}`);
    const n = (p.n - 1) * DAYS_PER_PROJECT + h.local;
    p.days.push({
      n, local: h.local, week: p.n, date: dateOf(n), title: titleText.length > 70 ? titleText.slice(0, 67) + "…" : titleText,
      learn: labelled.learn || "",
      build: build || extras.join(" ") || titleText,
      run: run || labelled.run || extras.find(x => /^(Measure|Experiment|Load test|Failure drill|Tests)/i.test(x)) || "",
      done: labelled.done || labelled.gate || "",
      checked,
    });
  });
  p.days.sort((a, b) => a.n - b.n);
}

for (const p of projects) { p.title = p.id; p.start = p.days[0]?.date || dateOf((p.n - 1) * DAYS_PER_PROJECT + 1); p.end = p.days[p.days.length - 1]?.date || dateOf(p.n * DAYS_PER_PROJECT); }

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
  const ctx = `I am on Project ${p.n} (weeks ${p.weeks}), Day ${d.n} — day ${d.local} of the ${p.id} plan ("${d.title}"). The plan says: LEARN — ${d.learn || "n/a"} BUILD — ${d.build} RUN — ${d.run} DONE WHEN — ${d.done}.`;
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

// ── Per-day tool strip: which of the project's stack a day actually touches, so
// the Plan and Projects tabs can head each day with logos instead of only prose.
for (const p of projects) {
  for (const d of p.days) {
    const hay = `${d.title} ${d.build} ${d.run} ${d.done}`.toLowerCase();
    // A stack entry counts as touched if any of its distinctive words appears in
    // the day's text — "Postgres 16 + pgvector (RLS)" matches a day naming only
    // pgvector. Version numbers and filler words are not distinctive.
    const FILLER = new Set(["the", "and", "with", "for", "day", "later", "adapter", "runtime", "sdk", "local", "cloud", "edition", "compose",
                            "agent", "custom", "comparison", "locally", "equivalent", "tooling", "production", "milestone", "gateway"]);
    d.tech = p.stack.filter(t => String(t).toLowerCase()
      .split(/[^a-z0-9.+-]+/)
      .some(w => w.length > 2 && !FILLER.has(w) && !/^[\d.]+$/.test(w) && hay.includes(w))
    ).slice(0, 7);
  }
}

// ── Tutorials: crash-course/tutorials/day-NN.md → public/tutorials/, split into per-step sections ──
const tutSrcDir = path.join(ROOT, "crash-course", "tutorials");
const tutOutDir = path.join(ROOT, "public", "tutorials");
fs.mkdirSync(tutOutDir, { recursive: true });
for (const p of projects) for (const d of p.days) {
  const f = path.join(tutSrcDir, `day-${String(d.n).padStart(2, "0")}.md`);
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  // The tutorials were written for an earlier plan whose day numbers no longer
  // line up. Only attach one whose own heading names this day's title, so a
  // day never opens a walkthrough for different work.
  const th = text.match(/^# Day \d+\s*[—–-]\s*(.+)$/m);
  const norm = x => String(x).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!th || !(norm(th[1]) === norm(d.title) || norm(d.title).includes(norm(th[1])) || norm(th[1]).includes(norm(d.title)))) continue;
  fs.copyFileSync(f, path.join(tutOutDir, `day-${String(d.n).padStart(2, "0")}.md`));
  d.tutorial = `/tutorials/day-${String(d.n).padStart(2, "0")}.md`;
  // Sections: "## Step N · title", plus "## Run", "## Defend" for the trailing blocks.
  const secs = [];
  const re = /^##\s+(.+)$/gm;
  let m, marks = [];
  while ((m = re.exec(text))) marks.push({ head: m[1].trim(), start: m.index });
  marks.forEach((mk, i) => secs.push({ head: mk.head, body: text.slice(mk.start, i + 1 < marks.length ? marks[i + 1].start : text.length).trim() }));
  const intro = marks.length ? text.slice(0, marks[0].start).trim() : text.trim();
  d.tutorial_intro = intro;
  const stepSecs = secs.filter(s => /^Step\s+\d+/i.test(s.head));
  const runSec = secs.find(s => /^Run\b/i.test(s.head));
  const defSec = secs.find(s => /^Defend\b/i.test(s.head));
  let bi = 0;
  for (const st of d.steps) {
    if (st.kind === "BUILD") { if (stepSecs[bi]) st.tutorial = stepSecs[bi].body; bi++; }
    else if (st.kind === "RUN" && runSec) st.tutorial = runSec.body;
    else if (st.kind === "DEFEND" && defSec) st.tutorial = defSec.body;
  }
  // If the tutorial has a different number of steps than the generated schedule, retime from the tutorial.
  if (stepSecs.length && stepSecs.length !== d.steps.filter(s => s.kind === "BUILD").length) {
    const keep = d.steps.filter(s => !["BUILD"].includes(s.kind) && s.kind !== "BREAK");
    const slot = Math.max(30, Math.round((300 / stepSecs.length) / 15) * 15);
    let t = 9 * 60, lunch = false; const out = [];
    const push = (kind, mins, text, coach, tutorial) => {
      if (!lunch && t >= 12 * 60) { out.push({ time: `${hhmm(t)}–${hhmm(t + 30)}`, kind: "BREAK", text: "Lunch. Step away from the screen." }); t += 30; lunch = true; }
      out.push({ time: `${hhmm(t)}–${hhmm(t + mins)}`, kind, text, coach, tutorial }); t += mins;
    };
    stepSecs.forEach((s, i) => push("BUILD", slot, s.head.replace(/^Step\s+\d+\s*·\s*/i, ""),
      `I am on Project ${p.n}, Day ${d.n} (day ${d.local} of the ${p.id} plan), working through "${s.head}". Walk me through it, explaining what each file and tool is for and how data flows, building in small pieces and running something after each. Quiz me on the why before moving on.`, s.body));
    for (const k of keep) push(k.kind, parseInt(k.time.slice(-5, -3)) * 60 + parseInt(k.time.slice(-2)) - (parseInt(k.time.slice(0, 2)) * 60 + parseInt(k.time.slice(3, 5))) || 45, k.text, k.coach, k.tutorial);
    d.steps = out;
  }
}

// ── Project briefs: crash-course/projects/<id>.md → public/projects/<id>.md ──
const briefDir = path.join(ROOT, "public", "projects");
fs.mkdirSync(briefDir, { recursive: true });
for (const p of projects) {
  const src = path.join(ROOT, "crash-course", "projects", `${p.id}.md`);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(briefDir, `${p.id}.md`)); p.brief = `/projects/${p.id}.md`; }
}

// Applications list: "## Austin applications …" (older plans) or the bullets
// under "# Application strategy while building" (current plan).
let applications = [];
let appIdx = lines.findIndex(l => l.startsWith("## Austin applications"));
if (appIdx < 0) {
  const st = lines.findIndex(l => l.startsWith("# Application strategy"));
  if (st >= 0) for (let j = st + 1; j < lines.length && !lines[j].startsWith("# "); j++) {
    const b = lines[j].match(/^-\s+(.+)$/); if (b) applications.push(strip(b[1]));
  }
}
if (appIdx >= 0) {
  let s = ""; let j = appIdx + 1;
  while (j < lines.length && !lines[j].startsWith("## ")) { s += " " + lines[j]; j++; }
  applications = s.split("·").map(x => strip(x)).map(x => x.replace(/^\d+\.\s*/, "")).filter(x => /—|\(/.test(x) && x.length < 90);
}

const days = projects.flatMap(p => p.days);
const out = {
  // No generation timestamp on purpose: the output is a pure function of
  // PORTFOLIO.md, so a rebuild that changes nothing produces an identical file
  // and never dirties the tree or conflicts on merge. A clock-based stamp did
  // both; a source-commit-date stamp still went stale the moment it was
  // committed alongside the source it described. Git already records when this
  // was generated, and the app never read the field.
  title, summary, start_date: START_DATE, total_days: days.length,
  projects, applications,
  // Compatibility shape for the app's existing "crash course" day logic.
  crash_course: { title, summary, start_date: START_DATE, project: projects.map(p => p.id).join(" → "),
    days: days.map(d => ({ n: d.n, week: d.week, title: `${projects[d.week - 1]?.id}: ${d.title}`, build: d.build, drill: d.run, done: d.done, checked: d.checked })) },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`portfolio.json: ${projects.length} projects, ${days.length} days (${days.filter(d => d.checked).length} checked), ${applications.length} applications`);
if (projects.length === 0) console.warn("WARN: no projects parsed — check the '## Final portfolio' table in PORTFOLIO.md");
for (const p of projects) if (p.days.length === 0) console.warn(`WARN: ${p.id} has no day plan yet (expected crash-course/${p.id.toUpperCase().replace(/-/g, "_")}_3_WEEK_PLAN.md)`);
