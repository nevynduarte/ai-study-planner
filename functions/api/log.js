/**
 * POST /api/log — log a study session into D1.
 * Body: { hours, topic, notes }
 */
export async function onRequestPost({ request, env }) {
  try {
    const { hours, topic, notes } = await request.json();
    if (!topic || !hours || Number(hours) <= 0) {
      return Response.json({ error: "topic and positive hours required" }, { status: 400 });
    }
    const date = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const res = await env.DB
      .prepare("INSERT INTO study_log (date, hours, topic, notes, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(date, Number(hours), String(topic), notes ? String(notes) : "", now)
      .run();
    return Response.json({ ok: true, id: res.meta?.last_row_id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
