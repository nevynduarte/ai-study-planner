import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Reactive dark-mode hook — subscribes to OS theme changes so the UI updates
// without a page reload. The boolean is still needed in App for hexA() alphas
// and linkC; CSS custom properties handle everything else.
function useDark() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const [dark, setDark] = useState(mq.matches);
  useEffect(() => {
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}

// slug + text-extraction helpers shared by the document reader (TOC anchors).
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
const nodeText = (c) => Array.isArray(c) ? c.map(nodeText).join("")
  : (typeof c === "string" || typeof c === "number") ? String(c)
  : (c && c.props && c.props.children) ? nodeText(c.props.children) : "";
const READER_ACCENT = { aaru: "#1D9E75", equi: "#7F77DD" };

// ─── DocReader ─────────────────────────────────────────────────────────────
// Full-screen "Word-doc" reader for a prep guide: a centered paper page with
// serif document typography, a sticky table-of-contents rail built from the
// markdown headings, and a top reading-progress bar. Opened from the
// Interviews tab; Esc or the backdrop closes it.
function DocReader({ iv, md, onClose }) {
  const accent = READER_ACCENT[iv.id] || "#185FA5";
  const bodyRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const wide = vw >= 860;
  const loading = md === undefined;

  // Table of contents parsed straight from the markdown heading lines.
  const toc = useMemo(() => {
    if (!md) return [];
    const out = [];
    for (const line of md.split("\n")) {
      const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (m) { const text = m[2].replace(/\*\*/g, "").replace(/`/g, "").trim(); out.push({ level: m[1].length, text, id: slugify(text) }); }
    }
    return out;
  }, [md]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";           // lock background scroll
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
  };
  const goTo = (id) => {
    const el = bodyRef.current && bodyRef.current.querySelector(`#${CSS.escape(id)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // paper palette — kept light in both themes for an authentic document feel.
  const SER = 'Georgia, "Times New Roman", serif';
  const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
  const paper = "#fbfbf8", ink = "#1d1d1b", inkSoft = "#56544f", rule = "rgba(0,0,0,0.11)";
  const head = (size, mt) => ({ id: undefined, fontFamily: SER, color: ink, lineHeight: 1.25, margin: mt, fontWeight: 700, fontSize: size });

  const D = {
    h1: ({ children }) => <h1 id={slugify(nodeText(children))} style={{ ...head(27, "4px 0 16px"), letterSpacing: -0.4, lineHeight: 1.2 }}>{children}</h1>,
    h2: ({ children }) => <h2 id={slugify(nodeText(children))} style={{ ...head(20, "32px 0 10px"), borderBottom: `1px solid ${rule}`, paddingBottom: 6 }}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(nodeText(children))} style={head(15.5, "24px 0 6px")}>{children}</h3>,
    p: (p) => <p style={{ margin: "0 0 13px", lineHeight: 1.78, fontSize: 15.5, color: ink }} {...p} />,
    ul: (p) => <ul style={{ margin: "0 0 13px", paddingLeft: 24, lineHeight: 1.75, fontSize: 15.5, color: ink }} {...p} />,
    ol: (p) => <ol style={{ margin: "0 0 13px", paddingLeft: 24, lineHeight: 1.75, fontSize: 15.5, color: ink }} {...p} />,
    li: (p) => <li style={{ margin: "4px 0" }} {...p} />,
    strong: (p) => <strong style={{ fontWeight: 700 }} {...p} />,
    a: (p) => <a style={{ color: "#1a5fb4", textDecoration: "underline", textUnderlineOffset: 2, wordBreak: "break-word" }} target="_blank" rel="noreferrer" {...p} />,
    hr: () => <hr style={{ border: "none", borderTop: `1px solid ${rule}`, margin: "24px 0" }} />,
    code: (p) => <code style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 13, background: "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: 4 }} {...p} />,
    pre: (p) => <pre style={{ background: "rgba(0,0,0,0.045)", padding: "13px 15px", borderRadius: 8, overflowX: "auto", fontSize: 12.5, lineHeight: 1.5, margin: "0 0 15px", border: `1px solid ${rule}` }} {...p} />,
    blockquote: (p) => <blockquote style={{ margin: "0 0 14px", padding: "2px 0 2px 16px", borderLeft: `3px solid ${accent}`, color: inkSoft, fontStyle: "italic" }} {...p} />,
    table: (p) => <div style={{ overflowX: "auto", margin: "0 0 16px" }}><table style={{ borderCollapse: "collapse", fontSize: 14, width: "100%" }} {...p} /></div>,
    th: (p) => <th style={{ textAlign: "left", padding: "7px 11px", borderBottom: `2px solid ${rule}`, fontWeight: 700, fontFamily: SER }} {...p} />,
    td: (p) => <td style={{ padding: "7px 11px", borderBottom: `1px solid ${rule}`, verticalAlign: "top" }} {...p} />,
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,20,22,0.62)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "center", alignItems: "stretch", padding: wide ? 24 : 0, boxSizing: "border-box" }}>
      <div style={{ position: "fixed", top: 0, left: 0, height: 3, width: `${progress}%`, background: accent, zIndex: 1002, transition: "width .1s linear" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ background: paper, color: ink, width: "100%", maxWidth: 1040, height: "100%", borderRadius: wide ? 12 : 0, overflow: "hidden", boxShadow: "0 12px 64px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", fontFamily: SER }}>

        {/* sticky header bar */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${rule}`, background: "rgba(251,251,248,0.94)" }}>
          <div style={{ minWidth: 0, fontFamily: SANS, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: accent, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{iv.company} — Full prep guide</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, fontFamily: SANS }}>
            <a href={iv.guide_md} download style={{ fontSize: 12, color: inkSoft, textDecoration: "none", border: `1px solid ${rule}`, borderRadius: 7, padding: "5px 10px" }}>⤓ .md</a>
            <button onClick={onClose} style={{ fontSize: 12.5, cursor: "pointer", border: `1px solid ${rule}`, background: "#fff", color: ink, borderRadius: 7, padding: "5px 12px" }}>Close ✕</button>
          </div>
        </div>

        {/* scroll body: TOC rail + paper page */}
        <div ref={bodyRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center" }}>
          {wide && toc.length > 0 && (
            <nav style={{ width: 250, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 0, maxHeight: "100%", overflowY: "auto", padding: "40px 16px 60px 24px", borderRight: `1px solid ${rule}`, fontFamily: SANS }}>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.7, color: inkSoft, marginBottom: 11, fontWeight: 700 }}>Contents</div>
              {toc.map((t, i) => (
                <button key={i} onClick={() => goTo(t.id)} title={t.text}
                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: `3px 0 3px ${(t.level - 1) * 12}px`, fontSize: t.level === 1 ? 12.5 : 12, color: t.level === 1 ? ink : inkSoft, fontWeight: t.level === 1 ? 600 : 400, lineHeight: 1.45 }}>
                  {t.text}
                </button>
              ))}
            </nav>
          )}
          <article style={{ flex: 1, maxWidth: 760, minWidth: 0, padding: wide ? "48px 60px 100px" : "28px 20px 80px" }}>
            {loading
              ? <div style={{ fontFamily: SANS, color: inkSoft, fontSize: 14 }}>Loading guide…</div>
              : <ReactMarkdown remarkPlugins={[remarkGfm]} components={D}>{md}</ReactMarkdown>}
          </article>
        </div>
      </div>
    </div>
  );
}

// hex (#rgb or #rrggbb) → rgba() string at the given alpha. Used to tint
// pills from their accent color instead of using bright pastel fills.
const hexA = (hex, a) => {
  const h = (hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return `rgba(0,0,0,${a})`;
  const f = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
};

// ─── Data layer — reads/writes the Cloudflare Worker (D1) + static curriculum ──
async function getJSON(path) {
  const r = await fetch(path);
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "Failed to load");
  return d;
}
async function postJSON(path, body) {
  const r = await fetch(path, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "Request failed");
  return d;
}

// ─── Helpers ──────────────────────────────────────────────────────
const todayFmt = () => new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
const fmtDate  = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "";
const fmtTs    = (ts)  => ts ? new Date(ts).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }) : "";
const roiColor = (s) => s >= 85 ? "#185FA5" : s >= 75 ? "#3B6D11" : s >= 65 ? "#BA7517" : "#A32D2D";

// Skill-coverage status → color + short label.
const COV = {
  "not-started":     { label:"·",  bg:"#ECECEC", text:"#888888", border:"#D8D8D8", dot:"#BBBBBB" },
  "learning":        { label:"◑",  bg:"#FAEEDA", text:"#633806", border:"#BA7517", dot:"#BA7517" },
  "built":           { label:"●",  bg:"#E6F1FB", text:"#0C447C", border:"#185FA5", dot:"#185FA5" },
  "interview-ready": { label:"★",  bg:"#EAF3DE", text:"#3B6D11", border:"#639922", dot:"#639922" },
};
const covOf = (m, track, skill) => m[`${track}:::${skill}`] || "not-started";

// Single-user, client-side persisted UI state (localStorage). Used for toggles
// the static curriculum + D1 don't model: crash-day completion, archived
// interviews, papers marked read. Falls back to `initial` if storage is empty
// or unavailable, and ignores write errors (private mode / quota).
function usePersisted(key, initial) {
  const [val, setVal] = useState(() => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// Daily study commitment. 3 focused hours/day (21h/week) — a realistic pace.
// Per-track hours derive from each track's weight, so this is the only knob.
const DAILY_HOURS   = 3;
const WEEKLY_TARGET = DAILY_HOURS * 7;

export default function App() {
  const [tab,     setTab]     = useState("today");
  const [data,    setData]    = useState(null);
  const [cur,     setCur]     = useState(null);   // curriculum.json
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  // Log-session form
  const [logH, setLogH] = useState(""); const [logT, setLogT] = useState("");
  const [logTr, setLogTr] = useState(""); const [logN, setLogN] = useState(""); const [logMsg, setLogMsg] = useState("");
  // Tutor question form
  const [q, setQ] = useState(""); const [asking, setAsking] = useState(false); const [askMsg, setAskMsg] = useState("");
  // Interview prep — accordion + on-demand full-guide fetch
  const [expandedAreas, setExpandedAreas] = useState(new Set());
  const toggleArea = (key) => setExpandedAreas(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const [guideMd,   setGuideMd]   = useState({});  // id -> markdown string
  const [readerIv,  setReaderIv]  = useState(null); // interview whose guide is open in the doc reader
  // Client-side persisted toggles
  const [completedDays, setCompletedDays] = usePersisted("asp.crash.completed", []); // crash-course day numbers done
  const [archivedIvs,   setArchivedIvs]   = usePersisted("asp.iv.archived", []);     // explicitly archived interview ids
  const [activatedIvs,  setActivatedIvs]  = usePersisted("asp.iv.activated", []);    // dormant roles the user pulled back out of the archive
  const [readPapers,    setReadPapers]    = usePersisted("asp.papers.read", []);     // research paper ids read
  const [planChecked,   setPlanChecked]   = usePersisted("asp.plan.checked", {});    // { [planDate]: [checked item labels] }
  const [solvedProblems,setSolvedProblems]= usePersisted("asp.practice.solved", []); // practice problem ids solved
  const [practiceSec,   setPracticeSec]   = useState(null);                          // selected practice section id
  const toggleCrashDay = (n) => setCompletedDays(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  const toggleSolved   = (id) => setSolvedProblems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const archiveIv      = (id) => { setArchivedIvs(prev => prev.includes(id) ? prev : [...prev, id]); setActivatedIvs(prev => prev.filter(x => x !== id)); };
  const reactivateIv   = (id) => { setArchivedIvs(prev => prev.filter(x => x !== id)); setActivatedIvs(prev => prev.includes(id) ? prev : [...prev, id]); };
  const togglePaper    = (id) => setReadPapers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const openGuide = async (iv) => {
    setReaderIv(iv);
    if (guideMd[iv.id] === undefined && iv.guide_md) {
      try { const r = await fetch(iv.guide_md); const t = await r.text(); setGuideMd(p => ({ ...p, [iv.id]: t })); }
      catch { setGuideMd(p => ({ ...p, [iv.id]: "_Could not load the full guide._" })); }
    }
  };

  const load = useCallback(async () => {
    try {
      setErr("");
      const [d, c] = await Promise.all([
        getJSON("/api/data"),
        getJSON("/curriculum.json").catch(() => null),
      ]);
      setData(d);
      if (c) setCur(c);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const status    = data?.status || {};
  const log       = data?.log || [];
  const questions = data?.questions || [];
  const plan      = data?.plan || null;
  const frontier  = data?.frontier || null;
  const advisory  = data?.advisory || null;
  const tracks    = cur?.tracks || {};
  const trackIds  = Object.keys(tracks);

  // Per-track current month (status.tracks is stored as a JSON string in D1).
  let trackPos = {};
  try { trackPos = typeof status.tracks === "string" ? JSON.parse(status.tracks) : (status.tracks || {}); } catch { trackPos = {}; }
  const monthOf = (id) => Number(trackPos[id]?.current_month) || 1;
  const monthData = (id) => (tracks[id]?.months || []).find(m => m.n === monthOf(id)) || (tracks[id]?.months || [])[0] || {};

  // Coverage lookup map.
  const covMap = {};
  for (const r of data?.coverage || []) covMap[`${r.track}:::${r.skill}`] = r.status;

  const totalHrs = log.reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - (now.getDay() || 7) + 1); monday.setHours(0,0,0,0);
  const weekLog = log.filter(e => new Date(e.date + "T12:00:00") >= monday);
  const weekHrs = weekLog.reduce((s, e) => s + Number(e.hours), 0);
  const weekHrsByTrack = (id) => weekLog.filter(e => e.track === id).reduce((s, e) => s + Number(e.hours), 0);
  const weekColor = weekHrs >= WEEKLY_TARGET ? "#1D9E75" : weekHrs >= WEEKLY_TARGET*0.7 ? "#185FA5" : weekHrs >= WEEKLY_TARGET*0.4 ? "#BA7517" : "#A32D2D";
  const startDays = status.started_date ? Math.max(1, Math.round((now - new Date(status.started_date + "T12:00:00")) / 864e5) + 1) : null;

  // ─── Interview scheduling: prep windows + study pushback ──────────
  // When an interview is within its prep window, the day is "prep" or
  // "interview" — regular track study is deferred and resumes the day after
  // the last interview in the contiguous cluster.
  const DAY_MS = 864e5;
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const daysBetween = (a,b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
  const today0 = startOfDay(now);
  // Archived interviews are "done" — they drop out of scheduling (no prep/focus
  // mode, no calendar markers) but stay reactivatable from the Archive section.
  // Roles flagged `dormant` in the curriculum (e.g. Woodline, D.E. Shaw) start
  // archived; explicit user archive/reactivate overrides that default.
  const archivedExplicit = new Set(archivedIvs);
  const activatedExplicit = new Set(activatedIvs);
  const isArchived = (iv) => archivedExplicit.has(iv.id) ? true : (iv.dormant && !activatedExplicit.has(iv.id));
  const interviews = (cur?.interviews || [])
    .filter(iv => !isArchived(iv))
    .map(iv => ({ ...iv, _date: new Date(iv.date + "T09:00:00") }))
    .sort((a,b) => a._date - b._date);

  const classifyDay = (d) => {
    const day0 = startOfDay(typeof d === "string" ? new Date(d + "T12:00:00") : d);
    for (const iv of interviews) if (daysBetween(day0, iv._date) === 0) return { type:"interview", iv };
    for (const iv of interviews) {
      const lead = daysBetween(day0, iv._date);            // >0 → day0 is before the interview
      if (lead > 0 && lead <= (iv.prep_window_days || 3)) return { type:"prep", iv };
    }
    return { type:"study" };
  };
  // Day after the last interview in the cluster the given interview belongs to.
  const resumeDateFor = (iv) => {
    if (!iv) return null;
    let last = iv;
    for (const c of interviews)
      if (c._date > last._date && daysBetween(last._date, c._date) <= (last.prep_window_days || 3)) last = c;
    const r = new Date(last._date); r.setDate(r.getDate() + 1); r.setHours(0,0,0,0); return r;
  };
  const upcomingIvs = interviews.filter(iv => daysBetween(today0, iv._date) >= 0);
  const nextIv      = upcomingIvs[0] || null;
  const todayClass  = classifyDay(today0);
  const focusMode   = todayClass.type === "interview" || todayClass.type === "prep";
  const focusIv     = todayClass.iv || nextIv;
  const resumeDate  = focusMode ? resumeDateFor(focusIv) : null;

  // ─── Crash course: a 2-week intensive sprint that overrides regular track
  // study. Day N is derived from start_date; covers a 14-day window. ────────
  const CRASH_AC    = "#0D9488";
  const crashCourse = cur?.crash_course || null;
  const crashDays   = crashCourse?.days || [];
  const crashStart  = crashCourse?.start_date ? startOfDay(new Date(crashCourse.start_date + "T12:00:00")) : null;
  // Progression is completion-driven, not calendar-driven: an unfinished day
  // rolls forward instead of being lost. "Today" is always the first day not
  // yet marked complete, once the sprint has started.
  const crashDone     = new Set(completedDays);
  const crashStarted  = !!crashStart && today0 >= crashStart;
  const orderedDays   = [...crashDays].sort((a,b) => a.n - b.n);
  const remainingDays = orderedDays.filter(d => !crashDone.has(d.n));
  const crashToday    = crashStarted ? (remainingDays[0] || null) : null;
  const crashActive   = crashToday != null;
  const crashAllDone  = crashDays.length > 0 && remainingDays.length === 0;
  // Calendar projection: each remaining day lands on a successive calendar day
  // from today (or the start date if the sprint hasn't begun), so skipped days
  // visibly push the whole schedule forward.
  const crashProjBase = crashStart && today0 < crashStart ? crashStart : today0;
  const crashProjFor  = (d) => {
    if (!remainingDays.length) return null;
    const off = daysBetween(crashProjBase, startOfDay(d));
    return off >= 0 && off < remainingDays.length ? remainingDays[off] : null;
  };
  const tracksPaused = focusMode || crashActive;

  async function logSession() {
    if (!logT || !logH || parseFloat(logH) <= 0) { setLogMsg("Enter topic and hours."); return; }
    try {
      await postJSON("/api/log", { hours: parseFloat(logH), topic: logT, track: logTr || null, notes: logN });
      setLogH(""); setLogT(""); setLogN("");
      setLogMsg(`Logged ${logH}h${logTr ? ` · ${tracks[logTr]?.name}` : ""}`); setTimeout(() => setLogMsg(""), 3000);
      load();
    } catch (e) { setLogMsg("Error: " + e.message); }
  }

  async function askQuestion() {
    if (!q.trim() || asking) return;
    setAsking(true); setAskMsg("");
    try {
      await postJSON("/api/ask", { question: q.trim() });
      setQ(""); setAskMsg("Saved. P620 will answer on its next hourly run."); setTimeout(() => setAskMsg(""), 6000);
      load();
    } catch (e) { setAskMsg("Error: " + e.message); }
    finally { setAsking(false); }
  }

  // ─── Design tokens — CSS custom properties from src/tokens.css ──────────────
  // Surface/text/border/shadow values are CSS vars; the browser resolves them
  // from the :root declarations in tokens.css (light) and its dark-mode block.
  // `dark` stays as a JS boolean for hexA() alphas and linkC (which needs hex).
  const dark       = useDark();
  const bg         = "var(--asp-bg)";
  const surface    = "var(--asp-surface)";
  const surface2   = "var(--asp-surface2)";
  const bgS        = "var(--asp-bg-subtle)";
  const txt        = "var(--asp-text)";
  const txtS       = "var(--asp-text-soft)";
  const txtT       = "var(--asp-text-tertiary)";
  const brd        = "var(--asp-border)";
  const brdS       = "var(--asp-border-strong)";
  const shadowCard = "var(--asp-shadow-card)";
  const shadowPop  = "var(--asp-shadow-pop)";
  const FONT = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";

  const S = {
    card:   { background:surface, border:`1px solid ${brd}`, borderRadius:16, padding:"1.05rem 1.15rem", marginBottom:"0.8rem", boxShadow:shadowCard },
    tab:    (a) => ({ fontSize:13, fontWeight:a?600:500, padding:"7px 14px", borderRadius:999, background:a?surface:"transparent", border:"none", cursor:"pointer", color:a?txt:txtT, whiteSpace:"nowrap", transition:"all .15s", boxShadow:a?shadowCard:"none" }),
    btn:    (p, dis) => ({ fontSize:13, fontWeight:p?600:500, padding:"8px 15px", borderRadius:10, cursor:dis?"not-allowed":"pointer", border:p?"1px solid transparent":`1px solid ${brdS}`, opacity:dis?0.5:1, background:p?txt:"transparent", color:p?bg:txt, transition:"all .15s" }),
    inp:    { fontSize:13, padding:"9px 12px", borderRadius:10, border:`1px solid ${brdS}`, background:surface, color:txt, width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
    lbl:    { fontSize:10.5, color:txtT, marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:0.6, fontWeight:600 },
    statBg: { background:bgS, borderRadius:10, padding:"10px 14px" },
    roiBadge:(s) => pill(roiColor(s)),
    stamp:  { fontSize:11, color:txtT },
  };
  // A muted accent pill: a low-opacity tint of the accent color rather than a
  // saturated pastel fill, so it reads softly in both light and dark mode.
  const pill = (accent, extra) => ({
    fontSize:11, padding:"3px 9px", borderRadius:999, fontWeight:600, whiteSpace:"nowrap", letterSpacing:0.1,
    background:hexA(accent, dark ? 0.18 : 0.10),
    color:accent,
    border:`1px solid ${hexA(accent, dark ? 0.32 : 0.22)}`,
    ...extra,
  });
  // Vibrant filled track chip — solid track color, white label. Used wherever
  // a track needs to read at a glance.
  const trackBadge = (id) => ({
    fontSize:11, fontWeight:600, letterSpacing:0.2, padding:"3px 11px", borderRadius:999,
    color:"#fff", background:tracks[id]?.color?.border || brdS, whiteSpace:"nowrap", display:"inline-block",
  });

  // Time-aware greeting for the header.
  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const greetIcon = hr < 12 ? "☀️" : hr < 18 ? "🌤️" : "🌙";

  // SVG progress ring — used for per-track weekly balance and overall pace.
  const Ring = ({ pct, color, size = 46, stroke = 5, label }) => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, pct || 0));
    return (
      <svg width={size} height={size} style={{ display:"block" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={hexA(color, dark?0.22:0.14)} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c*(1-p/100)} transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition:"stroke-dashoffset .5s ease" }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size>40?12:10} fontWeight={700} fill={color}>{label ?? Math.round(p)}</text>
      </svg>
    );
  };

  // Markdown renderer for P620-generated content (briefings, frontier,
  // advisory, tutor answers). Styled to match the app's typography instead
  // of dumping raw markdown source into a <pre>.
  const linkC = dark ? "#9DBEFF" : "#1f5fc4";
  const mdComponents = {
    h1: (p) => <div style={{ fontSize:17, fontWeight:700, letterSpacing:-0.2, margin:"18px 0 8px", color:txt }} {...p} />,
    h2: (p) => <div style={{ fontSize:14.5, fontWeight:700, margin:"16px 0 6px", color:txt }} {...p} />,
    h3: (p) => <div style={{ fontSize:11.5, fontWeight:700, color:txtT, textTransform:"uppercase", letterSpacing:0.5, margin:"14px 0 5px" }} {...p} />,
    p:  (p) => <p style={{ margin:"0 0 10px", lineHeight:1.72, color:txtS }} {...p} />,
    ul: (p) => <ul style={{ margin:"0 0 10px", paddingLeft:20, lineHeight:1.7, color:txtS }} {...p} />,
    ol: (p) => <ol style={{ margin:"0 0 10px", paddingLeft:20, lineHeight:1.7, color:txtS }} {...p} />,
    li: (p) => <li style={{ margin:"3px 0", paddingLeft:2 }} {...p} />,
    strong: (p) => <strong style={{ fontWeight:700, color:txt }} {...p} />,
    em: (p) => <em style={{ fontStyle:"italic" }} {...p} />,
    a:  (p) => <a style={{ color:linkC, textDecoration:"underline", textUnderlineOffset:2, textDecorationThickness:"1px", wordBreak:"break-word" }} target="_blank" rel="noreferrer" {...p} />,
    hr: () => <hr style={{ border:"none", borderTop:`1px solid ${brd}`, margin:"14px 0" }} />,
    code: (p) => <code style={{ fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace", fontSize:12, background:bgS, padding:"1.5px 6px", borderRadius:6, border:`1px solid ${brd}` }} {...p} />,
    pre: (p) => <pre style={{ background:bgS, border:`1px solid ${brd}`, borderRadius:10, padding:"12px 14px", overflowX:"auto", fontSize:12, lineHeight:1.55, margin:"0 0 12px" }} {...p} />,
    blockquote: (p) => <blockquote style={{ margin:"0 0 12px", padding:"4px 0 4px 14px", borderLeft:`3px solid ${hexA(linkC,0.5)}`, color:txtS, fontStyle:"italic" }} {...p} />,
    table: (p) => <div style={{ overflowX:"auto", margin:"0 0 12px", border:`1px solid ${brd}`, borderRadius:10 }}><table style={{ borderCollapse:"collapse", fontSize:12.5, width:"100%" }} {...p} /></div>,
    th: (p) => <th style={{ textAlign:"left", padding:"7px 10px", borderBottom:`1px solid ${brdS}`, background:bgS, fontWeight:700, fontSize:11.5 }} {...p} />,
    td: (p) => <td style={{ padding:"7px 10px", borderBottom:`1px solid ${brd}`, verticalAlign:"top" }} {...p} />,
  };
  const Md = ({ children, components }) => (
    <div style={{ fontSize:13.5, color:txt }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components || mdComponents}>{children}</ReactMarkdown>
    </div>
  );

  // ── Today's-plan checklist ──────────────────────────────────────────────
  // The plan is freeform markdown from P620. We make every list item tappable:
  // checked state is keyed by (plan date → item label) so it persists per day
  // and resets when a fresh plan lands. A markdown variant renders each <li>
  // as an interactive checkbox instead of a bullet.
  const planDate = plan?.date || "";
  const planCheckedSet = new Set(planChecked[planDate] || []);
  const togglePlanItem = (label) => setPlanChecked(prev => {
    const cur = new Set(prev[planDate] || []);
    cur.has(label) ? cur.delete(label) : cur.add(label);
    return { ...prev, [planDate]: [...cur] };
  });
  // Count items so the card can show progress (regex-extracted to mirror the
  // plain-text labels the renderer produces).
  const planItemLabels = (plan?.content || "").split("\n")
    .filter(l => /^\s*([-*+]|\d+[.)])\s+/.test(l))
    .map(l => l.replace(/^\s*([-*+]|\d+[.)])\s+/, "").replace(/^\[[ xX]\]\s*/, "").replace(/[*`]/g, "").trim())
    .filter(Boolean);
  const planTotal = planItemLabels.length;
  const planDone  = planItemLabels.filter(l => planCheckedSet.has(l)).length;
  const planMd = {
    ...mdComponents,
    ul: (p) => <ul style={{ margin:"0 0 10px", paddingLeft:0, listStyle:"none" }} {...p} />,
    ol: (p) => <ol style={{ margin:"0 0 10px", paddingLeft:0, listStyle:"none" }} {...p} />,
    li: ({ children }) => {
      const arr = (Array.isArray(children) ? children : [children]).filter(c => c != null && c !== "");
      // Drop the disabled checkbox react-markdown emits for GFM task items.
      const parts = arr.filter(c => !(c && c.props && c.props.type === "checkbox"));
      const label = nodeText(parts).trim();
      if (!label) return <li style={{ margin:"3px 0", paddingLeft:2 }}>{children}</li>;
      const checked = planCheckedSet.has(label);
      return (
        <li style={{ listStyle:"none", margin:"5px 0", display:"flex", gap:9, alignItems:"flex-start" }}>
          <button onClick={() => togglePlanItem(label)} role="checkbox" aria-checked={checked} aria-label={label}
            style={{ flexShrink:0, marginTop:1, width:18, height:18, borderRadius:5, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700, lineHeight:1,
              border:`1.5px solid ${checked ? "#1D9E75" : brdS}`, background:checked ? "#1D9E75" : surface, color:checked ? "#fff" : "transparent" }}>
            ✓
          </button>
          <span style={{ lineHeight:1.6, color:checked ? txtT : txtS, textDecoration:checked ? "line-through" : "none", textDecorationColor:hexA("#1D9E75",0.7) }}>{parts}</span>
        </li>
      );
    },
  };

  const TAB_LABELS = {};
  const TABS = ["today","interviews","plan","calendar","tutor","research","practice","frontier","advisory","coverage","log"];

  // Small read-only card for P620-generated content with a freshness stamp.
  // `accent` tints the title dot + a soft gradient header strip.
  const ContentCard = ({ title, sub, item, empty, accent = "#185FA5", components }) => (
    <div style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${accent}` }}>
      <div style={{ padding:"1rem 1.125rem", background:`linear-gradient(125deg, ${hexA(accent, dark?0.15:0.08)}, transparent 70%)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:item?.content?10:6 }}>
          <div>
            <div style={{ fontSize:13.5, fontWeight:600, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ width:8, height:8, borderRadius:3, background:accent, display:"inline-block" }} />{title}
            </div>
            <div style={{ ...S.stamp, marginLeft:15 }}>{sub}</div>
          </div>
          <div style={S.stamp}>{item?.generated_at ? `Updated ${fmtTs(item.generated_at)} · P620` : "Awaiting P620"}</div>
        </div>
        {item?.content ? <Md components={components}>{item.content}</Md> : <div style={{ fontSize:13, color:txtT, marginLeft:15 }}>{empty}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:FONT, color:txt }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:"1.4rem" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.6, lineHeight:1.1, display:"flex", alignItems:"center", gap:9 }}>
            <span style={{ fontSize:20 }}>{greetIcon}</span>
            <span>{greeting}, Nevyn</span>
          </div>
          <div style={{ fontSize:12.5, color:txtT, marginTop:6, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span>{todayFmt()}</span>
            <span style={{ width:3, height:3, borderRadius:2, background:txtT, display:"inline-block" }} />
            <span>{trackIds.length || 4} tracks</span>
            {startDays && <><span style={{ width:3, height:3, borderRadius:2, background:txtT, display:"inline-block" }} /><span>Day {startDays}</span></>}
          </div>
        </div>
        <button aria-label="Refresh" title="Refresh" style={{ ...S.btn(false, loading), width:38, height:38, padding:0, borderRadius:11, fontSize:15, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={load} disabled={loading}>{loading?"…":"↻"}</button>
      </div>

      {err && (
        <div style={{ background:hexA("#E24B4A", dark?0.16:0.09), border:`1px solid ${hexA("#E24B4A", dark?0.4:0.3)}`, borderRadius:12, padding:"11px 15px", marginBottom:"0.9rem", fontSize:13, color:dark?"#FF9B9B":"#9b1c1c" }}>
          {err} — is the D1 binding configured on the Worker?
        </div>
      )}

      {/* Tabs — segmented, horizontally scrollable */}
      <div style={{ display:"flex", gap:2, marginBottom:"1.4rem", overflowX:"auto", padding:4, background:bgS, border:`1px solid ${brd}`, borderRadius:999 }}>
        {TABS.map(t => <button key={t} style={S.tab(tab===t)} onClick={() => setTab(t)}>{TAB_LABELS[t] || (t.charAt(0).toUpperCase()+t.slice(1))}</button>)}
      </div>

      {/* ── INTERVIEWS ── */}
      {tab==="interviews" && (() => {
        const allIvs = cur?.interviews || [];
        const activeIvs    = allIvs.filter(iv => !isArchived(iv));
        const archivedList = allIvs.filter(iv => isArchived(iv));
        return (
        <div>
          {!allIvs.length && (
            <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>No interviews loaded from curriculum.json yet.</div>
          )}
          {allIvs.length > 0 && activeIvs.length === 0 && (
            <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>All interviews archived — reactivate one from the Archive below.</div>
          )}
          {activeIvs.map((iv, idx) => {
            const ac = ({ aaru:"#1D9E75", equi:"#7F77DD" })[iv.id] || ["#185FA5","#BA7517","#1D9E75","#7F77DD"][idx%4];
            const hasDate = !!iv.date;
            const daysLeft = hasDate ? Math.ceil((new Date(iv.date + "T09:00:00") - new Date()) / 864e5) : null;
            const urgency = hasDate ? (daysLeft <= 1 ? "#A32D2D" : daysLeft <= 2 ? "#BA7517" : ac) : ac;
            const chip = (extra) => ({ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:999, color:"#fff", background:ac, whiteSpace:"nowrap", display:"inline-block", ...extra });
            // Section wrapper: accent tick + uppercase eyebrow + scroll anchor.
            const sec = (key, label, child) => (
              <div id={`sec-${iv.id}-${key}`} style={{ marginBottom:18, scrollMarginTop:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
                  <span style={{ width:3, height:12, borderRadius:2, background:ac, display:"inline-block" }} />
                  <span style={{ ...S.lbl, margin:0 }}>{label}</span>
                </div>
                {child}
              </div>
            );
            const nav = [
              ["rounds","Rounds", iv.rounds?.length>0],
              ["stack","Stack", (iv.stack||[]).length>0],
              ["fit","Your fit", (iv.your_strengths||[]).length>0],
              ["beats","Story beats", (iv.story_beats||[]).length>0],
              ["prep","Prep", (iv.prep_areas||[]).length>0],
              ["questions","Likely Qs", (iv.likely_questions||[]).length>0],
              ["bank","Story bank", iv.behavioral_bank?.length>0],
              ["ask","Ask them", iv.questions_to_ask?.length>0],
              ["terms","Domain", iv.domain_terms?.length>0],
              ["practice","Practice", iv.practice?.length>0],
              ["checklist","Checklist", iv.final_checklist?.length>0],
            ].filter(x => x[2]);
            const jump = (key) => { const el = document.getElementById(`sec-${iv.id}-${key}`); if (el) el.scrollIntoView({ behavior:"smooth", block:"start" }); };
            return (
              <div key={iv.id} style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${ac}`, marginBottom:"1.25rem" }}>

                {/* header */}
                <div style={{ padding:"1.1rem 1.2rem 0.95rem", background:`linear-gradient(125deg, ${hexA(ac, dark?0.2:0.11)}, transparent 72%)` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:5, flexWrap:"wrap" }}>
                        <span style={{ fontSize:20, fontWeight:800, letterSpacing:-0.5 }}>{iv.company}</span>
                        <span style={chip()}>{iv.day}</span>
                      </div>
                      <div style={{ fontSize:13.5, color:txt, fontWeight:600 }}>{iv.role}</div>
                      <div style={{ fontSize:12, color:txtT, marginTop:3, display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                        <span>{iv.location}</span>
                        <span style={{ width:3, height:3, borderRadius:2, background:txtT, display:"inline-block" }} />
                        <span>{iv.salary}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flexShrink:0 }}>
                      <div style={{ textAlign:"center", padding:"8px 15px", borderRadius:14, background:hexA(urgency, dark?0.2:0.12), border:`1px solid ${hexA(urgency, dark?0.34:0.24)}` }}>
                        {hasDate
                          ? <><div style={{ fontSize:30, fontWeight:800, color:urgency, lineHeight:1, letterSpacing:-1 }}>{daysLeft > 0 ? daysLeft : 0}<span style={{ fontSize:13, fontWeight:700 }}>d</span></div>
                              <div style={{ fontSize:10.5, color:txtT, marginTop:4 }}>{fmtDate(iv.date)}</div></>
                          : <div style={{ fontSize:13, fontWeight:700, color:urgency }}>Role</div>}
                      </div>
                      <button onClick={() => archiveIv(iv.id)} title="Mark this interview done and move it to the archive"
                        style={{ fontSize:11, fontWeight:600, padding:"4px 11px", borderRadius:8, cursor:"pointer", border:`1px solid ${brdS}`, background:surface, color:txtS, whiteSpace:"nowrap" }}>
                        Archive ✓
                      </button>
                    </div>
                  </div>
                  {nav.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:13 }}>
                      {nav.map(([key,label]) => (
                        <button key={key} onClick={() => jump(key)} style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:999, cursor:"pointer", border:`1px solid ${brd}`, background:surface, color:txtS }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding:"1.1rem 1.2rem 1.2rem" }}>
                  {iv.about && <div style={{ fontSize:12.5, color:txtS, lineHeight:1.7, marginBottom:18, paddingBottom:16, borderBottom:`1px solid ${brd}` }}>{iv.about}</div>}

                  {iv.rounds?.length > 0 && sec("rounds", "Expected rounds",
                    <div>
                      {iv.rounds.map((r,i,arr) => (
                        <div key={r.n} style={{ display:"flex", gap:12, position:"relative", paddingBottom:i<arr.length-1?14:0 }}>
                          {i<arr.length-1 && <span style={{ position:"absolute", left:12, top:27, bottom:0, width:2, background:hexA(ac,0.28) }} />}
                          <span style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, background:ac, color:"#fff", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>{r.n}</span>
                          <div style={{ minWidth:0, paddingTop:3 }}>
                            <div style={{ fontSize:13, fontWeight:600 }}>{r.title}</div>
                            <div style={{ fontSize:11.5, color:txtS, lineHeight:1.5, marginTop:2 }}>{r.format}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(iv.stack||[]).length > 0 && sec("stack", "Stack to know",
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {(iv.stack||[]).map(s => <span key={s} style={pill(ac, { fontSize:12 })}>{s}</span>)}
                    </div>
                  )}

                  {(iv.your_strengths||[]).length > 0 && sec("fit", "Your fit — lead with these",
                    <div style={{ background:hexA(ac, dark?0.1:0.06), border:`1px solid ${hexA(ac, dark?0.24:0.16)}`, borderRadius:12, padding:"2px 13px" }}>
                      {iv.your_strengths.map((s,i) => (
                        <div key={i} style={{ fontSize:12.5, color:txtS, padding:"8px 0", lineHeight:1.55, display:"flex", gap:9, borderBottom:i<iv.your_strengths.length-1?`1px solid ${hexA(ac,0.18)}`:"none" }}>
                          <span style={{ color:ac, fontWeight:700, flexShrink:0 }}>✓</span><span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(iv.story_beats||[]).length > 0 && sec("beats", "Story beats — weave these in",
                    <div>
                      {iv.story_beats.map((s,i) => (
                        <div key={i} style={{ fontSize:12.5, color:txtS, lineHeight:1.6, background:bgS, borderRadius:10, borderLeft:`3px solid ${ac}`, padding:"9px 13px", marginBottom:6 }}>{s}</div>
                      ))}
                    </div>
                  )}

                  {(iv.prep_areas||[]).length > 0 && sec("prep", "Prep areas — click to expand",
                    <div>
                      {iv.prep_areas.map(pa => {
                        const key = `${iv.id}:${pa.area}`;
                        const open = expandedAreas.has(key);
                        return (
                          <div key={pa.area} style={{ border:`1px solid ${open ? hexA(ac,0.5) : brd}`, borderRadius:10, marginBottom:6, overflow:"hidden", transition:"border-color .15s" }}>
                            <button onClick={() => toggleArea(key)} style={{ width:"100%", textAlign:"left", padding:"10px 13px", background:open?hexA(ac,dark?0.12:0.06):"transparent", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", color:txt }}>
                              <span style={{ fontSize:13, fontWeight:600 }}>{pa.area}</span>
                              <span style={{ fontSize:11, color:open?ac:txtT, marginLeft:8, transform:open?"rotate(180deg)":"none", transition:"transform .15s" }}>▾</span>
                            </button>
                            {open && (
                              <div style={{ padding:"2px 13px 11px", borderTop:`1px solid ${brd}` }}>
                                {(pa.items||[]).map((item,i) => (
                                  <div key={i} style={{ fontSize:12, color:txtS, padding:"6px 0", lineHeight:1.6, display:"flex", gap:8 }}>
                                    <span style={{ color:ac, flexShrink:0 }}>•</span><span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(iv.likely_questions||[]).length > 0 && sec("questions", "Likely questions — prep out loud",
                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                      {iv.likely_questions.map((lq,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                          <span style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, background:hexA(ac,dark?0.22:0.12), color:ac, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>{i+1}</span>
                          <span style={{ fontSize:12.5, color:txtS, lineHeight:1.55 }}>{lq}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {iv.behavioral_bank?.length > 0 && sec("bank", "Story bank — prompt → which story",
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {iv.behavioral_bank.map((b,i) => (
                        <div key={i} style={{ background:bgS, borderRadius:10, padding:"10px 13px" }}>
                          <div style={{ fontSize:12.5, fontWeight:600, marginBottom:4 }}>{b.prompt}</div>
                          <div style={{ fontSize:11.5, color:txtS, lineHeight:1.55, paddingLeft:10, borderLeft:`2px solid ${ac}` }}>{b.story}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {iv.questions_to_ask?.length > 0 && sec("ask", "Questions to ask them",
                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                      {iv.questions_to_ask.map((qa,i) => (
                        <div key={i} style={{ fontSize:12.5, color:txtS, lineHeight:1.55, display:"flex", gap:9, alignItems:"flex-start" }}>
                          <span style={pill(ac, { flexShrink:0 })}>{qa.round}</span><span>{qa.q}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {iv.domain_terms?.length > 0 && sec("terms", "Domain terms — know these cold",
                    <div style={{ background:hexA(ac, dark?0.08:0.05), border:`1px solid ${hexA(ac, dark?0.2:0.14)}`, borderRadius:12, padding:"2px 13px" }}>
                      {iv.domain_terms.map((dt,i) => (
                        <div key={i} style={{ fontSize:12.5, color:txtS, padding:"8px 0", lineHeight:1.55, borderBottom:i<iv.domain_terms.length-1?`1px solid ${hexA(ac,0.16)}`:"none" }}>
                          <strong style={{ color:txt }}>{dt.term}</strong> — {dt.def}
                        </div>
                      ))}
                    </div>
                  )}

                  {iv.practice?.length > 0 && sec("practice", "Practice — build cold, timed",
                    <div>
                      {iv.practice.map((p,i) => (
                        <div key={i} style={{ border:`1px solid ${brd}`, borderRadius:10, padding:"10px 13px", marginBottom:6, background:surface2 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                            <span style={{ fontSize:12.5, fontWeight:600 }}>{p.title}</span>
                            <span style={pill(ac, { padding:"1px 8px" })}>{p.type}</span>
                          </div>
                          <div style={{ fontSize:11.5, color:txtS, lineHeight:1.55 }}>{p.desc}</div>
                          {p.path && <div style={{ fontSize:11, color:txtT, marginTop:5, fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace", background:bgS, padding:"3px 7px", borderRadius:6, display:"inline-block" }}>{p.path}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {iv.final_checklist?.length > 0 && sec("checklist", "Final checklist",
                    <div>
                      {iv.final_checklist.map((c,i) => (
                        <div key={i} style={{ fontSize:12.5, color:txtS, padding:"4px 0", lineHeight:1.5, display:"flex", gap:9 }}>
                          <span style={{ color:ac, flexShrink:0 }}>☐</span><span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Full guide — opens the document reader */}
                  {iv.guide_md && (
                    <button onClick={() => openGuide(iv)} style={{ width:"100%", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, cursor:"pointer", marginTop:4, padding:"12px 14px", borderRadius:12, border:`1px solid ${hexA(ac, dark?0.34:0.24)}`, background:hexA(ac, dark?0.12:0.07), color:txt }}>
                      <span style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                        <span style={{ fontSize:17 }}>📖</span>
                        <span style={{ minWidth:0 }}>
                          <span style={{ fontSize:13, fontWeight:600, display:"block" }}>Open full prep guide</span>
                          <span style={{ fontSize:11, color:txtT }}>Document reader — contents, progress, download</span>
                        </span>
                      </span>
                      <span style={{ fontSize:12, fontWeight:700, color:ac, flexShrink:0 }}>Read →</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}

          {/* Archive — completed interviews, reactivatable */}
          {archivedList.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ ...S.lbl, margin:"0 0 8px 2px" }}>Archive — {archivedList.length} done</div>
              {archivedList.map(iv => {
                const ac = ({ aaru:"#1D9E75", equi:"#7F77DD" })[iv.id] || "#185FA5";
                return (
                  <div key={iv.id} style={{ ...S.card, marginBottom:"0.6rem", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap", opacity:0.85 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ width:8, height:8, borderRadius:2, background:ac, display:"inline-block", flexShrink:0 }} />
                        {iv.company}
                        <span style={pill("#888888", { padding:"1px 8px" })}>done</span>
                      </div>
                      <div style={{ fontSize:11.5, color:txtT, marginTop:3 }}>{iv.role}{iv.date ? ` · ${fmtDate(iv.date)}` : iv.location ? ` · ${iv.location}` : ""}</div>
                    </div>
                    <button onClick={() => reactivateIv(iv.id)} style={{ ...S.btn(false), fontSize:12, flexShrink:0 }}>↩ Reactivate</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* ── TODAY ── */}
      {tab==="today" && (
        <div>
          {/* Interview-focus mode — regular study deferred until interviews clear */}
          {focusMode && focusIv && (() => {
            const isDay = todayClass.type === "interview";
            const fc = isDay ? "#A32D2D" : "#BA7517";
            const lead = daysBetween(today0, focusIv._date);
            const resumeStr = resumeDate && resumeDate.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
            return (
              <div style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${fc}`, marginBottom:"0.875rem" }}>
                <div style={{ padding:"1rem 1.125rem", background:`linear-gradient(125deg, ${hexA(fc, dark?0.2:0.11)}, transparent 72%)` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:14.5, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
                        <span>🎯</span>{isDay ? `Interview day — ${focusIv.company}` : "Interview focus mode"}
                      </div>
                      <div style={{ fontSize:12.5, color:txtS, marginTop:5, lineHeight:1.6 }}>
                        Regular study is paused. {isDay
                          ? `Today is your ${focusIv.company} interview (${focusIv.role}).`
                          : <>{focusIv.company} is in <strong style={{ color:fc }}>{lead} day{lead===1?"":"s"}</strong> ({focusIv.day}, {fmtDate(focusIv.date)}) — give the day to prep.</>}
                        {resumeStr && ` Normal track study resumes ${resumeStr}.`}
                      </div>
                    </div>
                    <button style={S.btn(true)} onClick={() => setTab("interviews")}>Open prep →</button>
                  </div>
                  {focusIv.final_checklist?.length > 0 && (
                    <div style={{ marginTop:13 }}>
                      <div style={{ ...S.lbl, marginBottom:6 }}>Final prep checklist — {focusIv.company}</div>
                      {focusIv.final_checklist.map((c,i) => (
                        <div key={i} style={{ fontSize:12, color:txtS, padding:"3px 0", lineHeight:1.5 }}>
                          <span style={{ marginRight:8, color:fc }}>☐</span>{c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Crash-course day — the active 2-week sprint */}
          {crashActive && (
            <div style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${CRASH_AC}`, marginBottom:"0.875rem" }}>
              <div style={{ padding:"1rem 1.125rem", background:`linear-gradient(125deg, ${hexA(CRASH_AC, dark?0.2:0.11)}, transparent 72%)` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:14.5, fontWeight:700, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span>⚡</span>Crash course · Day {crashToday.n} of {crashDays.length}
                      <span style={pill(CRASH_AC, { padding:"1px 8px" })}>Week {crashToday.week}</span>
                    </div>
                    <div style={{ fontSize:13.5, fontWeight:600, marginTop:6 }}>{crashToday.title}</div>
                    <div style={{ fontSize:12.5, color:txtS, marginTop:4, lineHeight:1.6 }}><strong style={{ color:txt }}>Build:</strong> {crashToday.build}</div>
                    <div style={{ fontSize:12, color:txtS, marginTop:3, lineHeight:1.6 }}><strong style={{ color:txt }}>Drill:</strong> {crashToday.drill} &nbsp;·&nbsp; <strong style={{ color:txt }}>Done when:</strong> {crashToday.done}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
                    <button style={S.btn(true)} onClick={() => toggleCrashDay(crashToday.n)}>✓ Mark done</button>
                    <button style={S.btn(false)} onClick={() => setTab("plan")}>Full plan →</button>
                  </div>
                </div>
                <div style={{ fontSize:11, color:txtT, padding:"0 1.125rem 0.9rem", lineHeight:1.5 }}>
                  Don't finish today? It stays here tomorrow — days roll forward as you complete them, they're never skipped.
                </div>
              </div>
            </div>
          )}

          {/* Sprint finished — tracks resume */}
          {crashAllDone && !focusMode && (
            <div style={{ ...S.card, borderLeft:`3px solid ${CRASH_AC}`, marginBottom:"0.875rem", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                <span>✅</span>Crash course complete — all {crashDays.length} days done. Regular track study has resumed.
              </div>
              <button style={S.btn(false)} onClick={() => setTab("plan")}>Review sprint →</button>
            </div>
          )}

          <ContentCard
            title="Today's plan"
            sub={planTotal > 0 ? `Checklist · ${planDone}/${planTotal} done · tap to check off` : `Weighted across your tracks · ${DAILY_HOURS}h/day · generated 6am ET`}
            item={plan}
            accent="#1D9E75"
            components={planMd}
            empty={`P620 writes a focused, track-weighted ${DAILY_HOURS}-hour plan here every morning at 6am ET.`}
          />

          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>Log a study session</div>
            <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:8, marginBottom:8 }}>
              <input type="number" min="0.5" max="16" step="0.5" value={logH} onChange={e=>setLogH(e.target.value)} placeholder="Hours" style={S.inp} />
              <input type="text" value={logT} onChange={e=>setLogT(e.target.value)} placeholder="Topic — be specific (e.g. 'Implemented multi-head attention')" style={S.inp} />
            </div>
            <select value={logTr} onChange={e=>setLogTr(e.target.value)} style={{ ...S.inp, marginBottom:8 }}>
              <option value="">Track — which one? (optional)</option>
              {trackIds.map(id => <option key={id} value={id}>{tracks[id].name}</option>)}
            </select>
            <textarea value={logN} onChange={e=>setLogN(e.target.value)} placeholder="Notes — what clicked, what didn't (optional)" style={{ ...S.inp, resize:"vertical", minHeight:52, lineHeight:1.6 }} />
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
              <button style={S.btn(true)} onClick={logSession}>Log session</button>
              {logMsg && <span style={{ fontSize:12, color:"#3B6D11" }}>{logMsg}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── CALENDAR (next 30 days) ── */}
      {tab==="calendar" && (
        <div>
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Next 30 days</div>
            <div style={{ fontSize:12, color:txtT, lineHeight:1.55 }}>Study &amp; work plan at a glance — the 2-week crash course and interview days take priority; regular track study resumes after.</div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:11 }}>
              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:txtS }}><span style={{ width:11, height:11, borderRadius:3, background:"#A32D2D", display:"inline-block" }} />Interview</span>
              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:txtS }}><span style={{ width:11, height:11, borderRadius:3, background:"#BA7517", display:"inline-block" }} />Prep</span>
              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:txtS }}><span style={{ width:11, height:11, borderRadius:3, background:"#0D9488", display:"inline-block" }} />Crash course</span>
              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:txtS }}>
                <span style={{ display:"flex", gap:2 }}>{trackIds.map(id => <span key={id} style={{ width:6, height:6, borderRadius:2, background:tracks[id]?.color?.border||brdS, display:"inline-block" }} />)}</span>
                Study ({trackIds.length || 4} tracks)
              </span>
            </div>
          </div>

          {(() => {
            const ivAccent = (iv) => ({ aaru:"#1D9E75", equi:"#7F77DD" })[iv?.id] || "#185FA5";
            const gridStart = new Date(today0); gridStart.setDate(gridStart.getDate() - gridStart.getDay());
            const end = new Date(today0); end.setDate(end.getDate() + 29);
            const cells = Math.ceil((daysBetween(gridStart, end) + 1) / 7) * 7;
            const dows = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            return (
              <div style={S.card}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5 }}>
                  {dows.map(d => <div key={d} style={{ fontSize:10, color:txtT, textAlign:"center", paddingBottom:3, fontWeight:500 }}>{d}</div>)}
                  {Array.from({ length:cells }).map((_, i) => {
                    const d = new Date(gridStart); d.setDate(d.getDate() + i); d.setHours(0,0,0,0);
                    const off = daysBetween(today0, d);
                    const inRange = off >= 0 && off <= 29;
                    const isToday = off === 0;
                    const dnum = d.getDate();
                    if (!inRange) return <div key={i} style={{ minHeight:60, borderRadius:8, border:`1px solid ${brd}`, opacity:0.3, padding:"5px 7px", fontSize:11, color:txtT }}>{dnum}</div>;
                    const cls = classifyDay(d);
                    let cellBg = surface, cellBrd = brd, body = null, numColor = txtS;
                    if (cls.type === "interview") {
                      const a = ivAccent(cls.iv); cellBg = a; cellBrd = a; numColor = "#fff";
                      body = <div style={{ marginTop:3 }}><div style={{ fontSize:11, fontWeight:700, color:"#fff" }}>🎯 {cls.iv.company}</div><div style={{ fontSize:9.5, color:"rgba(255,255,255,0.85)" }}>interview</div></div>;
                    } else if (cls.type === "prep") {
                      const a = ivAccent(cls.iv); cellBg = hexA(a, dark?0.2:0.12); cellBrd = hexA(a, dark?0.34:0.24);
                      body = <div style={{ marginTop:3 }}><div style={{ fontSize:10.5, fontWeight:700, color:dark?a:"#8a5a10" }}>Prep</div><div style={{ fontSize:9.5, color:txtT }}>{cls.iv.company}</div></div>;
                    } else if (crashProjFor(d)) {
                      const cd = crashProjFor(d); cellBg = hexA(CRASH_AC, dark?0.18:0.1); cellBrd = hexA(CRASH_AC, dark?0.34:0.24);
                      body = <div style={{ marginTop:3 }}><div style={{ fontSize:10.5, fontWeight:700, color:CRASH_AC }}>CC · Day {cd.n}</div><div style={{ fontSize:9, color:txtT, lineHeight:1.25, maxHeight:23, overflow:"hidden" }}>{cd.title}</div></div>;
                    } else {
                      body = <div style={{ marginTop:6, display:"flex", gap:3, flexWrap:"wrap" }}>{trackIds.map(id => <span key={id} style={{ width:7, height:7, borderRadius:2, background:tracks[id]?.color?.border||brdS }} />)}</div>;
                    }
                    return (
                      <div key={i} style={{ minHeight:60, borderRadius:8, border:`${isToday?1.5:0.5}px solid ${isToday?txt:cellBrd}`, background:cellBg, padding:"5px 7px", overflow:"hidden" }}>
                        <div style={{ fontSize:11, fontWeight:isToday?700:500, color:numColor }}>{dnum}{isToday ? " · today" : ""}</div>
                        {body}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── PLAN (progress · crash course · roadmap) ── */}
      {tab==="plan" && (
        <div>
          {/* Progress overview */}
          <div style={{ ...S.lbl, margin:"0 0 8px 2px" }}>This week · {DAILY_HOURS}h/day target</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:"0.875rem" }}>
            {[["Total hours",totalHrs,"#1D9E75"],["This week",`${weekHrs}`,"#185FA5",`/ ${WEEKLY_TARGET}h`],["Day",startDays||"—","#7F77DD"],["Sessions",log.length,"#BA7517"]].map(([l,v,ac,suf]) => (
              <div key={l} style={{ borderRadius:14, padding:"12px 14px", background:`linear-gradient(155deg, ${hexA(ac, dark?0.24:0.14)}, ${hexA(ac, dark?0.08:0.05)})`, border:`1px solid ${hexA(ac, dark?0.34:0.2)}`, boxShadow:shadowCard }}>
                <div style={{ fontSize:10, color:txtT, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>{l}</div>
                <div style={{ fontSize:24, fontWeight:800, color:ac, lineHeight:1, letterSpacing:-0.6 }}>{v}<span style={{ fontSize:11, fontWeight:600, color:txtT, marginLeft:3 }}>{suf}</span></div>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:"0.875rem", display:"flex", alignItems:"center", gap:16 }}>
            <Ring pct={weekHrs/WEEKLY_TARGET*100} color={weekColor} size={58} stroke={6} />
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>Weekly progress</span>
                <span style={{ fontSize:12, color:txtT }}>{weekHrs}h of {WEEKLY_TARGET}h</span>
              </div>
              <div style={{ height:8, borderRadius:5, background:bgS, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,weekHrs/WEEKLY_TARGET*100)}%`, borderRadius:5, background:"linear-gradient(90deg, #1D9E75, #185FA5, #7F77DD, #BA7517)" }} />
              </div>
              <div style={{ fontSize:12, color:txtT, marginTop:6 }}>{Math.max(0,WEEKLY_TARGET-weekHrs).toFixed(1)}h remaining this week</div>
            </div>
          </div>

          {/* Per-track focus + weekly balance */}
          <div style={{ fontSize:11, color:txtT, margin:"0 0 8px 2px" }}>
            {focusMode
              ? `Tracks paused for interview prep${resumeDate ? ` — resume ${resumeDate.toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" })}` : ""}`
              : crashActive
              ? "Tracks paused — running the 2-week crash course (months-long plan resumes after)"
              : "Active tracks — weights, current month, this week's balance"}
          </div>
          {trackIds.map(id => {
            const t = tracks[id]; const md = monthData(id);
            const target = (t.weight || 0) * WEEKLY_TARGET; const got = weekHrsByTrack(id);
            const pct = target ? Math.min(100, got/target*100) : 0;
            const ac = t.color?.border || brdS;
            return (
              <div key={id} style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${ac}`, opacity:tracksPaused?0.6:1 }}>
                <div style={{ display:"flex", gap:14, padding:"0.875rem 1rem", background:`linear-gradient(120deg, ${hexA(ac, dark?0.16:0.09)}, transparent 75%)` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                      <span style={trackBadge(id)}>{t.name}</span>
                      {tracksPaused && <span style={pill("#888888", { padding:"1px 7px" })}>⏸ paused</span>}
                      <span style={{ fontSize:11, color:txtT }}>{Math.round((t.weight||0)*100)}% · ~{((t.weight||0)*DAILY_HOURS).toFixed(1)}h/day</span>
                      <span style={{ ...S.roiBadge(md.roi||75), marginLeft:"auto" }}>ROI {md.roi||"—"}</span>
                    </div>
                    <div style={{ fontSize:13.5, fontWeight:600, marginBottom:2 }}>Month {monthOf(id)} — {md.title}</div>
                    <div style={{ fontSize:12, color:txtS, lineHeight:1.55 }}>{md.focus}</div>
                    <div style={{ fontSize:11, color:txtT, marginTop:8 }}>{got.toFixed(1)}h this week · target ~{target.toFixed(1)}h</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <Ring pct={pct} color={ac} size={50} stroke={5} />
                    <div style={{ fontSize:9.5, color:txtT, marginTop:4 }}>of target</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Crash course */}
          <div style={{ ...S.lbl, margin:"22px 0 8px 2px" }}>2-week crash course</div>
          {!crashCourse && <div style={{ fontSize:13, color:txtT, padding:"0.25rem 0.25rem 0.75rem" }}>No crash course configured in curriculum.json.</div>}
          {crashCourse && (
            <>
              <div style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${CRASH_AC}` }}>
                <div style={{ padding:"1rem 1.125rem", background:`linear-gradient(125deg, ${hexA(CRASH_AC, dark?0.18:0.1)}, transparent 72%)` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:16, fontWeight:700, letterSpacing:-0.2, display:"flex", alignItems:"center", gap:8 }}><span>⚡</span>{crashCourse.title}</div>
                      <div style={{ fontSize:12.5, color:txtS, marginTop:5, lineHeight:1.6, maxWidth:580 }}>{crashCourse.summary}</div>
                      {crashCourse.project && <div style={{ fontSize:11, color:txtT, marginTop:6, fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace" }}>{crashCourse.project}</div>}
                    </div>
                    {crashActive
                      ? <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, color:"#fff", background:CRASH_AC, whiteSpace:"nowrap" }}>Day {crashToday.n} / {crashDays.length}</span>
                      : <span style={pill(CRASH_AC)}>{crashAllDone ? "Complete ✓" : crashStart && today0 < crashStart ? `Starts ${fmtDate(crashCourse.start_date)}` : "Not started"}</span>}
                  </div>
                  <div style={{ fontSize:11, color:txtT, marginTop:9 }}>{crashDone.size} of {crashDays.length} days complete · tick days off as you finish — unfinished days roll forward.</div>
                  {crashCourse.pillars?.length > 0 && (
                    <div style={{ marginTop:13 }}>
                      <div style={{ ...S.lbl, marginBottom:6 }}>Covers</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {crashCourse.pillars.map((p,i) => <span key={i} style={pill(CRASH_AC, { fontSize:12 })}>{p}</span>)}
                      </div>
                    </div>
                  )}
                  {crashCourse.not_doing?.length > 0 && (
                    <div style={{ fontSize:11.5, color:txtT, marginTop:11, lineHeight:1.6 }}>
                      <strong style={{ color:txtS }}>Not doing:</strong> {crashCourse.not_doing.join(" · ")}
                    </div>
                  )}
                </div>
              </div>

              {[1,2].map(wk => (
                <div key={wk}>
                  <div style={{ fontSize:11, color:txtT, margin:"14px 0 6px 2px", fontWeight:600, letterSpacing:0.3 }}>WEEK {wk}{wk===1?" — DATA + AI CORE":" — FULL-STACK + DESIGN + PROOF"}</div>
                  {crashDays.filter(d => d.week === wk).map(d => {
                    const isDone  = crashDone.has(d.n);
                    const isToday = crashToday?.n === d.n;
                    return (
                      <div key={d.n} style={{ ...S.card, marginBottom:"0.5rem", padding:0, overflow:"hidden",
                          borderLeft:`3px solid ${isToday?CRASH_AC:isDone?hexA(CRASH_AC,0.5):brd}`, opacity:isDone && !isToday?0.6:1 }}>
                        <div style={{ display:"flex", gap:12, padding:"0.8rem 1rem", alignItems:"flex-start", background:isToday?`linear-gradient(120deg, ${hexA(CRASH_AC, dark?0.18:0.1)}, transparent 78%)`:"transparent" }}>
                          <div style={{ flexShrink:0, width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", background:isDone||isToday?CRASH_AC:hexA(CRASH_AC,0.45) }}>{isDone?"✓":d.n}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span style={{ fontSize:13.5, fontWeight:600 }}>{d.title}</span>
                              {isToday && <span style={pill(CRASH_AC, { padding:"1px 7px" })}>today</span>}
                            </div>
                            <div style={{ fontSize:12, color:txtS, lineHeight:1.6, marginTop:3 }}><strong style={{ color:txt }}>Build:</strong> {d.build}</div>
                            <div style={{ fontSize:11.5, color:txtS, lineHeight:1.6, marginTop:2 }}><strong style={{ color:txt }}>Drill:</strong> {d.drill} &nbsp;·&nbsp; <strong style={{ color:txt }}>Done:</strong> {d.done}</div>
                          </div>
                          <button onClick={() => toggleCrashDay(d.n)} title={isDone?"Mark not done":"Mark done"}
                            style={{ flexShrink:0, alignSelf:"center", fontSize:11, fontWeight:600, padding:"5px 11px", borderRadius:8, cursor:"pointer", whiteSpace:"nowrap",
                              border:`1px solid ${isDone?hexA(CRASH_AC,0.4):brdS}`, background:isDone?hexA(CRASH_AC, dark?0.18:0.1):surface, color:isDone?CRASH_AC:txtS }}>
                            {isDone ? "✓ Done" : "Mark done"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          {/* 12-month roadmap */}
          <div style={{ ...S.lbl, margin:"22px 0 8px 2px" }}>12-month roadmap</div>
          {trackIds.map(id => {
            const t = tracks[id];
            return (
              <div key={id} style={{ marginBottom:"1.25rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 8px 2px", flexWrap:"wrap" }}>
                  <span style={trackBadge(id)}>{t.name}</span>
                  <span style={{ fontSize:12, color:txtT }}>{Math.round((t.weight||0)*100)}% of day · {t.summary}</span>
                </div>
                {(t.months||[]).map(mo => {
                  const ac = t.color?.border || brdS;
                  const active = mo.n === monthOf(id);
                  const done = mo.n < monthOf(id);
                  return (
                    <div key={mo.n} style={{ ...S.card, marginBottom:"0.5rem", padding:0, overflow:"hidden",
                        borderLeft:`3px solid ${active?ac:done?hexA(ac,0.5):brd}`, opacity:done?0.62:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"0.875rem 1rem",
                          background:active?`linear-gradient(120deg, ${hexA(ac, dark?0.18:0.1)}, transparent 78%)`:"transparent" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                            <span style={{ fontSize:11, color:txtT, minWidth:54 }}>Month {mo.n}</span>
                            {active && <span style={trackBadge(id)}>active</span>}
                            {done && <span style={{ fontSize:11, color:ac, fontWeight:600 }}>✓ done</span>}
                          </div>
                          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{mo.title}</div>
                          <div style={{ fontSize:12, color:txtS, lineHeight:1.55 }}>{mo.focus}</div>
                        </div>
                        <span style={{ ...S.roiBadge(mo.roi), marginLeft:12, whiteSpace:"nowrap" }}>ROI {mo.roi}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TUTOR ── */}
      {tab==="tutor" && (
        <div>
          <div style={{ ...S.card, borderLeft:`3px solid #185FA5`, background:`linear-gradient(125deg, ${hexA("#185FA5", dark?0.13:0.07)}, ${bg} 65%)` }}>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ width:8, height:8, borderRadius:3, background:"#185FA5", display:"inline-block" }} />Ask your tutor
            </div>
            <div style={{ ...S.stamp, marginBottom:10, marginLeft:15 }}>Knows all 4 tracks, your coverage, log, and target roles. P620 answers on its next hourly run.</div>
            <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Type a question across any track…" style={{ ...S.inp, resize:"vertical", minHeight:80, lineHeight:1.6 }} disabled={asking} />
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
              <button style={S.btn(true, asking || !q.trim())} onClick={askQuestion} disabled={asking || !q.trim()}>{asking?"Saving…":"Ask →"}</button>
              {askMsg && <span style={{ fontSize:12, color:"#3B6D11" }}>{askMsg}</span>}
            </div>
          </div>

          {questions.length === 0 && <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>No questions yet. Ask your first above.</div>}
          {questions.map(item => (
            <div key={item.id} style={{ ...S.card, borderLeft:`3px solid ${item.answer ? "#1D9E75" : "#BA7517"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{item.question}</div>
                <span style={{ ...S.stamp, whiteSpace:"nowrap" }}>{fmtDate(item.date)}</span>
              </div>
              {item.answer
                ? <div style={{ borderTop:`1px solid ${brd}`, paddingTop:10 }}><Md>{item.answer}</Md></div>
                : <div style={{ fontSize:12, color:"#BA7517" }}>⏳ Pending — P620 will answer on its next hourly run.</div>}
              {item.answer && item.answered_at && <div style={{ ...S.stamp, marginTop:8 }}>Answered {fmtTs(item.answered_at)} · P620</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── FRONTIER (read-only) ── */}
      {tab==="frontier" && (
        <div>
          <ContentCard
            title="Frontier digest"
            sub="Web search — one finding per track + a wildcard"
            item={frontier}
            accent="#7F77DD"
            empty="P620 sweeps each track's frontier every morning and writes the digest here."
          />
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>Weekly rhythm</div>
            <div style={{ fontSize:13, color:txtS, lineHeight:1.75 }}>
              <strong>Monday</strong> — Scan READ NOW items per track.{"\n\n"}
              <strong>Wednesday</strong> — Deep-read one paper. Log it. Ask the Tutor to explain anything confusing.{"\n\n"}
              <strong>Friday</strong> — Ask the Tutor: "Should any finding this week change a track's plan?"
            </div>
          </div>
        </div>
      )}

      {/* ── RESEARCH (curated reading list) ── */}
      {tab==="research" && (() => {
        const papers = [...(cur?.research || [])].sort((a,b) => (a.year||0) - (b.year||0));
        const readCount = papers.filter(p => readPapers.includes(p.id)).length;
        const catColor = { Foundational:"#185FA5", LLMs:"#1D9E75", "RAG & Retrieval":"#7F77DD", Agents:"#BA7517", Evaluation:"#A35BBA", "Data Integration":"#0D9488", Efficiency:"#A32D2D", Vision:"#C2410C", "Sequence & Attention":"#185FA5", Generative:"#BE185D", "Representation Learning":"#0D9488", Optimization:"#3B6D11" };
        return (
        <div>
          <div style={{ ...S.card, borderLeft:`3px solid #7F77DD`, background:`linear-gradient(125deg, ${hexA("#7F77DD", dark?0.13:0.07)}, ${bg} 65%)` }}>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ width:8, height:8, borderRadius:3, background:"#7F77DD", display:"inline-block" }} />Papers to read
            </div>
            <div style={{ ...S.stamp, marginLeft:15, lineHeight:1.6 }}>The highest-leverage papers behind your tracks and target roles. Read the summary here; open the paper only when you want to go deep.{papers.length>0 ? ` ${readCount} of ${papers.length} read.` : ""}</div>
          </div>

          {papers.length === 0 && <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>No papers in curriculum.json yet.</div>}

          {papers.map(p => {
            const ac = catColor[p.tag] || tracks[p.track]?.color?.border || "#185FA5";
            const isRead = readPapers.includes(p.id);
            return (
              <div key={p.id} style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${ac}`, opacity:isRead?0.7:1 }}>
                <div style={{ padding:"1rem 1.125rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:6 }}>
                        {p.tag && <span style={pill(ac, { fontSize:11 })}>{p.tag}</span>}
                        {p.track && tracks[p.track] && <span style={trackBadge(p.track)}>{tracks[p.track].name}</span>}
                      </div>
                      <div style={{ fontSize:14.5, fontWeight:700, letterSpacing:-0.2, lineHeight:1.3 }}>{p.title}</div>
                      <div style={{ fontSize:11.5, color:txtT, marginTop:3 }}>{p.authors}{p.year ? ` · ${p.year}` : ""}</div>
                    </div>
                    {isRead && <span style={{ fontSize:11, color:ac, fontWeight:700, flexShrink:0 }}>✓ read</span>}
                  </div>
                  {p.why && <div style={{ fontSize:12.5, color:txtS, lineHeight:1.6, marginTop:10 }}><strong style={{ color:txt }}>Why it matters:</strong> {p.why}</div>}
                  {p.summary && <div style={{ fontSize:12.5, color:txtS, lineHeight:1.7, marginTop:8 }}>{p.summary}</div>}
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:12, flexWrap:"wrap" }}>
                    <button onClick={() => togglePaper(p.id)} style={{ ...S.btn(!isRead), fontSize:12 }}>{isRead ? "↩ Mark unread" : "✓ Mark read"}</button>
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ ...S.btn(false), fontSize:12, textDecoration:"none", display:"inline-block" }}>Read paper ↗</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* ── PRACTICE (problem banks: DSA, SQL, DS/ML, system design, quant, behavioral) ── */}
      {tab==="practice" && (() => {
        const sections = cur?.practice?.sections || [];
        if (!sections.length) return <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>No practice bank in curriculum.json yet.</div>;
        const sel = sections.find(s => s.id === practiceSec) || sections[0];
        const pid  = (p) => p.u || slugify(p.n);
        const purl = (p) => p.u ? `https://leetcode.com/problems/${p.u}/` : (p.url || null);
        const allP = (s) => (s.groups || []).flatMap(g => g.problems || []);
        const doneIn = (s) => allP(s).filter(p => solvedProblems.includes(pid(p))).length;
        const diffMeta = { E:["Easy","#3B6D11"], M:["Med","#BA7517"], H:["Hard","#A32D2D"] };
        const ac = sel.accent || "#185FA5";
        const total = allP(sel).length, done = doneIn(sel);
        return (
        <div>
          {/* section selector */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {sections.map(s => {
              const on = s.id === sel.id; const sac = s.accent || "#185FA5";
              return (
                <button key={s.id} onClick={() => setPracticeSec(s.id)}
                  style={{ fontSize:12, fontWeight:600, padding:"6px 12px", borderRadius:999, cursor:"pointer", border:`1px solid ${on?sac:brd}`, background:on?hexA(sac,dark?0.2:0.1):surface, color:on?sac:txtS, whiteSpace:"nowrap" }}>
                  {s.title} <span style={{ opacity:0.65, fontWeight:500 }}>{doneIn(s)}/{allP(s).length}</span>
                </button>
              );
            })}
          </div>

          {/* section header */}
          <div style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${ac}` }}>
            <div style={{ padding:"1rem 1.125rem", background:`linear-gradient(125deg, ${hexA(ac, dark?0.16:0.09)}, transparent 72%)`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:700, letterSpacing:-0.2 }}>{sel.title}</div>
                {sel.note && <div style={{ fontSize:12, color:txtS, marginTop:5, lineHeight:1.6, maxWidth:620 }}>{sel.note}</div>}
                {sel.ref && <a href={sel.ref} target="_blank" rel="noreferrer" style={{ fontSize:11.5, color:linkC, textDecoration:"none", marginTop:7, display:"inline-block" }}>Reference ↗</a>}
                {(sel.resources || []).length > 0 && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ ...S.lbl, marginBottom:6 }}>Resources</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {sel.resources.map(r => (
                        <a key={r.url} href={r.url} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, fontWeight:600, color:ac, textDecoration:"none", padding:"3px 9px", borderRadius:999, border:`1px solid ${hexA(ac, dark?0.34:0.24)}`, background:hexA(ac, dark?0.1:0.06), whiteSpace:"nowrap" }}>{r.name} ↗</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ textAlign:"center", flexShrink:0 }}>
                <Ring pct={total?done/total*100:0} color={ac} size={52} stroke={5} />
                <div style={{ fontSize:10, color:txtT, marginTop:4 }}>{done}/{total} done</div>
              </div>
            </div>
          </div>

          {/* groups */}
          {(sel.groups || []).map(g => {
            const probs = g.problems || [];
            const gDone = probs.filter(p => solvedProblems.includes(pid(p))).length;
            return (
              <div key={g.name} style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{g.name}</div>
                  <div style={{ fontSize:11, color:txtT }}>{gDone}/{probs.length}</div>
                </div>
                {probs.map((p,i) => {
                  const id = pid(p); const solved = solvedProblems.includes(id); const url = purl(p); const dm = diffMeta[p.d];
                  return (
                    <div key={id} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 0", borderBottom:i<probs.length-1?`1px solid ${brd}`:"none" }}>
                      <button onClick={() => toggleSolved(id)} role="checkbox" aria-checked={solved} aria-label={p.n}
                        style={{ flexShrink:0, width:18, height:18, borderRadius:5, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, lineHeight:1,
                          border:`1.5px solid ${solved?ac:brdS}`, background:solved?ac:surface, color:solved?"#fff":"transparent" }}>✓</button>
                      <span style={{ flex:1, minWidth:0, fontSize:12.5, lineHeight:1.5, color:solved?txtT:txt, textDecoration:solved?"line-through":"none", textDecorationColor:hexA(ac,0.6) }}>
                        {p.s ? <span title="Blind 75" style={{ color:"#BA7517", marginRight:5 }}>★</span> : null}
                        {url ? <a href={url} target="_blank" rel="noreferrer" style={{ color:"inherit", textDecoration:"none" }}>{p.n}</a> : p.n}
                      </span>
                      {dm && <span style={{ fontSize:10.5, fontWeight:600, color:dm[1], background:hexA(dm[1],dark?0.18:0.1), border:`1px solid ${hexA(dm[1],dark?0.3:0.2)}`, padding:"2px 8px", borderRadius:999, flexShrink:0 }}>{dm[0]}</span>}
                      {url && <a href={url} target="_blank" rel="noreferrer" title="Open" style={{ fontSize:12, color:txtT, textDecoration:"none", flexShrink:0 }}>↗</a>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* ── ADVISORY (read-only) ── */}
      {tab==="advisory" && (
        <div>
          <ContentCard
            title="Plan health advisory"
            sub="Per-track pace, weight balance, and coverage gaps vs. target roles"
            item={advisory}
            accent="#BA7517"
            empty="P620 runs a brutally honest multi-track plan-health check nightly (11pm ET) and writes it here. It also advances your coverage matrix."
          />
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>Target roles → tracks</div>
            {(cur?.roles || []).map(r => (
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", gap:10, padding:"6px 0", borderBottom:`1px solid ${brd}`, flexWrap:"wrap" }}>
                <span style={{ fontSize:13 }}>{r.name}</span>
                <span style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{(r.primary_tracks||[]).map(t => <span key={t} style={trackBadge(t)}>{tracks[t]?.name||t}</span>)}</span>
              </div>
            ))}
            <div style={{ fontSize:12, color:txtT, marginTop:10, lineHeight:1.6 }}>Low-ROI / Tier 3-4 work should stay &lt;20% of weekly hours. The advisory flags imbalances.</div>
          </div>
        </div>
      )}

      {/* ── COVERAGE (skill heatmap) ── */}
      {tab==="coverage" && (
        <div>
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Coverage legend</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(COV).map(([k,v]) => (
                <span key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:"4px 10px", borderRadius:20, color:dark?v.dot:v.text, background:hexA(v.dot, dark?0.18:0.11), border:`1px solid ${hexA(v.dot, dark?0.32:0.24)}` }}>
                  <span style={{ fontSize:11 }}>{v.label}</span>{k}
                </span>
              ))}
            </div>
            <div style={{ fontSize:12, color:txtT, marginTop:12 }}>The nightly advisory advances these from your study log. This is your map of ground covered vs. remaining.</div>
          </div>

          {trackIds.map(id => {
            const t = tracks[id]; const ac = t.color?.border || brdS;
            const skills = t.skills || [];
            const tally = skills.reduce((a, sk) => { a[covOf(covMap, id, sk)]++; return a; }, { "not-started":0,"learning":0,"built":0,"interview-ready":0 });
            const done = tally.built + tally["interview-ready"];
            const segs = [["interview-ready",tally["interview-ready"]],["built",tally.built],["learning",tally.learning],["not-started",tally["not-started"]]];
            return (
              <div key={id} style={{ ...S.card, padding:0, overflow:"hidden", borderLeft:`3px solid ${ac}` }}>
                <div style={{ padding:"0.875rem 1rem", background:`linear-gradient(120deg, ${hexA(ac, dark?0.16:0.09)}, transparent 75%)` }}>
                  <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:12 }}>
                    <Ring pct={skills.length?done/skills.length*100:0} color={ac} size={48} stroke={5} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={trackBadge(id)}>{t.name}</span>
                      <div style={{ fontSize:11, color:txtT, marginTop:6 }}>{done}/{skills.length} built or interview-ready · {tally.learning} learning</div>
                      {/* Segmented coverage bar */}
                      <div style={{ display:"flex", height:6, borderRadius:4, overflow:"hidden", marginTop:7, background:bgS }}>
                        {segs.map(([k,n]) => n>0 && <div key={k} style={{ width:`${n/skills.length*100}%`, background:COV[k].dot }} />)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {skills.map(sk => {
                      const c = COV[covOf(covMap, id, sk)];
                      return (
                        <span key={sk} style={{ fontSize:12, padding:"4px 9px", borderRadius:8, background:hexA(c.dot, dark?0.2:0.12), color:dark?c.dot:c.text, border:`1px solid ${hexA(c.dot, dark?0.34:0.26)}` }}>
                          {sk}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOG ── */}
      {tab==="log" && (
        <div style={S.card}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Study log <span style={{ fontWeight:500, color:txtT }}>— {log.length} sessions · {totalHrs}h total</span></div>
          {log.length===0 && <div style={{ fontSize:13, color:txtT }}>No sessions yet. Log your first on the Today tab.</div>}
          {log.map((e,i,arr) => {
            const ac = (e.track && tracks[e.track]?.color?.border) || null;
            return (
            <div key={i} style={{ display:"flex", gap:11, padding:"9px 0", borderBottom:i<arr.length-1?`1px solid ${brd}`:"none" }}>
              <div style={{ width:3, borderRadius:3, background:ac || brd, flexShrink:0 }} />
              <div style={{ fontSize:11, color:txtT, minWidth:60, paddingTop:3 }}>{fmtDate(e.date)}</div>
              <div style={{ fontSize:20, fontWeight:700, minWidth:38, color:ac || txt, letterSpacing:-0.5 }}>{e.hours}<span style={{ fontSize:11, fontWeight:500, color:txtT }}>h</span></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  {e.track && tracks[e.track] && <span style={trackBadge(e.track)}>{tracks[e.track].name}</span>}
                  <span>{e.topic}</span>
                </div>
                {e.notes && <div style={{ fontSize:12, color:txtS, marginTop:2 }}>{e.notes}</div>}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Full-screen document reader for a prep guide */}
      {readerIv && <DocReader iv={readerIv} md={guideMd[readerIv.id]} onClose={() => setReaderIv(null)} />}
    </div>
  );
}
