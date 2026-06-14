/**
 * GET /api/data — everything the frontend displays, read from D1.
 * Returns the latest plan / frontier / advisory, the study log, the
 * status map, and tutor Q&A. All written by P620; the web only reads here.
 */
export async function onRequestGet({ env }) {
  try {
    const db = env.DB;
    const [plan, frontier, advisory, log, statusRows, questions] = await Promise.all([
      db.prepare("SELECT date, content, generated_at FROM daily_plan ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, content, generated_at FROM frontier ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, content, generated_at FROM advisory ORDER BY generated_at DESC LIMIT 1").first(),
      db.prepare("SELECT date, hours, topic, notes, created_at FROM study_log ORDER BY id DESC LIMIT 100").all(),
      db.prepare("SELECT key, value, updated_at FROM status").all(),
      db.prepare("SELECT id, date, question, answer, created_at, answered_at FROM tutor_qa ORDER BY id DESC LIMIT 50").all(),
    ]);

    const status = {};
    for (const r of statusRows.results || []) status[r.key] = r.value;

    return Response.json({
      plan: plan || null,
      frontier: frontier || null,
      advisory: advisory || null,
      log: log.results || [],
      status,
      questions: questions.results || [],
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
