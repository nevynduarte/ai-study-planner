/**
 * Cloudflare Worker — serves the static React app (via the [assets] binding)
 * and the D1-backed API. P620 writes the content into D1; this Worker only
 * reads it, plus accepts a handful of writes from the browser.
 *
 * Routes:
 *   GET   /api/data        → latest plan/frontier/advisory + log + status + tutor Q&A
 *                            + applications + artifacts + gate + funnel + funnel_by_tier
 *   POST  /api/log         → insert a study_log row
 *   POST  /api/ask         → insert a tutor_qa question (answered later by P620)
 *   POST  /api/application → create an application row
 *   PATCH /api/application → advance/update an application (always bumps last_touch)
 *   POST  /api/artifact    → create an artifact row
 *   PATCH /api/artifact    → update an artifact (shipped requires evidence_url)
 *   PATCH /api/gate        → record a gate-criterion check (stamps checked_at)
 *   everything else        → static assets (the built SPA)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

// Constant-time string comparison to prevent password timing side-channel attacks.
// An attacker making many timed requests could otherwise infer the password
// character-by-character via === short-circuit evaluation.
// Uses crypto.subtle.timingSafeEqual (Cloudflare Workers extension) when
// available; falls back to a constant-time XOR accumulator in Node test runs.
function timingSafeStringEqual(a, b) {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.byteLength !== bb.byteLength) return false;
  if (typeof crypto !== "undefined" && crypto.subtle?.timingSafeEqual) {
    return crypto.subtle.timingSafeEqual(ba, bb);
  }
  let acc = 0;
  for (let i = 0; i < ba.byteLength; i++) acc |= ba[i] ^ bb[i];
  return acc === 0;
}

// Single-user HTTP Basic Auth gate. Set the password with:
//   wrangler secret put APP_PASSWORD
// Any username works; only the password is checked. If APP_PASSWORD is not
// configured the gate is disabled (fail-open) so a deploy can't lock you out.
function authorized(request, env) {
  if (!env.APP_PASSWORD) return true;
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded = "";
  try { decoded = atob(header.slice(6)); } catch { return false; }
  // indexOf returns -1 when there is no colon; guard explicitly so a
  // credential payload without a colon cannot bypass the check.
  const colon = decoded.indexOf(":");
  if (colon === -1) return false;
  return timingSafeStringEqual(decoded.slice(colon + 1), env.APP_PASSWORD);
}

const VALID_TRACKS = ["dsa", "ml-recall", "sys-design", "search"];
const VALID_STAGES = ["applied", "screen", "onsite", "offer", "closed"];
const VALID_TIERS = ["series-bd", "midsize", "quant-eng", "hyperscaler", "frontier-lab"];
const VALID_OUTCOMES = ["active", "rejected", "withdrawn", "accepted", "declined"];
const VALID_KINDS = ["reproduction", "oss-pr", "blog-post", "system", "resume"];
const VALID_ARTIFACT_STATUS = ["planned", "in-progress", "shipped"];
const VALID_CRITERIA = ["dsa", "sysdesign", "recall", "assets"];

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!authorized(request, env)) {
      return new Response("Authentication required.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="ai-study-planner"', ...CORS_HEADERS },
      });
    }

    const { pathname } = new URL(request.url);
    const m = request.method;

    if (pathname === "/api/data" && m === "GET")  return getData(env);
    if (pathname === "/api/log"  && m === "POST") return postLog(request, env);
    if (pathname === "/api/ask"  && m === "POST") return postAsk(request, env);
    if (pathname === "/api/application" && m === "POST")  return postApplication(request, env);
    if (pathname === "/api/application" && m === "PATCH") return patchApplication(request, env);
    if (pathname === "/api/artifact" && m === "POST")  return postArtifact(request, env);
    if (pathname === "/api/artifact" && m === "PATCH") return patchArtifact(request, env);
    if (pathname === "/api/gate" && m === "PATCH") return patchGate(request, env);
    if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

    // Non-API requests → static assets (React app)
    return env.ASSETS.fetch(request);
  },
};

async function getData(env) {
  try {
    const db = env.DB;
    const [plan, frontier, advisory, log, statusRows, questions, coverage,
           applications, artifacts, gate, funnel, funnelByTier] = await Promise.all([
      db.prepare("SELECT date, content, generated_at FROM daily_plan ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, content, generated_at FROM frontier ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, content, generated_at FROM advisory ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, hours, topic, track, notes, created_at FROM study_log ORDER BY id DESC LIMIT 100").all(),
      db.prepare("SELECT key, value, updated_at FROM status").all(),
      db.prepare("SELECT id, date, question, answer, created_at, answered_at FROM tutor_qa ORDER BY id DESC LIMIT 50").all(),
      db.prepare("SELECT track, skill, status, updated_at FROM skill_coverage").all(),
      db.prepare("SELECT * FROM applications ORDER BY last_touch DESC, id DESC LIMIT 200").all().catch(() => ({ results: [] })),
      db.prepare("SELECT * FROM artifacts ORDER BY id").all().catch(() => ({ results: [] })),
      db.prepare("SELECT criterion, passed, checked_at, evidence, notes FROM gate_check").all().catch(() => ({ results: [] })),
      db.prepare("SELECT * FROM v_funnel").first().catch(() => null),
      db.prepare("SELECT * FROM v_funnel_by_tier").all().catch(() => ({ results: [] })),
    ]);
    const status = {};
    for (const r of statusRows.results || []) status[r.key] = r.value;
    return json({
      plan: plan || null,
      frontier: frontier || null,
      advisory: advisory || null,
      log: log.results || [],
      status,
      questions: questions.results || [],
      coverage: coverage.results || [],
      applications: applications.results || [],
      artifacts: artifacts.results || [],
      gate: gate.results || [],
      funnel: funnel || null,
      funnel_by_tier: funnelByTier.results || [],
    });
  } catch (e) {
    console.error("getData:", e);
    return json({ error: "Internal server error" }, 500);
  }
}

async function postLog(request, env) {
  try {
    const { hours, topic, track, notes } = await request.json();
    if (!topic || !hours || Number(hours) <= 0) {
      return json({ error: "topic and positive hours required" }, 400);
    }
    const trackVal = VALID_TRACKS.includes(track) ? track : null;
    const date = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare("INSERT INTO study_log (date, hours, topic, track, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(date, Number(hours), String(topic), trackVal, notes ? String(notes) : "", now)
      .run();
    return json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    console.error("postLog:", e);
    return json({ error: "Internal server error" }, 500);
  }
}

async function postAsk(request, env) {
  try {
    const { question } = await request.json();
    if (!question || !String(question).trim()) {
      return json({ error: "question required" }, 400);
    }
    const date = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare("INSERT INTO tutor_qa (date, question, created_at) VALUES (?, ?, ?)")
      .bind(date, String(question).trim(), now)
      .run();
    return json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    console.error("postAsk:", e);
    return json({ error: "Internal server error" }, 500);
  }
}

async function postApplication(request, env) {
  try {
    const b = await request.json();
    if (!b.company || !b.role) return json({ error: "company and role required" }, 400);
    const stage = b.stage || "applied";
    if (!VALID_STAGES.includes(stage)) return json({ error: `stage must be one of ${VALID_STAGES.join("/")}` }, 400);
    if (b.tier && !VALID_TIERS.includes(b.tier)) {
      return json({ error: `tier must be one of ${VALID_TIERS.join("/")}` }, 400);
    }
    if (b.outcome && !VALID_OUTCOMES.includes(b.outcome)) {
      return json({ error: `outcome must be one of ${VALID_OUTCOMES.join("/")}` }, 400);
    }
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare(`INSERT INTO applications
        (company, role, tier, source, comp_low, comp_high, stage, outcome,
         applied_date, last_touch, contact, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        String(b.company), String(b.role), b.tier ?? null, b.source ?? null,
        b.comp_low != null ? Number(b.comp_low) : null,
        b.comp_high != null ? Number(b.comp_high) : null,
        stage, b.outcome ?? "active",
        b.applied_date ?? now.slice(0, 10), now,
        b.contact ?? null, b.notes ?? null, now, now,
      )
      .run();
    return json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function patchApplication(request, env) {
  try {
    const b = await request.json();
    if (!b.id) return json({ error: "id required" }, 400);
    if (b.stage !== undefined && !VALID_STAGES.includes(b.stage)) {
      return json({ error: `stage must be one of ${VALID_STAGES.join("/")}` }, 400);
    }
    if (b.outcome !== undefined && !VALID_OUTCOMES.includes(b.outcome)) {
      return json({ error: `outcome must be one of ${VALID_OUTCOMES.join("/")}` }, 400);
    }
    const now = new Date().toISOString();
    const sets = ["last_touch = ?", "updated_at = ?"];
    const vals = [now, now];
    for (const field of ["stage", "outcome", "notes", "contact"]) {
      if (b[field] !== undefined) { sets.push(`${field} = ?`); vals.push(String(b[field])); }
    }
    vals.push(Number(b.id));
    const res = await env.DB
      .prepare(`UPDATE applications SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...vals)
      .run();
    if (!res.meta?.changes) return json({ error: "application not found" }, 404);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function postArtifact(request, env) {
  try {
    const b = await request.json();
    if (!b.title || !b.kind) return json({ error: "title and kind required" }, 400);
    if (!VALID_KINDS.includes(b.kind)) return json({ error: `kind must be one of ${VALID_KINDS.join("/")}` }, 400);
    const status = b.status || "planned";
    if (!VALID_ARTIFACT_STATUS.includes(status)) {
      return json({ error: `status must be one of ${VALID_ARTIFACT_STATUS.join("/")}` }, 400);
    }
    if (status === "shipped" && !b.evidence_url) {
      return json({ error: "shipped requires evidence_url" }, 400);
    }
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare(`INSERT INTO artifacts
        (title, kind, track, status, evidence_url, done_when, phase, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        String(b.title), b.kind,
        VALID_TRACKS.includes(b.track) ? b.track : null,
        status, b.evidence_url ?? null, b.done_when ?? null,
        b.phase != null ? Number(b.phase) : null, now, now,
      )
      .run();
    return json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function patchArtifact(request, env) {
  try {
    const b = await request.json();
    if (!b.id) return json({ error: "id required" }, 400);
    if (b.status !== undefined && !VALID_ARTIFACT_STATUS.includes(b.status)) {
      return json({ error: `status must be one of ${VALID_ARTIFACT_STATUS.join("/")}` }, 400);
    }
    // Shipped requires evidence — that rule is the point of the table.
    if (b.status === "shipped" && !b.evidence_url) {
      const row = await env.DB
        .prepare("SELECT evidence_url FROM artifacts WHERE id = ?")
        .bind(Number(b.id)).first();
      if (!row) return json({ error: "artifact not found" }, 404);
      if (!row.evidence_url) {
        return json({ error: "cannot mark shipped without evidence_url — ship the thing, then record it" }, 400);
      }
    }
    const now = new Date().toISOString();
    const sets = ["updated_at = ?"];
    const vals = [now];
    for (const field of ["status", "evidence_url", "done_when", "title"]) {
      if (b[field] !== undefined) { sets.push(`${field} = ?`); vals.push(String(b[field])); }
    }
    vals.push(Number(b.id));
    const res = await env.DB
      .prepare(`UPDATE artifacts SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...vals)
      .run();
    if (!res.meta?.changes) return json({ error: "artifact not found" }, 404);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function patchGate(request, env) {
  try {
    const b = await request.json();
    if (!b.criterion || !VALID_CRITERIA.includes(b.criterion)) {
      return json({ error: `criterion must be one of ${VALID_CRITERIA.join("/")}` }, 400);
    }
    if (b.passed === undefined) return json({ error: "passed required" }, 400);
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare(`UPDATE gate_check SET passed = ?, checked_at = ?,
                evidence = COALESCE(?, evidence), notes = COALESCE(?, notes)
                WHERE criterion = ?`)
      .bind(b.passed ? 1 : 0, now, b.evidence ?? null, b.notes ?? null, b.criterion)
      .run();
    if (!res.meta?.changes) return json({ error: "criterion not found — run migration 002" }, 404);
    return json({ ok: true, checked_at: now });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
