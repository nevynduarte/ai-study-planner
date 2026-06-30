/**
 * Cloudflare Worker — serves the static React app (via the [assets] binding)
 * and the D1-backed API. P620 writes the content into D1; this Worker only
 * reads it, plus accepts two writes from the browser: log a session, ask a
 * tutor question.
 *
 * Routes:
 *   GET  /api/data → latest plan/frontier/advisory + log + status + tutor Q&A
 *   POST /api/log  → insert a study_log row
 *   POST /api/ask  → insert a tutor_qa question (answered later by P620)
 *   everything else → static assets (the built SPA)
 */

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

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
  return decoded.slice(decoded.indexOf(":") + 1) === env.APP_PASSWORD;
}

export default {
  async fetch(request, env) {
    if (!authorized(request, env)) {
      return new Response("Authentication required.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="ai-study-planner"' },
      });
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/api/data"     && request.method === "GET")   return getData(env);
    if (pathname === "/api/log"      && request.method === "POST")  return postLog(request, env);
    if (pathname === "/api/ask"      && request.method === "POST")  return postAsk(request, env);
    if (pathname === "/api/coverage" && request.method === "PATCH") return patchCoverage(request, env);
    if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

    // Non-API requests → static assets (React app)
    return env.ASSETS.fetch(request);
  },
};

async function getData(env) {
  try {
    const db = env.DB;
    const [plan, frontier, advisory, log, statusRows, questions, coverage] = await Promise.all([
      db.prepare("SELECT date, content, generated_at FROM daily_plan ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, content, generated_at FROM frontier ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, content, generated_at FROM advisory ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, hours, topic, track, notes, created_at FROM study_log ORDER BY id DESC LIMIT 100").all(),
      db.prepare("SELECT key, value, updated_at FROM status").all(),
      db.prepare("SELECT id, date, question, answer, created_at, answered_at FROM tutor_qa ORDER BY id DESC LIMIT 50").all(),
      db.prepare("SELECT track, skill, status, updated_at FROM skill_coverage").all(),
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
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function postLog(request, env) {
  try {
    const { hours, topic, track, notes } = await request.json();
    if (!topic || !hours || Number(hours) <= 0) {
      return json({ error: "topic and positive hours required" }, 400);
    }
    const VALID_TRACKS = ["ai-eng", "ml-eng", "data-sci", "quant"];
    const trackVal = VALID_TRACKS.includes(track) ? track : null;
    const date = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare("INSERT INTO study_log (date, hours, topic, track, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(date, Number(hours), String(topic), trackVal, notes ? String(notes) : "", now)
      .run();
    return json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    return json({ error: e.message }, 500);
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
    return json({ error: e.message }, 500);
  }
}

const VALID_STATUSES = ["not-started", "learning", "built", "interview-ready"];

async function patchCoverage(request, env) {
  try {
    const body = await request.json();
    const track  = body.track  ? String(body.track).trim()  : "";
    const skill  = body.skill  ? String(body.skill).trim()  : "";
    const status = body.status ? String(body.status).trim() : "";

    if (!track || track.length > 50)      return json({ error: "track required (max 50 chars)" }, 400);
    if (!skill || skill.length > 200)     return json({ error: "skill required (max 200 chars)" }, 400);
    if (!VALID_STATUSES.includes(status)) return json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(
        `INSERT INTO skill_coverage (track, skill, status, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(track, skill) DO UPDATE
           SET status = excluded.status, updated_at = excluded.updated_at`
      )
      .bind(track, skill, status, now)
      .run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
