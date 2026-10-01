import test from "node:test";
import assert from "node:assert/strict";
import worker, { getData, postLog, postAsk } from "../worker/index.js";
import { FakeD1 } from "./fake-d1.js";

function req(path, opts = {}) {
  return new Request(`https://example.com${path}`, opts);
}

// ---- OPTIONS preflight ----------------------------------------------------

test("OPTIONS returns 204 with CORS headers", async () => {
  const res = await worker.fetch(req("/api/data", { method: "OPTIONS" }), {});
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(res.headers.get("Access-Control-Allow-Methods"), "GET, POST, PATCH, OPTIONS");
});

// ---- Auth gate --------------------------------------------------------------

test("401 when APP_PASSWORD is set and no Authorization header is sent", async () => {
  const env = { APP_PASSWORD: "secret", DB: new FakeD1() };
  const res = await worker.fetch(req("/api/data"), env);
  assert.equal(res.status, 401);
  assert.equal(await res.text(), "Authentication required.");
});

test("401 when the Basic auth password is wrong", async () => {
  const env = { APP_PASSWORD: "secret", DB: new FakeD1() };
  const bad = "Basic " + Buffer.from("user:wrong").toString("base64");
  const res = await worker.fetch(req("/api/data", { headers: { Authorization: bad } }), env);
  assert.equal(res.status, 401);
});

test("no APP_PASSWORD configured means the gate is disabled (fail-open)", async () => {
  const env = { DB: new FakeD1() };
  const res = await worker.fetch(req("/api/data"), env);
  assert.equal(res.status, 200);
});

// ---- GET /api/data ----------------------------------------------------------

test("GET /api/data returns the expected shape", async () => {
  const db = new FakeD1({
    daily_plan: { first: { date: "2026-09-06", content: "plan", generated_at: "t" } },
    frontier: { first: null },
    advisory: { first: null },
    "FROM study_log": { all: { results: [{ date: "2026-09-06", hours: 2, topic: "dsa", track: "dsa", notes: "", created_at: "t" }] } },
    "FROM status": { all: { results: [{ key: "phase", value: "1", updated_at: "t" }] } },
    tutor_qa: { all: { results: [] } },
    skill_coverage: { all: { results: [] } },
    "FROM applications": { all: { results: [] } },
    "FROM artifacts": { all: { results: [] } },
    gate_check: { all: { results: [] } },
    v_funnel_by_tier: { all: { results: [] } },
    v_funnel: { first: null },
    "FROM job_postings": { all: { results: [{ id: 1, skills: "[\"go\"]" }] } },
  });
  const res = await getData({ DB: db });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.plan.date, "2026-09-06");
  assert.equal(body.status.phase, "1");
  assert.deepEqual(body.log[0].topic, "dsa");
  assert.deepEqual(body.postings[0].skills, ["go"]);
});

test("a malformed JSON column does not fail the /api/data request", async () => {
  const db = new FakeD1({
    daily_plan: { first: null },
    frontier: { first: null },
    advisory: { first: null },
    "FROM study_log": { all: { results: [] } },
    "FROM status": { all: { results: [] } },
    tutor_qa: { all: { results: [] } },
    skill_coverage: { all: { results: [] } },
    "FROM applications": { all: { results: [] } },
    "FROM artifacts": { all: { results: [] } },
    gate_check: { all: { results: [] } },
    v_funnel_by_tier: { all: { results: [] } },
    v_funnel: { first: null },
    "FROM job_postings": { all: { results: [{ id: 1, skills: "{not valid json" }] } },
  });
  const res = await getData({ DB: db });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.postings[0].skills, []);
});

// ---- POST /api/log ------------------------------------------------------

test("POST /api/log with a valid body inserts and returns ok", async () => {
  const db = new FakeD1({
    "INSERT INTO study_log": { run: { meta: { last_row_id: 42 } } },
  });
  const res = await postLog(req("/api/log", { method: "POST", body: JSON.stringify({ hours: 2.5, topic: "dsa", track: "dsa", notes: "n" }) }), { DB: db });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.id, 42);
  const insertCall = db.calls.find(c => c.sql.includes("INSERT INTO study_log"));
  assert.ok(insertCall, "insert should have been called");
  assert.equal(insertCall.params[1], 2.5); // hours
  assert.equal(insertCall.params[2], "dsa"); // topic
  assert.equal(insertCall.params[3], "dsa"); // track
});

test("POST /api/log rejects a non-JSON body without inserting", async () => {
  const db = new FakeD1();
  const res = await postLog(req("/api/log", { method: "POST", body: "not json" }), { DB: db });
  assert.equal(res.status, 400); // regression: used to be a 500 from the outer catch
  assert.equal(db.calls.length, 0);
});

test("POST /api/log rejects a body missing required fields", async () => {
  const db = new FakeD1();
  const res = await postLog(req("/api/log", { method: "POST", body: JSON.stringify({ hours: 1 }) }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

test("POST /api/log rejects hours sent as a string", async () => {
  const db = new FakeD1();
  const res = await postLog(req("/api/log", { method: "POST", body: JSON.stringify({ hours: "2", topic: "dsa" }) }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

test("POST /api/log rejects non-positive hours", async () => {
  const db = new FakeD1();
  const res = await postLog(req("/api/log", { method: "POST", body: JSON.stringify({ hours: 0, topic: "dsa" }) }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

// ---- POST /api/ask --------------------------------------------------------

test("POST /api/ask with a valid body inserts and returns ok", async () => {
  const db = new FakeD1({
    "INSERT INTO tutor_qa": { run: { meta: { last_row_id: 7 } } },
  });
  const res = await postAsk(req("/api/ask", { method: "POST", body: JSON.stringify({ question: "  what is a heap?  " }) }), { DB: db });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, 7);
  const insertCall = db.calls.find(c => c.sql.includes("INSERT INTO tutor_qa"));
  assert.equal(insertCall.params[1], "what is a heap?"); // trimmed
});

test("POST /api/ask rejects a non-JSON body without inserting", async () => {
  const db = new FakeD1();
  const res = await postAsk(req("/api/ask", { method: "POST", body: "not json" }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

test("POST /api/ask rejects a body missing the question field", async () => {
  const db = new FakeD1();
  const res = await postAsk(req("/api/ask", { method: "POST", body: JSON.stringify({}) }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

test("POST /api/ask rejects a question sent as a number", async () => {
  const db = new FakeD1();
  const res = await postAsk(req("/api/ask", { method: "POST", body: JSON.stringify({ question: 42 }) }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

test("POST /api/ask rejects a blank/whitespace-only question", async () => {
  const db = new FakeD1();
  const res = await postAsk(req("/api/ask", { method: "POST", body: JSON.stringify({ question: "   " }) }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

// ---- 404 for unknown /api paths --------------------------------------------

test("unknown /api path returns 404", async () => {
  const env = { DB: new FakeD1() };
  const res = await worker.fetch(req("/api/nope"), env);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "Not found" });
});
