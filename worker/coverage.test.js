/**
 * Tests for PATCH /api/coverage — manual skill coverage updates.
 * Run with: node --test worker/coverage.test.js  (Node 18+)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

// Minimal D1 stub. Tracks the last bind() call so we can assert the written
// values. prepare() returns a builder whose run() always succeeds.
function makeDB() {
  const db = {
    _lastBind: [],
    prepare(sql) {
      db._sql = sql;
      return {
        bind(...args) { db._lastBind = args; return { run: async () => ({}) }; },
        first:  async () => null,
        all:    async () => ({ results: [] }),
      };
    },
  };
  return db;
}

function patch(path, body, env) {
  return worker.fetch(
    new Request(`https://x.test${path}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }),
    env,
  );
}

// ── valid inputs ───────────────────────────────────────────────────────────

describe("PATCH /api/coverage — valid inputs", () => {
  it("advances a skill to 'learning'", async () => {
    const db = makeDB();
    const res = await patch("/api/coverage", { track: "ai-eng", skill: "Transformers", status: "learning" }, { DB: db });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(db._lastBind[0], "ai-eng");
    assert.equal(db._lastBind[1], "Transformers");
    assert.equal(db._lastBind[2], "learning");
  });

  it("accepts all four valid statuses", async () => {
    const statuses = ["not-started", "learning", "built", "interview-ready"];
    for (const status of statuses) {
      const db = makeDB();
      const res = await patch("/api/coverage", { track: "ml-eng", skill: "PyTorch", status }, { DB: db });
      assert.equal(res.status, 200, `expected 200 for status=${status}`);
      assert.equal(db._lastBind[2], status, `DB should store status=${status}`);
    }
  });

  it("trims leading/trailing whitespace from track and skill", async () => {
    const db = makeDB();
    const res = await patch("/api/coverage",
      { track: "  data-sci  ", skill: "  Pandas  ", status: "built" }, { DB: db });
    assert.equal(res.status, 200);
    assert.equal(db._lastBind[0], "data-sci");
    assert.equal(db._lastBind[1], "Pandas");
  });

  it("accepts skills with spaces and slashes (curriculum names)", async () => {
    const db = makeDB();
    const res = await patch("/api/coverage",
      { track: "quant", skill: "Alt-data sourcing / scraping", status: "interview-ready" }, { DB: db });
    assert.equal(res.status, 200);
  });
});

// ── invalid inputs ─────────────────────────────────────────────────────────

describe("PATCH /api/coverage — validation errors", () => {
  const env = { DB: makeDB() };

  it("rejects missing track", async () => {
    const res = await patch("/api/coverage", { skill: "Numpy", status: "learning" }, env);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /track/i);
  });

  it("rejects missing skill", async () => {
    const res = await patch("/api/coverage", { track: "ai-eng", status: "built" }, env);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /skill/i);
  });

  it("rejects unknown status", async () => {
    const res = await patch("/api/coverage",
      { track: "ai-eng", skill: "Attention", status: "in-progress" }, env);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /status/i);
  });

  it("rejects empty-string status", async () => {
    const res = await patch("/api/coverage",
      { track: "ai-eng", skill: "RAG", status: "" }, env);
    assert.equal(res.status, 400);
  });

  it("rejects track longer than 50 chars", async () => {
    const res = await patch("/api/coverage",
      { track: "x".repeat(51), skill: "Skill", status: "learning" }, env);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /track/i);
  });

  it("rejects skill longer than 200 chars", async () => {
    const res = await patch("/api/coverage",
      { track: "ai-eng", skill: "x".repeat(201), status: "learning" }, env);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /skill/i);
  });
});

// ── routing ────────────────────────────────────────────────────────────────

describe("routing", () => {
  const env = { DB: makeDB() };

  it("POST /api/coverage is not found (only PATCH is accepted)", async () => {
    const res = await worker.fetch(
      new Request("https://x.test/api/coverage", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } }),
      env,
    );
    assert.equal(res.status, 404);
  });

  it("GET /api/coverage is not found", async () => {
    const res = await worker.fetch(
      new Request("https://x.test/api/coverage", { method: "GET" }),
      env,
    );
    assert.equal(res.status, 404);
  });
});
