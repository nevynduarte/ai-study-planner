import { useState, useEffect, useRef } from "react";

// ─── Storage ──────────────────────────────────────────────────────
const STORE = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── Roadmap ──────────────────────────────────────────────────────
const MONTHS = [
  { n:1,  title:"Math Foundations & Python Mastery",        tier:"Foundation",    roi:79, focus:"Linear algebra, probability, optimization, information theory. NumPy from scratch. Autograd engine. Cap CNN history to 10 hrs." },
  { n:2,  title:"Classical ML — Theory to Production",      tier:"Foundation",    roi:84, focus:"Every classical algorithm from scratch. MLflow tracking. Quant factor platform v0. Ship something deployed by week 8." },
  { n:3,  title:"Deep Learning — Neural Networks to CNNs",  tier:"Deep Learning", roi:82, focus:"Autograd engine extended, ResNet from scratch, production image API. Cap CNN architecture history at 10 hrs total." },
  { n:4,  title:"Sequence Models & the Transformer",        tier:"Deep Learning", roi:87, focus:"LSTM→attention→full Transformer from scratch. GPT with KV cache. BPE tokenizer. Reproduce paper BLEU within 2 points." },
  { n:5,  title:"LLMs — Pre-training to Fine-tuning",       tier:"LLMs",          roi:87, focus:"Pre-training pipeline, LoRA/QLoRA from scratch, vLLM inference server. Chinchilla laws. 125M model trained end-to-end." },
  { n:6,  title:"AI Engineering — RAG, Agents, Production", tier:"AI Engineering",roi:92, focus:"Production RAG platform, coding agent, MCP multi-agent system, RAGAS evaluation, full observability stack." },
  { n:7,  title:"Systems — GPUs, CUDA, Distributed AI",     tier:"Systems",       roi:87, focus:"CUDA kernels, FlashAttention tiling, FSDP distributed training, Kubernetes ML platform." },
  { n:8,  title:"Reinforcement Learning & Alignment",       tier:"RL/Alignment",  roi:74, focus:"PPO/DQN from scratch, RLHF pipeline (SFT→RM→PPO), DPO comparison, GRPO reasoning training." },
  { n:9,  title:"Data Engineering, MLOps & AI Products",    tier:"Systems",       roi:80, focus:"Kafka, Flink, Spark, dbt. Real-time feature platform. Quant research platform — biggest differentiator for D.E. Shaw/Woodline." },
  { n:10, title:"Frontier — Multimodal & Research",         tier:"Research",      roi:70, focus:"ViT, CLIP, diffusion, Mamba. Multimodal RAG. Paper reproduction. Research preprint drafted." },
  { n:11, title:"Leadership, Product & AI Startup",         tier:"Leadership",    roi:82, focus:"AI product with real users. Open-source PR merged. Blog posts. Conference talk proposal." },
  { n:12, title:"Elite Synthesis — Launch & Specialization",tier:"Launch",        roi:88, focus:"Distributed inference system 1000 QPS. Personal AI OS. Research preprint submitted. Job offers." },
];

const TIER_COLORS = {
  "Foundation":    { bg:"#EAF3DE", text:"#3B6D11", border:"#639922" },
  "Deep Learning": { bg:"#E6F1FB", text:"#0C447C", border:"#185FA5" },
  "LLMs":          { bg:"#EEEDFE", text:"#3C3489", border:"#7F77DD" },
  "AI Engineering":{ bg:"#E1F5EE", text:"#085041", border:"#1D9E75" },
  "Systems":       { bg:"#FAEEDA", text:"#633806", border:"#BA7517" },
  "RL/Alignment":  { bg:"#FBEAF0", text:"#4B1528", border:"#D4537E" },
  "Research":      { bg:"#F1EFE8", text:"#2C2C2A", border:"#888780" },
  "Leadership":    { bg:"#FCEBEB", text:"#501313", border:"#E24B4A" },
  "Launch":        { bg:"#EAF3DE", text:"#173404", border:"#639922" },
};

// ─── API (calls our secure Cloudflare Function, not Anthropic directly) ──────
async function callAPI(endpoint, body) {
  const resp = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data.text || "";
}

// ─── Helpers ──────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];
const todayFmt = () => new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
const fmtDate  = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" });
const roiColor = (s) => s >= 85 ? "#185FA5" : s >= 75 ? "#3B6D11" : s >= 65 ? "#BA7517" : "#A32D2D";
const roiBg    = (s) => s >= 85 ? "#E6F1FB" : s >= 75 ? "#EAF3DE" : s >= 65 ? "#FAEEDA" : "#FCEBEB";

