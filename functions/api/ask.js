/**
 * POST /api/ask — submit a tutor question into D1 (answer filled later).
 * Body: { question }
 * P620's hourly answer-questions.sh fills in answer + answered_at.
 */
export async function onRequestPost({ request, env }) {
  try {
    const { question } = await request.json();
    if (!question || !String(question).trim()) {
      return Response.json({ error: "question required" }, { status: 400 });
    }
    const date = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare("INSERT INTO tutor_qa (date, question, created_at) VALUES (?, ?, ?)")
      .bind(date, String(question).trim(), now)
      .run();
    return Response.json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
