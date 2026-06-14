/**
 * daily-briefing.js — runs every morning at 6am ET via GitHub Actions
 * Calls Claude (with web search) → sends SMS via Twilio
 *
 * Required GitHub Secrets:
 *   ANTHROPIC_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_FROM_NUMBER, TO_PHONE_NUMBER, CURRENT_MONTH (optional, default 1)
 */

const CURRENT_MONTH = parseInt(process.env.CURRENT_MONTH || "1", 10);

const MONTHS = [
  { n:1,  title:"Math Foundations & Python Mastery",        focus:"Linear algebra, probability, optimization. NumPy from scratch. Autograd engine." },
  { n:2,  title:"Classical ML — Theory to Production",      focus:"Classical algorithms from scratch. MLflow. Quant factor platform v0." },
  { n:3,  title:"Deep Learning — Neural Networks to CNNs",  focus:"Autograd extended, ResNet from scratch, production image API." },
  { n:4,  title:"Sequence Models & the Transformer",        focus:"Full Transformer from scratch. GPT with KV cache. BPE tokenizer." },
  { n:5,  title:"LLMs — Pre-training to Fine-tuning",       focus:"Pre-training pipeline, LoRA/QLoRA, vLLM. 125M model end-to-end." },
  { n:6,  title:"AI Engineering — RAG, Agents, Production", focus:"Production RAG, coding agent, MCP multi-agent, RAGAS, observability." },
  { n:7,  title:"Systems — GPUs, CUDA, Distributed AI",     focus:"CUDA kernels, FlashAttention, FSDP, Kubernetes ML platform." },
  { n:8,  title:"Reinforcement Learning & Alignment",       focus:"PPO/DQN, RLHF (SFT→RM→PPO), DPO, GRPO reasoning training." },
  { n:9,  title:"Data Engineering, MLOps & AI Products",    focus:"Kafka, Flink, Spark, dbt. Feature platform. Quant research platform." },
  { n:10, title:"Frontier — Multimodal & Research",         focus:"ViT, CLIP, diffusion, Mamba. Multimodal RAG. Paper reproduction." },
  { n:11, title:"Leadership, Product & AI Startup",         focus:"AI product launch. Open-source PR. Blog posts. Conference talk." },
  { n:12, title:"Elite Synthesis — Launch",                 focus:"Distributed inference 1000 QPS. AI OS. Research preprint submitted." },
];

const m = MONTHS[CURRENT_MONTH - 1];
const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
const dayHints = { 1:"Monday: Set weekly goals.", 2:"Tuesday: Code runs today.", 3:"Wednesday: Read one paper end-to-end.", 4:"Thursday: Push something to GitHub.", 5:"Friday: Write 500+ words of technical content.", 6:"Saturday: Long project block.", 0:"Sunday: Review notes, plan next week." };
const dayHint = dayHints[new Date().getDay()] || "";

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `You are a daily AI study briefing generator for Nevyn Duarte.
Context: BS Math UT Austin, MS Data Science CU Boulder (GPA 3.84), Co-Founder/CTO Bridges AI, ex-quantitative equity researcher M Science/Jefferies. Target roles: D.E. Shaw Applied AI + Alt Data Analyst, Woodline Partners Sector Data Analyst. 10 hrs/day commitment.
Current: Month ${CURRENT_MONTH}/12 — "${m.title}" | Focus: ${m.focus}
Today: ${today} | ${dayHint}
ROI priority: Production AI systems → Distributed systems → LLM internals → AI product dev → Fine-tuning → MLOps → Evaluation
Write a TIGHT, SPECIFIC morning SMS briefing. No fluff.`,
      messages: [{ role:"user", content: prompt }],
      tools: [{ type:"web_search_20250305", name:"web_search" }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Claude: ${data.error.message}`);
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
}

async function sendSMS(body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
    },
    body: new URLSearchParams({ From:process.env.TWILIO_FROM_NUMBER, To:process.env.TO_PHONE_NUMBER, Body:body }).toString(),
  });
  const data = await res.json();
  if (data.error_code) throw new Error(`Twilio ${data.error_code}: ${data.message}`);
  return data.sid;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Month ${CURRENT_MONTH} briefing…`);

  let briefing;
  try {
    briefing = await callClaude(
      `Search for 1–2 important AI/ML papers or developments from the past 5 days relevant to: "${m.focus}".

Then write a morning SMS. Format EXACTLY (keep under 900 chars):

📅 ${today}
Month ${CURRENT_MONTH}: ${m.title}

🎯 TODAY'S FOCUS:
[2–3 specific executable tasks — exact algorithms, papers, or code deliverables. Reference: ${dayHint}]

🔬 FRONTIER:
[1–2 sentences on the most relevant recent paper/development + why it matters for D.E. Shaw / Woodline targets]

⚡ DO NOT SKIP:
[Single item that compounds most into tomorrow]`
    );
  } catch (err) {
    console.error("Claude failed:", err.message);
    briefing = `📅 ${today}\nMonth ${CURRENT_MONTH}: ${m.title}\n\nFocus: ${m.focus}\n\n⚠️ Claude API unavailable — check GitHub Actions logs.`;
  }

  const sms = briefing.length > 1400 ? briefing.slice(0, 1397) + "…" : briefing;

  try {
    const sid = await sendSMS(sms);
    console.log(`SMS sent. SID: ${sid}`);
  } catch (err) {
    console.error("Twilio failed:", err.message);
    process.exit(1);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
