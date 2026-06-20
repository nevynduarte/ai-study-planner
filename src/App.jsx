import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export default function App() {
  const [tab,     setTab]     = useState("interviews");
  const [data,    setData]    = useState(null);
  const [cur,     setCur]     = useState(null);   // curriculum.json
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  // Log-session form
  const [logH, setLogH] = useState(""); const [logT, setLogT] = useState("");
  const [logTr, setLogTr] = useState(""); const [logN, setLogN] = useState(""); const [logMsg, setLogMsg] = useState("");
  // Tutor question form
  const [q, setQ] = useState(""); const [asking, setAsking] = useState(false); const [askMsg, setAskMsg] = useState("");
  // Interview prep — accordion state
  const [expandedAreas, setExpandedAreas] = useState(new Set());
  const toggleArea = (key) => setExpandedAreas(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

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
  const startDays = status.started_date ? Math.max(1, Math.round((now - new Date(status.started_date + "T12:00:00")) / 864e5) + 1) : null;

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

  // Styles
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const bg   = dark ? "#121212" : "#ffffff";
  const bgS  = dark ? "#1e1e1e" : "#f5f5f5";
  const txt  = dark ? "#e8e8e8" : "#111111";
  const txtS = dark ? "#aaaaaa" : "#555555";
  const txtT = dark ? "#666666" : "#888888";
  const brd  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const brdS = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)";

  const S = {
    card:   { background:bg, border:`0.5px solid ${brd}`, borderRadius:12, padding:"1rem 1.125rem", marginBottom:"0.75rem" },
    tab:    (a) => ({ fontSize:13, fontWeight:a?500:400, padding:"6px 12px", background:"none", border:"none", cursor:"pointer", color:a?txt:txtT, borderBottom:a?`2px solid ${txt}`:"2px solid transparent", marginBottom:-1, whiteSpace:"nowrap" }),
    btn:    (p, dis) => ({ fontSize:13, padding:"7px 14px", borderRadius:8, cursor:dis?"not-allowed":"pointer", border:`0.5px solid ${brdS}`, opacity:dis?0.5:1, background:p?txt:"transparent", color:p?bg:txt, fontWeight:400 }),
    inp:    { fontSize:13, padding:"7px 10px", borderRadius:8, border:`0.5px solid ${brdS}`, background:bg, color:txt, width:"100%", boxSizing:"border-box" },
    lbl:    { fontSize:11, color:txtT, marginBottom:4, display:"block" },
    statBg: { background:bgS, borderRadius:8, padding:"10px 14px" },
    roiBadge:(s) => pill(roiColor(s)),
    stamp:  { fontSize:11, color:txtT },
  };
  // A muted accent pill: a low-opacity tint of the accent color rather than a
  // saturated pastel fill, so it reads softly in both light and dark mode.
  const pill = (accent, extra) => ({
    fontSize:11, padding:"2px 8px", borderRadius:10, fontWeight:500, whiteSpace:"nowrap",
    background:hexA(accent, dark ? 0.20 : 0.11),
    color:accent,
    border:`0.5px solid ${hexA(accent, dark ? 0.34 : 0.24)}`,
    ...extra,
  });
  const trackBadge = (id) => pill(tracks[id]?.color?.border || brdS);

  // Markdown renderer for P620-generated content (briefings, frontier,
  // advisory, tutor answers). Styled to match the app's typography instead
  // of dumping raw markdown source into a <pre>.
  const linkC = dark ? "#7FB2FF" : "#185FA5";
  const mdComponents = {
    h1: (p) => <div style={{ fontSize:16, fontWeight:600, margin:"14px 0 6px" }} {...p} />,
    h2: (p) => <div style={{ fontSize:14, fontWeight:600, margin:"14px 0 5px" }} {...p} />,
    h3: (p) => <div style={{ fontSize:13, fontWeight:600, color:txtS, margin:"12px 0 4px" }} {...p} />,
    p:  (p) => <p style={{ margin:"0 0 8px", lineHeight:1.7 }} {...p} />,
    ul: (p) => <ul style={{ margin:"0 0 8px", paddingLeft:18, lineHeight:1.7 }} {...p} />,
    ol: (p) => <ol style={{ margin:"0 0 8px", paddingLeft:18, lineHeight:1.7 }} {...p} />,
    li: (p) => <li style={{ margin:"2px 0" }} {...p} />,
    strong: (p) => <strong style={{ fontWeight:600 }} {...p} />,
    a:  (p) => <a style={{ color:linkC, textDecoration:"underline", textUnderlineOffset:2, wordBreak:"break-word" }} target="_blank" rel="noreferrer" {...p} />,
    hr: () => <hr style={{ border:"none", borderTop:`0.5px solid ${brd}`, margin:"12px 0" }} />,
    code: (p) => <code style={{ fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace", fontSize:12, background:bgS, padding:"1px 5px", borderRadius:4 }} {...p} />,
    blockquote: (p) => <blockquote style={{ margin:"0 0 8px", paddingLeft:12, borderLeft:`2px solid ${brd}`, color:txtS }} {...p} />,
    table: (p) => <div style={{ overflowX:"auto", marginBottom:8 }}><table style={{ borderCollapse:"collapse", fontSize:12.5 }} {...p} /></div>,
    th: (p) => <th style={{ textAlign:"left", padding:"4px 8px", borderBottom:`1px solid ${brdS}`, fontWeight:600 }} {...p} />,
    td: (p) => <td style={{ padding:"4px 8px", borderBottom:`0.5px solid ${brd}` }} {...p} />,
  };
  const Md = ({ children }) => (
    <div style={{ fontSize:13, color:txt }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{children}</ReactMarkdown>
    </div>
  );

  const TABS = ["interviews","today","tutor","frontier","advisory","coverage","log","roadmap"];

  // Small read-only card for P620-generated content with a freshness stamp.
  const ContentCard = ({ title, sub, item, empty }) => (
    <div style={S.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500 }}>{title}</div>
          <div style={S.stamp}>{sub}</div>
        </div>
        <div style={S.stamp}>{item?.generated_at ? `Updated ${fmtTs(item.generated_at)} · P620` : "Awaiting P620"}</div>
      </div>
      {item?.content ? <Md>{item.content}</Md> : <div style={{ fontSize:13, color:txtT }}>{empty}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", maxWidth:820, margin:"0 auto", padding:"1.25rem 1rem 4rem", color:txt }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.25rem" }}>
        <div>
          <div style={{ fontSize:19, fontWeight:500 }}>Elite Engineering Planner</div>
          <div style={{ fontSize:12, color:txtT, marginTop:3 }}>
            {todayFmt()} · {trackIds.length || 4} parallel tracks{startDays ? ` · Day ${startDays}` : ""}
          </div>
        </div>
        <button style={{ ...S.btn(false, loading), fontSize:12 }} onClick={load} disabled={loading}>{loading?"…":"Refresh"}</button>
      </div>

      {err && (
        <div style={{ background:"#FCEBEB", border:"0.5px solid #E24B4A", borderRadius:8, padding:"10px 14px", marginBottom:"0.875rem", fontSize:13, color:"#501313" }}>
          {err} — is the D1 binding configured on the Worker?
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, borderBottom:`0.5px solid ${brd}`, marginBottom:"1.25rem", overflowX:"auto" }}>
        {TABS.map(t => <button key={t} style={S.tab(tab===t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
      </div>

      {/* ── INTERVIEWS ── */}
      {tab==="interviews" && (
        <div>
          {!(cur?.interviews?.length) && (
            <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>No interviews loaded from curriculum.json yet.</div>
          )}
          {(cur?.interviews || []).map(iv => {
            const ivDate = new Date(iv.date + "T09:00:00");
            const daysLeft = Math.ceil((ivDate - new Date()) / 864e5);
            const urgency = daysLeft <= 1 ? "#A32D2D" : daysLeft <= 2 ? "#BA7517" : "#185FA5";
            const ivColor = iv.id === "aaru" ? { border:"#1D9E75", bg:"#E1F5EE", text:"#085041" } : { border:"#185FA5", bg:"#E6F1FB", text:"#0C447C" };
            return (
              <div key={iv.id} style={{ ...S.card, borderLeft:`3px solid ${ivColor.border}`, marginBottom:"1.5rem" }}>

                {/* header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:17, fontWeight:600 }}>{iv.company}</span>
                      <span style={pill(ivColor.border)}>{iv.day}</span>
                    </div>
                    <div style={{ fontSize:13, color:txtS }}>{iv.role}</div>
                    <div style={{ fontSize:12, color:txtT, marginTop:2 }}>{iv.location} · {iv.salary}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                    <div style={{ fontSize:26, fontWeight:700, color:urgency, lineHeight:1 }}>{daysLeft > 0 ? daysLeft : 0}<span style={{ fontSize:13, fontWeight:400 }}>d</span></div>
                    <div style={{ fontSize:11, color:txtT, marginTop:2 }}>{iv.date}</div>
                  </div>
                </div>

                <div style={{ fontSize:12, color:txtS, lineHeight:1.65, marginBottom:12, paddingBottom:12, borderBottom:`0.5px solid ${brd}` }}>{iv.about}</div>

                {/* Tech stack */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ ...S.lbl, marginBottom:5 }}>Stack to know</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {(iv.stack||[]).map(s => <span key={s} style={pill(ivColor.border, { fontSize:12 })}>{s}</span>)}
                  </div>
                </div>

                {/* Your strengths */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ ...S.lbl, marginBottom:5 }}>Your fit — lead with these</div>
                  <div style={{ background:hexA(ivColor.border, dark?0.08:0.05), borderRadius:8, padding:"8px 10px" }}>
                    {(iv.your_strengths||[]).map((s,i) => (
                      <div key={i} style={{ fontSize:12, color:txtS, padding:"3px 0", lineHeight:1.55, borderBottom:i<iv.your_strengths.length-1?`0.5px solid ${brd}`:"none" }}>
                        ✓ {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Story beats */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ ...S.lbl, marginBottom:5 }}>Story beats — weave these in</div>
                  {(iv.story_beats||[]).map((s,i) => (
                    <div key={i} style={{ fontSize:12, color:txtS, padding:"4px 0 4px 8px", borderLeft:`2px solid ${hexA(ivColor.border, 0.4)}`, marginBottom:4, lineHeight:1.6 }}>
                      {s}
                    </div>
                  ))}
                </div>

                {/* Prep areas — accordion */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ ...S.lbl, marginBottom:5 }}>Prep areas — click to expand</div>
                  {(iv.prep_areas||[]).map(pa => {
                    const key = `${iv.id}:${pa.area}`;
                    const open = expandedAreas.has(key);
                    return (
                      <div key={pa.area} style={{ border:`0.5px solid ${open ? ivColor.border : brd}`, borderRadius:8, marginBottom:5, overflow:"hidden" }}>
                        <button
                          onClick={() => toggleArea(key)}
                          style={{ width:"100%", textAlign:"left", padding:"8px 12px", background:open?hexA(ivColor.border,dark?0.12:0.06):"none", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", color:txt }}
                        >
                          <span style={{ fontSize:13, fontWeight:500 }}>{pa.area}</span>
                          <span style={{ fontSize:10, color:txtT, marginLeft:8 }}>{open ? "▲" : "▼"}</span>
                        </button>
                        {open && (
                          <div style={{ padding:"2px 12px 10px", borderTop:`0.5px solid ${brd}` }}>
                            {(pa.items||[]).map((item,i) => (
                              <div key={i} style={{ fontSize:12, color:txtS, padding:"4px 0", lineHeight:1.6, borderBottom:i<pa.items.length-1?`0.5px solid ${brd}`:"none" }}>
                                • {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Likely questions */}
                <div>
                  <div style={{ ...S.lbl, marginBottom:5 }}>Likely questions — prep answers out loud</div>
                  <div style={{ background:bgS, borderRadius:8, padding:"8px 10px" }}>
                    {(iv.likely_questions||[]).map((lq,i) => (
                      <div key={i} style={{ fontSize:12, color:txtS, padding:"4px 0", lineHeight:1.55, borderBottom:i<iv.likely_questions.length-1?`0.5px solid ${brd}`:"none" }}>
                        <span style={{ fontWeight:500, color:ivColor.border, marginRight:5 }}>{i+1}.</span>{lq}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── TODAY ── */}
      {tab==="today" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:"0.875rem" }}>
            {[["Total hours",totalHrs],["This week",`${weekHrs}/70`],["Day",startDays||"—"],["Sessions",log.length]].map(([l,v]) => (
              <div key={l} style={S.statBg}><div style={S.lbl}>{l}</div><div style={{ fontSize:22, fontWeight:500 }}>{v}</div></div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:"0.875rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>Weekly progress</span>
              <span style={{ fontSize:12, color:txtT }}>{Math.round(weekHrs/70*100)}% of 70h target</span>
            </div>
            <div style={{ height:5, borderRadius:3, background:bgS, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(100,weekHrs/70*100)}%`, background:weekHrs>=70?"#3B6D11":weekHrs>=49?"#185FA5":weekHrs>=28?"#BA7517":"#A32D2D", borderRadius:3 }} />
            </div>
            <div style={{ fontSize:12, color:txtT, marginTop:6 }}>{Math.max(0,70-weekHrs).toFixed(1)}h remaining this week</div>
          </div>

          {/* Per-track focus + weekly balance */}
          <div style={{ fontSize:11, color:txtT, margin:"0 0 8px 2px" }}>Active tracks — weights, current month, this week's balance</div>
          {trackIds.map(id => {
            const t = tracks[id]; const md = monthData(id);
            const target = (t.weight || 0) * 70; const got = weekHrsByTrack(id);
            const pct = target ? Math.min(100, got/target*100) : 0;
            return (
              <div key={id} style={{ ...S.card, borderLeft:`3px solid ${t.color?.border||brdS}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
                  <div>
                    <span style={trackBadge(id)}>{t.name}</span>
                    <span style={{ fontSize:11, color:txtT, marginLeft:8 }}>{Math.round((t.weight||0)*100)}% · ~{t.daily_hours}h/day</span>
                  </div>
                  <span style={S.roiBadge(md.roi||75)}>ROI {md.roi||"—"}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>Month {monthOf(id)} — {md.title}</div>
                <div style={{ fontSize:12, color:txtS, lineHeight:1.55, marginBottom:8 }}>{md.focus}</div>
                <div style={{ height:4, borderRadius:3, background:bgS, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:t.color?.border||"#185FA5", borderRadius:3 }} />
                </div>
                <div style={{ fontSize:11, color:txtT, marginTop:5 }}>{got.toFixed(1)}h this week · target ~{target.toFixed(1)}h</div>
              </div>
            );
          })}

          <ContentCard
            title="Today's plan"
            sub="Weighted across all 4 tracks · generated 6am ET"
            item={plan}
            empty="P620 writes a time-blocked, track-weighted 10-hour plan here every morning at 6am ET."
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

      {/* ── TUTOR ── */}
      {tab==="tutor" && (
        <div>
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Ask your tutor</div>
            <div style={{ ...S.stamp, marginBottom:10 }}>Knows all 4 tracks, your coverage, log, and target roles. P620 answers on its next hourly run.</div>
            <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Type a question across any track…" style={{ ...S.inp, resize:"vertical", minHeight:80, lineHeight:1.6 }} disabled={asking} />
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
              <button style={S.btn(true, asking || !q.trim())} onClick={askQuestion} disabled={asking || !q.trim()}>{asking?"Saving…":"Ask →"}</button>
              {askMsg && <span style={{ fontSize:12, color:"#3B6D11" }}>{askMsg}</span>}
            </div>
          </div>

          {questions.length === 0 && <div style={{ fontSize:13, color:txtT, padding:"0.5rem 0.25rem" }}>No questions yet. Ask your first above.</div>}
          {questions.map(item => (
            <div key={item.id} style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{item.question}</div>
                <span style={{ ...S.stamp, whiteSpace:"nowrap" }}>{fmtDate(item.date)}</span>
              </div>
              {item.answer
                ? <div style={{ borderTop:`0.5px solid ${brd}`, paddingTop:10 }}><Md>{item.answer}</Md></div>
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

      {/* ── ADVISORY (read-only) ── */}
      {tab==="advisory" && (
        <div>
          <ContentCard
            title="Plan health advisory"
            sub="Per-track pace, weight balance, and coverage gaps vs. target roles"
            item={advisory}
            empty="P620 runs a brutally honest multi-track plan-health check nightly (11pm ET) and writes it here. It also advances your coverage matrix."
          />
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>Target roles → tracks</div>
            {(cur?.roles || []).map(r => (
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", gap:10, padding:"6px 0", borderBottom:`0.5px solid ${brd}`, flexWrap:"wrap" }}>
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
            <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>Coverage legend</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {Object.entries(COV).map(([k,v]) => (
                <span key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:txtS }}>
                  <span style={{ width:11, height:11, borderRadius:3, background:v.dot, display:"inline-block" }} />{k}
                </span>
              ))}
            </div>
            <div style={{ fontSize:12, color:txtT, marginTop:10 }}>The nightly advisory advances these from your study log. This is your map of ground covered vs. remaining.</div>
          </div>

          {trackIds.map(id => {
            const t = tracks[id];
            const skills = t.skills || [];
            const tally = skills.reduce((a, sk) => { a[covOf(covMap, id, sk)]++; return a; }, { "not-started":0,"learning":0,"built":0,"interview-ready":0 });
            const done = tally.built + tally["interview-ready"];
            return (
              <div key={id} style={{ ...S.card, borderLeft:`3px solid ${t.color?.border||brdS}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={trackBadge(id)}>{t.name}</span>
                  <span style={{ fontSize:11, color:txtT }}>{done}/{skills.length} built+ · {tally.learning} learning</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {skills.map(sk => {
                    const c = COV[covOf(covMap, id, sk)];
                    return (
                      <span key={sk} style={{ fontSize:12, padding:"4px 9px", borderRadius:8, background:hexA(c.dot, dark?0.18:0.11), color:dark?c.dot:c.text, border:`0.5px solid ${hexA(c.dot, dark?0.32:0.24)}` }}>
                        {sk}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOG ── */}
      {tab==="log" && (
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Study log — {log.length} sessions · {totalHrs}h total</div>
          {log.length===0 && <div style={{ fontSize:13, color:txtT }}>No sessions yet. Log your first on the Today tab.</div>}
          {log.map((e,i,arr) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:i<arr.length-1?`0.5px solid ${brd}`:"none" }}>
              <div style={{ fontSize:11, color:txtT, minWidth:64, paddingTop:1 }}>{fmtDate(e.date)}</div>
              <div style={{ fontSize:20, fontWeight:500, minWidth:38 }}>{e.hours}<span style={{ fontSize:11, fontWeight:400, color:txtS }}>h</span></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  {e.track && tracks[e.track] && <span style={trackBadge(e.track)}>{tracks[e.track].name}</span>}
                  <span>{e.topic}</span>
                </div>
                {e.notes && <div style={{ fontSize:12, color:txtS, marginTop:2 }}>{e.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ROADMAP (per track) ── */}
      {tab==="roadmap" && trackIds.map(id => {
        const t = tracks[id];
        return (
          <div key={id} style={{ marginBottom:"1.5rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 8px 2px", flexWrap:"wrap" }}>
              <span style={trackBadge(id)}>{t.name}</span>
              <span style={{ fontSize:12, color:txtT }}>{Math.round((t.weight||0)*100)}% of day · {t.summary}</span>
            </div>
            {(t.months||[]).map(mo => {
              const active = mo.n === monthOf(id);
              const c = t.color || { bg:bgS, text:txtS, border:brdS };
              return (
                <div key={mo.n} style={{ ...S.card, marginBottom:"0.5rem", borderColor:active?c.border:brd, borderWidth:active?1.5:0.5 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:11, color:txtT, minWidth:54 }}>Month {mo.n}</span>
                        {active && <span style={pill(c.border, { padding:"1px 7px" })}>active</span>}
                      </div>
                      <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{mo.title}</div>
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
  );
}
