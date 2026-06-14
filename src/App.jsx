import { useState, useEffect, useCallback } from "react";

// ─── Roadmap (static reference) ───────────────────────────────────
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

// ─── Data layer — reads/writes our Cloudflare Pages Functions (D1) ──────
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
const roiBg    = (s) => s >= 85 ? "#E6F1FB" : s >= 75 ? "#EAF3DE" : s >= 65 ? "#FAEEDA" : "#FCEBEB";

export default function App() {
  const [tab,     setTab]     = useState("today");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  // Log-session form
  const [logH, setLogH] = useState(""); const [logT, setLogT] = useState("");
  const [logN, setLogN] = useState(""); const [logMsg, setLogMsg] = useState("");
  // Tutor question form
  const [q, setQ] = useState(""); const [asking, setAsking] = useState(false); const [askMsg, setAskMsg] = useState("");

  const load = useCallback(async () => {
    try { setErr(""); setData(await getJSON("/api/data")); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const status    = data?.status || {};
  const month     = Number(status.current_month) || 1;
  const m         = MONTHS[month - 1] || MONTHS[0];
  const log       = data?.log || [];
  const questions = data?.questions || [];
  const plan      = data?.plan || null;
  const frontier  = data?.frontier || null;
  const advisory  = data?.advisory || null;

  const totalHrs = log.reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - (now.getDay() || 7) + 1); monday.setHours(0,0,0,0);
  const weekHrs = log.filter(e => new Date(e.date + "T12:00:00") >= monday).reduce((s, e) => s + Number(e.hours), 0);

  async function logSession() {
    if (!logT || !logH || parseFloat(logH) <= 0) { setLogMsg("Enter topic and hours."); return; }
    try {
      await postJSON("/api/log", { hours: parseFloat(logH), topic: logT, notes: logN });
      setLogH(""); setLogT(""); setLogN("");
      setLogMsg(`Logged ${logH}h on "${logT}"`); setTimeout(() => setLogMsg(""), 3000);
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
    tab:    (a) => ({ fontSize:13, fontWeight:a?500:400, padding:"6px 14px", background:"none", border:"none", cursor:"pointer", color:a?txt:txtT, borderBottom:a?`2px solid ${txt}`:"2px solid transparent", marginBottom:-1 }),
    btn:    (p, dis) => ({ fontSize:13, padding:"7px 14px", borderRadius:8, cursor:dis?"not-allowed":"pointer", border:`0.5px solid ${brdS}`, opacity:dis?0.5:1, background:p?txt:"transparent", color:p?bg:txt, fontWeight:400 }),
    inp:    { fontSize:13, padding:"7px 10px", borderRadius:8, border:`0.5px solid ${brdS}`, background:bg, color:txt, width:"100%", boxSizing:"border-box" },
    pre:    { fontSize:13, lineHeight:1.75, color:txt, whiteSpace:"pre-wrap", margin:0, fontFamily:"inherit" },
    lbl:    { fontSize:11, color:txtT, marginBottom:4, display:"block" },
    statBg: { background:bgS, borderRadius:8, padding:"10px 14px" },
    mBadge: (tier) => { const c=TIER_COLORS[tier]||TIER_COLORS.Foundation; return { fontSize:11, padding:"2px 8px", borderRadius:10, background:c.bg, color:c.text, fontWeight:500 }; },
    roiBadge:(s) => ({ fontSize:11, padding:"2px 8px", borderRadius:10, background:roiBg(s), color:roiColor(s), fontWeight:500 }),
    stamp:  { fontSize:11, color:txtT },
  };

  const TABS = ["today","tutor","frontier","advisory","log","roadmap"];

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
      {item?.content ? <pre style={S.pre}>{item.content}</pre> : <div style={{ fontSize:13, color:txtT }}>{empty}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", maxWidth:780, margin:"0 auto", padding:"1.25rem 1rem 4rem", color:txt }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.25rem" }}>
        <div>
          <div style={{ fontSize:19, fontWeight:500 }}>Elite AI Engineering Planner</div>
          <div style={{ fontSize:12, color:txtT, marginTop:3 }}>{todayFmt()} · Month {month}: {m.title}</div>
        </div>
        <button style={{ ...S.btn(false, loading), fontSize:12 }} onClick={load} disabled={loading}>{loading?"…":"Refresh"}</button>
      </div>

      {err && (
        <div style={{ background:"#FCEBEB", border:"0.5px solid #E24B4A", borderRadius:8, padding:"10px 14px", marginBottom:"0.875rem", fontSize:13, color:"#501313" }}>
          {err} — is the D1 binding configured on Cloudflare Pages?
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
            {[["Total hours",totalHrs],["This week",`${weekHrs}/70`],["Month",`${month}/12`],["Sessions",log.length]].map(([l,v]) => (
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
                <div style={{ fontSize:11, color:txtT, marginBottom:4 }}>Active month — set on P620 (config/status.json)</div>
                <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>Month {m.n} — {m.title}</div>
                <span style={S.mBadge(m.tier)}>{m.tier}</span>
              </div>
              <span style={S.roiBadge(m.roi)}>ROI {m.roi}</span>
            </div>
            <div style={{ fontSize:13, color:txtS, lineHeight:1.65, borderTop:`0.5px solid ${brd}`, paddingTop:10 }}>{m.focus}</div>
          </div>

          <ContentCard
            title="Today's plan"
            sub="Generated automatically at 6am ET"
            item={plan}
            empty="P620 writes a time-blocked 10-hour plan here every morning at 6am ET."
          />

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
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Ask your tutor</div>
            <div style={{ ...S.stamp, marginBottom:10 }}>Questions save to D1. P620 answers on its next hourly run and the answer appears below.</div>
            <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Type a question — knows your background, log, and interview targets…" style={{ ...S.inp, resize:"vertical", minHeight:80, lineHeight:1.6 }} disabled={asking} />
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
                ? <pre style={{ ...S.pre, borderTop:`0.5px solid ${brd}`, paddingTop:10 }}>{item.answer}</pre>
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
            title="Frontier paper digest"
            sub={`Web search — relevant to Month ${month}`}
            item={frontier}
            empty="P620 pulls the most important recent AI papers relevant to your current month every morning."
          />
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>Weekly rhythm</div>
            <div style={{ fontSize:13, color:txtS, lineHeight:1.75 }}>
              <strong>Monday</strong> — Scan READ NOW items from the digest.{"\n\n"}
              <strong>Wednesday</strong> — Deep-read one paper. Log it. Ask the Tutor to explain anything confusing.{"\n\n"}
              <strong>Friday</strong> — Ask the Tutor: "Should any paper this week change my Month {month} plan?"
            </div>
          </div>
        </div>
      )}

      {/* ── ADVISORY (read-only) ── */}
      {tab==="advisory" && (
        <div>
          <ContentCard
            title="Plan health advisory"
            sub="Analyzes your full log against ROI priorities and target roles"
            item={advisory}
            empty="P620 runs a brutally honest plan-health check nightly (11pm ET) and writes it here."
          />
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
          <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Study log — {log.length} sessions · {totalHrs}h total</div>
          {log.length===0 && <div style={{ fontSize:13, color:txtT }}>No sessions yet. Log your first on the Today tab.</div>}
          {log.map((e,i,arr) => (
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

      {/* ── ROADMAP (highlights current month) ── */}
      {tab==="roadmap" && MONTHS.map(mo => {
        const c = TIER_COLORS[mo.tier] || TIER_COLORS.Foundation;
        const active = mo.n === month;
        return (
          <div key={mo.n} style={{ ...S.card, borderColor:active?c.border:brd, borderWidth:active?1.5:0.5 }}>
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