export default function App() {
  const [tab,          setTab]          = useState("today");
  const [month,        setMonth]        = useState(() => STORE.get("currentMonth") || 1);
  const [studyLog,     setStudyLog]     = useState(() => STORE.get("studyLog") || []);
  const [chat,         setChat]         = useState(() => STORE.get("chat") || []);
  const [dayPlan,      setDayPlan]      = useState(() => STORE.get("dayPlan") || "");
  const [dayPlanDate,  setDayPlanDate]  = useState(() => STORE.get("dayPlanDate") || "");
  const [frontier,     setFrontier]     = useState(() => STORE.get("frontier") || "");
  const [frontierDate, setFrontierDate] = useState(() => STORE.get("frontierDate") || "");
  const [advisory,     setAdvisory]     = useState(() => STORE.get("advisory") || "");
  const [chatInput,    setChatInput]    = useState("");
  const [loading,      setLoading]      = useState(false);
  const [logH,         setLogH]         = useState("");
  const [logT,         setLogT]         = useState("");
  const [logN,         setLogN]         = useState("");
  const [logMsg,       setLogMsg]       = useState("");
  const [apiError,     setApiError]     = useState("");
  const chatEnd = useRef(null);

  useEffect(() => { STORE.set("currentMonth", month); }, [month]);
  useEffect(() => { STORE.set("studyLog", studyLog); }, [studyLog]);
  useEffect(() => { STORE.set("chat", chat.slice(-40)); }, [chat]);
  useEffect(() => { STORE.set("dayPlan", dayPlan); STORE.set("dayPlanDate", dayPlanDate); }, [dayPlan, dayPlanDate]);
  useEffect(() => { STORE.set("frontier", frontier); STORE.set("frontierDate", frontierDate); }, [frontier, frontierDate]);
  useEffect(() => { STORE.set("advisory", advisory); }, [advisory]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [chat]);

  const m = MONTHS[month - 1];
  const totalHrs = studyLog.reduce((s, e) => s + (e.hours || 0), 0);
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - (now.getDay() || 7) + 1); monday.setHours(0,0,0,0);
  const weekHrs = studyLog.filter(e => new Date(e.date + "T12:00:00") >= monday).reduce((s,e) => s + e.hours, 0);

  function sys() {
    const log = studyLog.slice(-14).map(e => `${e.date}: ${e.hours}h — "${e.topic}"${e.notes ? " | " + e.notes : ""}`).join("\n") || "None yet.";
    return `You are an elite AI engineering mentor for Nevyn Duarte.

BACKGROUND: BS Mathematics (UT Austin), MS Data Science CU Boulder (GPA 3.84). Co-Founder/CTO Bridges AI. Ex-quantitative equity researcher at M Science/Jefferies, AMD, finance. Strong Python. RAG systems, LLM workflows, agentic systems. Greater NYC/NJ.

GOALS: Elite AI engineer → Head of AI / Principal / CTO. Target $300K–$600K+. Interviewing at D.E. Shaw (Applied AI + Alt Data Analyst) and Woodline Partners (Sector Data Analyst). 10 hrs/day, 12 months.

STATUS: Month ${month}/12 — "${m.title}" | Focus: ${m.focus} | ROI: ${m.roi}/100 | Hours logged: ${totalHrs}h | This week: ${weekHrs}h/70h target

RECENT LOG:
${log}

ROI PRIORITY: Production AI systems → Distributed systems → LLM internals → AI product dev → Fine-tuning/alignment → MLOps → Evaluation/observability → Python mastery → Data engineering → Vector DBs → CUDA → Multi-agent → Inference optimization

Be direct. Reference Nevyn's background. Flag Tier 3/4 over-investment. Push toward production. Under 300 words unless asked for more.`;
  }

  async function run(endpoint, userMsg, onDone) {
    setLoading(true); setApiError("");
    try {
      const text = await callAPI(endpoint, { system: sys(), messages: [{ role:"user", content:userMsg }] });
      onDone(text);
    } catch(e) {
      setApiError(e.message);
    }
    setLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || loading) return;
    const msg = chatInput.trim(); setChatInput("");
    const history = [...chat, { role:"user", content:msg }];
    setChat(history); setLoading(true); setApiError("");
    const needsSearch = /latest|recent|new paper|just released|this week|2025|2026|frontier/i.test(msg);
    try {
      const text = await callAPI(needsSearch ? "search" : "chat", {
        system: sys(),
        messages: history.map(h => ({ role:h.role, content:h.content })),
      });
      setChat([...history, { role:"assistant", content:text }]);
    } catch(e) { setApiError(e.message); }
    setLoading(false);
  }

  function logSession() {
    if (!logT || !logH || parseFloat(logH) <= 0) { setLogMsg("Enter topic and hours."); return; }
    setStudyLog(p => [...p, { date:todayISO(), hours:parseFloat(logH), topic:logT, notes:logN }]);
    setLogH(""); setLogT(""); setLogN("");
    setLogMsg(`Logged ${logH}h on "${logT}"`); setTimeout(() => setLogMsg(""), 3000);
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
    card:    { background:bg, border:`0.5px solid ${brd}`, borderRadius:12, padding:"1rem 1.125rem", marginBottom:"0.75rem" },
    tab:     (a) => ({ fontSize:13, fontWeight:a?500:400, padding:"6px 14px", background:"none", border:"none", cursor:"pointer", color:a?txt:txtT, borderBottom:a?`2px solid ${txt}`:"2px solid transparent", marginBottom:-1 }),
    btn:     (p) => ({ fontSize:13, padding:"7px 14px", borderRadius:8, cursor:loading?"not-allowed":"pointer", border:`0.5px solid ${brdS}`, opacity:loading?0.5:1, background:p?txt:"transparent", color:p?bg:txt, fontWeight:400 }),
    inp:     { fontSize:13, padding:"7px 10px", borderRadius:8, border:`0.5px solid ${brdS}`, background:bg, color:txt, width:"100%", boxSizing:"border-box" },
    pre:     { fontSize:13, lineHeight:1.75, color:txt, whiteSpace:"pre-wrap", margin:0, fontFamily:"inherit" },
    lbl:     { fontSize:11, color:txtT, marginBottom:4, display:"block" },
    statBg:  { background:bgS, borderRadius:8, padding:"10px 14px" },
    bubble:  (r) => ({ padding:"8px 12px", borderRadius:12, maxWidth:"88%", fontSize:13, lineHeight:1.7, background:r==="user"?txt:bgS, color:r==="user"?bg:txt, alignSelf:r==="user"?"flex-end":"flex-start", whiteSpace:"pre-wrap" }),
    mBadge:  (tier) => { const c=TIER_COLORS[tier]||TIER_COLORS.Foundation; return { fontSize:11, padding:"2px 8px", borderRadius:10, background:c.bg, color:c.text, fontWeight:500 }; },
    roiBadge:(s) => ({ fontSize:11, padding:"2px 8px", borderRadius:10, background:roiBg(s), color:roiColor(s), fontWeight:500 }),
  };

  const TABS = ["today","tutor","frontier","advisory","log","roadmap"];
  const PROMPTS = [
    `Am I on track for D.E. Shaw given my log?`,
    `Highest-ROI thing to do in the next 3 hours?`,
    `Explain GQA vs MHA — when does each matter?`,
    `Quiz me on LLM internals for a D.E. Shaw screen`,
    `Is my log showing Tier 3/4 over-investment?`,
    `Walk me through PagedAttention from first principles`,
  ];

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", maxWidth:780, margin:"0 auto", padding:"1.25rem 1rem 4rem", color:txt }}>

      {/* Header */}
      <div style={{ marginBottom:"1.25rem" }}>
        <div style={{ fontSize:19, fontWeight:500 }}>Elite AI Engineering Planner</div>
        <div style={{ fontSize:12, color:txtT, marginTop:3 }}>{todayFmt()} · Month {month}: {m.title}</div>
      </div>

      {/* API error banner */}
      {apiError && (
        <div style={{ background:"#FCEBEB", border:"0.5px solid #E24B4A", borderRadius:8, padding:"10px 14px", marginBottom:"0.875rem", fontSize:13, color:"#501313" }}>
          API error: {apiError}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, borderBottom:`0.5px solid ${brd}`, marginBottom:"1.25rem" }}>
        {TABS.map(t => <button key={t} style={S.tab(tab===t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
      </div>

      {/* ── TODAY ── */}
      {tab==="today" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:"0.875rem" }}>
            {[["Total hours",totalHrs],["This week",`${weekHrs}/70`],["Month",`${month}/12`],["Sessions",studyLog.length]].map(([l,v]) => (
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
            <div style={{ fontSize:12, color:txtT, marginTop:6 }}>{Math.max(0,70-weekHrs)}h remaining</div>
          </div>

          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:11, color:txtT, marginBottom:4 }}>Active month</div>
                <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>Month {m.n} — {m.title}</div>
                <span style={S.mBadge(m.tier)}>{m.tier}</span>
              </div>
              <span style={S.roiBadge(m.roi)}>ROI {m.roi}</span>
            </div>
            <div style={{ fontSize:13, color:txtS, lineHeight:1.65, borderTop:`0.5px solid ${brd}`, paddingTop:10 }}>{m.focus}</div>
            <div style={{ display:"flex", gap:6, marginTop:12 }}>
              <button style={S.btn(false)} onClick={() => setMonth(x => Math.max(1,x-1))}>← Prev</button>
              <button style={S.btn(false)} onClick={() => setMonth(x => Math.min(12,x+1))}>Next →</button>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>Today's plan</div>
                <div style={{ fontSize:11, color:txtT }}>{dayPlanDate===todayISO()?"Generated today":"Not yet generated"}</div>
              </div>
              <button style={S.btn(true)} onClick={() => run("chat", `Generate a precise 10-hour study plan for today (${todayFmt()}). Current month focus: ${m.focus}. Format as time-blocked 6am–10pm schedule with specific tasks, which blocks are implementation vs theory, one concrete deliverable, and one "do not skip" item.`, (t) => { setDayPlan(t); setDayPlanDate(todayISO()); })} disabled={loading}>
                {loading?"Generating…":dayPlanDate===todayISO()?"Regenerate":"Generate plan →"}
              </button>
            </div>
            {dayPlan ? <pre style={S.pre}>{dayPlan}</pre> : <div style={{ fontSize:13, color:txtT }}>Generate a precise 10-hour time-blocked plan based on your current month and study log.</div>}
          </div>

          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>Log a study session</div>
            <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:8, marginBottom:8 }}>
              <input type="number" min="0.5" max="16" step="0.5" value={logH} onChange={e=>setLogH(e.target.value)} placeholder="Hours" style={S.inp} />
              <input type="text" value={logT} onChange={e=>setLogT(e.target.value)} placeholder="Topic — be specific (e.g. 'Implemented multi-head attention')" style={S.inp} />
            </div>
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
          <div style={{ ...S.card, padding:"0.75rem 1rem" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10, height:420, overflowY:"auto", paddingRight:4 }}>
              {chat.length===0 && <div style={{ fontSize:13, color:txtT, padding:"1rem 0" }}>Your personal AI tutor. Knows your background, log, interview targets, and goals. Ask anything — questions about recent papers automatically trigger web search.</div>}
              {chat.map((msg,i) => (
                <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
                  <div style={S.bubble(msg.role)}>{msg.content}</div>
                </div>
              ))}
              {loading && <div style={{ display:"flex", justifyContent:"flex-start" }}><div style={{ ...S.bubble("assistant"), color:txtT }}>Thinking…</div></div>}
              <div ref={chatEnd} />
            </div>
            <div style={{ display:"flex", gap:8, marginTop:10, borderTop:`0.5px solid ${brd}`, paddingTop:10 }}>
              <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} placeholder="Ask anything — knows your context, log, and interview targets…" style={{ ...S.inp, flex:1 }} disabled={loading} />
              <button style={S.btn(true)} onClick={sendChat} disabled={loading||!chatInput.trim()}>Send →</button>
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
            {PROMPTS.map((p,i) => <button key={i} onClick={() => setChatInput(p)} style={{ ...S.btn(false), fontSize:12 }}>{p.length>52?p.slice(0,52)+"…":p}</button>)}
          </div>
          {chat.length>0 && <button style={{ ...S.btn(false), fontSize:12 }} onClick={() => setChat([])}>Clear conversation</button>}
        </div>
      )}

      {/* ── FRONTIER ── */}
      {tab==="frontier" && (
        <div>
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>Frontier paper digest</div>
                <div style={{ fontSize:11, color:txtT }}>Live web search — relevant to Month {month}{frontierDate?` · updated ${fmtDate(frontierDate)}`:""}</div>
              </div>
              <button style={S.btn(true)} onClick={() => run("search", `Search for the 3 most important AI/ML papers or technical developments from the past 7 days most relevant to Month ${month} focus: "${m.focus}". For each: (1) what it is in one sentence, (2) why it matters for Nevyn's goals specifically, (3) should it change his current plan yes/no + reason, (4) priority: READ NOW / this week / bookmark. End with: any finding that should trigger a plan adjustment?`, (t) => { setFrontier(t); setFrontierDate(todayISO()); })} disabled={loading}>
                {loading?"Searching…":frontierDate===todayISO()?"Refresh →":"Fetch digest →"}
              </button>
            </div>
            {frontier ? <pre style={S.pre}>{frontier}</pre> : <div style={{ fontSize:13, color:txtT }}>Pulls the most important recent AI papers relevant to your current month using live web search.</div>}
          </div>
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>Weekly rhythm</div>
            <div style={{ fontSize:13, color:txtS, lineHeight:1.75 }}>
              <strong>Monday</strong> — Fetch digest. Scan READ NOW items.{"\n\n"}
              <strong>Wednesday</strong> — Deep-read one paper. Log it. Ask Tutor to explain anything confusing.{"\n\n"}
              <strong>Friday</strong> — Ask Tutor: "Should any paper this week change my Month {month} plan?"{"\n\n"}
              <strong>If digest says "adjust plan"</strong> — run Advisory immediately.
            </div>
          </div>
        </div>
      )}

      {/* ── ADVISORY ── */}
      {tab==="advisory" && (
        <div>
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>Plan health advisory</div>
                <div style={{ fontSize:11, color:txtT }}>Analyzes your full log against ROI priorities and target roles</div>
              </div>
              <button style={S.btn(true)} onClick={() => run("chat", `Brutally honest plan health check for Month ${month}. Answer: 1) On track for month goals? (yes/partially/no + evidence from log) 2) Topic imbalances? (too much Tier 3/4?) 3) Biggest ROI opportunity currently missed. 4) One specific adjustment to make this week. 5) Confidence score 0–100: is this trajectory leading to elite outcomes? Reference specific log entries. Do not hedge.`, setAdvisory)} disabled={loading}>
                {loading?"Analyzing…":"Run analysis →"}
              </button>
            </div>
            {advisory ? <pre style={S.pre}>{advisory}</pre> : <div style={{ fontSize:13, color:txtT }}>Brutally honest check: on-track status, topic imbalances, ROI gaps, 0–100 confidence score. Run every 2 weeks.</div>}
          </div>
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>ROI priority — always optimize toward Tier 1</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { tier:1, items:["Production AI systems","Distributed systems","LLM internals","AI product dev","Fine-tuning/alignment","MLOps & CI/CD","Evaluation & observability","Python mastery"] },
                { tier:2, items:["Data engineering","Vector DBs & retrieval","CUDA & GPU","Systems design","Multi-agent systems","Inference optimization","Pre-training pipelines","TypeScript/Next.js"] },
              ].map(({ tier, items }) => (
                <div key={tier} style={{ background:bgS, borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, fontWeight:500, color:txtS, marginBottom:8 }}>Tier {tier}</div>
                  {items.map((t,i) => <div key={i} style={{ fontSize:12, padding:"3px 0", borderBottom:i<items.length-1?`0.5px solid ${brd}`:"none" }}>{t}</div>)}
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:txtT, marginTop:10, lineHeight:1.6 }}>Tier 3+4 should be &lt;20% of weekly hours. Advisory will flag imbalances.</div>
          </div>
        </div>
      )}

      {/* ── LOG ── */}
      {tab==="log" && (
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Study log — {studyLog.length} sessions · {totalHrs}h total</div>
          {studyLog.length===0 && <div style={{ fontSize:13, color:txtT }}>No sessions yet. Log your first on the Today tab.</div>}
          {[...studyLog].reverse().slice(0,60).map((e,i,arr) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:i<arr.length-1?`0.5px solid ${brd}`:"none" }}>
              <div style={{ fontSize:11, color:txtT, minWidth:64, paddingTop:1 }}>{fmtDate(e.date)}</div>
              <div style={{ fontSize:20, fontWeight:500, minWidth:38 }}>{e.hours}<span style={{ fontSize:11, fontWeight:400, color:txtS }}>h</span></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13 }}>{e.topic}</div>
                {e.notes && <div style={{ fontSize:12, color:txtS, marginTop:2 }}>{e.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ROADMAP ── */}
      {tab==="roadmap" && MONTHS.map(mo => {
        const c = TIER_COLORS[mo.tier] || TIER_COLORS.Foundation;
        const active = mo.n === month;
        return (
          <div key={mo.n} onClick={() => setMonth(mo.n)} style={{ ...S.card, borderColor:active?c.border:brd, borderWidth:active?1.5:0.5, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, color:txtT, minWidth:54 }}>Month {mo.n}</span>
                  <span style={S.mBadge(mo.tier)}>{mo.tier}</span>
                  {active && <span style={{ fontSize:11, background:c.bg, color:c.text, padding:"1px 7px", borderRadius:10, fontWeight:500 }}>active</span>}
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
}
