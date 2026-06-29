/**
 * Unit tests for worker/index.js — covers input validation in postLog and
 * postAsk. Run with: node --test worker/index.test.js (Node 18+).
 *
 * No external test framework — uses Node's built-in node:test runner.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

// Minimal D1 mock: every write succeeds and returns last_row_id = 1.
const mockDB = {
  prepare(sql) {
    return {
      bind(...args) {
        return { run: async () => ({ meta: { last_row_id: 1 } }) };
      },
      first: async () => null,
      all: async () => ({ results: [] }),
    };
  },
};

// No APP_PASSWORD → auth gate is disabled (fail-open by design).
const env = { DB: mockDB };

function post(path, body) {
  return worker.fetch(
    new Request(`https://x.test${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
  );
}

// ── POST /api/log ──────────────────────────────────────────────────────────

describe("POST /api/log — valid inputs", () => {
  it("accepts integer hours and plain topic", async () => {
    const res = await post("/api/log", { hours: 2, topic: "Transformers" });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  it("accepts fractional hours (0.5)", async () => {
    const res = await post("/api/log", { hours: 0.5, topic: "Attention mechanisms" });
    assert.equal(res.status, 200);
  });

  it("accepts hours = 24 (maximum boundary)", async () => {
    const res = await post("/api/log", { hours: 24, topic: "Marathon session" });
    assert.equal(res.status, 200);
  });

  it("accepts topic of exactly 500 chars", async () => {
    const res = await post("/api/log", { hours: 1, topic: "x".repeat(500) });
    assert.equal(res.status, 200);
  });

  it("maps unrecognised track to null without error", async () => {
    const res = await post("/api/log", { hours: 1, topic: "Topic", track: "unknown" });
    assert.equal(res.status, 200);
  });

  it("accepts all recognised track values", async () => {
    for (const track of ["ai-eng", "ml-eng", "data-sci", "quant"]) {
      const res = await post("/api/log", { hours: 1, topic: "Topic", track });
      assert.equal(res.status, 200, `expected 200 for track=${track}`);
    }
  });
});

describe("POST /api/log — hours validation", () => {
  it("rejects non-numeric string hours ('abc')", async () => {
    // Bug fixed: Number('abc') === NaN; NaN <= 0 is false, so the old code
    // let this through and stored NaN in D1.
    const res = await post("/api/log", { hours: "abc", topic: "Topic" });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /hours/i);
  });

  it("rejects hours = 0", async () => {
    const res = await post("/api/log", { hours: 0, topic: "Topic" });
    assert.equal(res.status, 400);
  });

  it("rejects negative hours", async () => {
    const res = await post("/api/log", { hours: -1, topic: "Topic" });
    assert.equal(res.status, 400);
  });

  it("rejects hours > 24", async () => {
    const res = await post("/api/log", { hours: 25, topic: "Topic" });
    assert.equal(res.status, 400);
  });

  it("rejects hours = null", async () => {
    const res = await post("/api/log", { hours: null, topic: "Topic" });
    assert.equal(res.status, 400);
  });

  it("rejects missing hours field", async () => {
    const res = await post("/api/log", { topic: "Topic" });
    assert.equal(res.status, 400);
  });
});

describe("POST /api/log — topic validation", () => {
  it("rejects missing topic", async () => {
    const res = await post("/api/log", { hours: 2 });
    assert.equal(res.status, 400);
  });

  it("rejects whitespace-only topic", async () => {
    const res = await post("/api/log", { hours: 2, topic: "   " });
    assert.equal(res.status, 400);
  });

  it("rejects topic longer than 500 chars", async () => {
    const res = await post("/api/log", { hours: 2, topic: "x".repeat(501) });
    assert.equal(res.status, 400);
  });
});

// ── POST /api/ask ──────────────────────────────────────────────────────────

describe("POST /api/ask — valid inputs", () => {
  it("accepts a well-formed question", async () => {
    const res = await post("/api/ask", { question: "What is attention?" });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  it("accepts question of exactly 5000 chars", async () => {
    const res = await post("/api/ask", { question: "q".repeat(5000) });
    assert.equal(res.status, 200);
  });
});

describe("POST /api/ask — question validation", () => {
  it("rejects empty string", async () => {
    const res = await post("/api/ask", { question: "" });
    assert.equal(res.status, 400);
  });

  it("rejects whitespace-only question", async () => {
    const res = await post("/api/ask", { question: "   " });
    assert.equal(res.status, 400);
  });

  it("rejects question longer than 5000 chars", async () => {
    const res = await post("/api/ask", { question: "q".repeat(5001) });
    assert.equal(res.status, 400);
  });

  it("rejects missing question field", async () => {
    const res = await post("/api/ask", {});
    assert.equal(res.status, 400);
  });
});
