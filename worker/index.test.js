/**
 * Security tests for worker/index.js.
 * Covers: timing-safe Basic Auth gate, colon-less bypass, error suppression.
 * Run with: node --test worker/index.test.js   (Node 18+, no extra deps)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

// ── Helpers ───────────────────────────────────────────────────────────────

function basicAuth(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

// D1 mock where every operation succeeds.
function mockDB() {
  return {
    prepare() {
      return {
        bind() { return { run: async () => ({ meta: { last_row_id: 1 } }) }; },
        first:  async () => null,
        all:    async () => ({ results: [] }),
      };
    },
  };
}

// D1 mock where every operation throws with an internal message an attacker
// must not see in the HTTP response body.
function breakingDB() {
  const boom = async () => { throw new Error("SENSITIVE_INTERNAL_DETAIL"); };
  return {
    prepare() {
      return { bind() { return { run: boom }; }, first: boom, all: boom };
    },
  };
}

const PASSWORD = "sup3r-s3cr3t!";
const authEnv   = { APP_PASSWORD: PASSWORD, DB: mockDB() };
const noAuthEnv = { DB: mockDB() };
const brokenEnv = { APP_PASSWORD: PASSWORD, DB: breakingDB() };

function request(path, method = "GET", headers = {}, body = undefined) {
  return new Request(`https://x.test${path}`, { method, headers, body });
}

function withAuth(headers = {}) {
  return { Authorization: basicAuth("user", PASSWORD), ...headers };
}

// ── Authorization gate ────────────────────────────────────────────────────

describe("Authorization gate", () => {
  it("returns 401 + WWW-Authenticate when no credentials given", async () => {
    const res = await worker.fetch(request("/api/data"), authEnv);
    assert.equal(res.status, 401);
    assert.ok(res.headers.get("WWW-Authenticate"), "must include WWW-Authenticate");
  });

  it("returns 401 for wrong password", async () => {
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: basicAuth("user", "wrongpassword") }),
      authEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 401 for a password that is a prefix of the real one", async () => {
    // Guards against timing oracle: shorter string should not collide.
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: basicAuth("user", PASSWORD.slice(0, -1)) }),
      authEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 401 for a password with one extra character appended", async () => {
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: basicAuth("user", PASSWORD + "x") }),
      authEnv,
    );
    assert.equal(res.status, 401);
  });

  it("accepts correct password with any username", async () => {
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: basicAuth("anyone", PASSWORD) }),
      authEnv,
    );
    assert.equal(res.status, 200);
  });

  it("accepts correct password when username is empty (colon still present)", async () => {
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: basicAuth("", PASSWORD) }),
      authEnv,
    );
    assert.equal(res.status, 200);
  });

  it("rejects a Basic payload with no colon (must not bypass the gate)", async () => {
    // Bug: indexOf(":") returns -1; -1+1 = 0; slice(0) returns the full string.
    // If the full string happens to equal APP_PASSWORD, the old code would let
    // the request through. The fix returns false explicitly when colon is absent.
    const noColon = `Basic ${btoa(PASSWORD)}`; // no "username:" prefix
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: noColon }),
      authEnv,
    );
    assert.equal(res.status, 401);
  });

  it("admits all requests when APP_PASSWORD is unset (fail-open by design)", async () => {
    const res = await worker.fetch(request("/api/data"), noAuthEnv);
    assert.equal(res.status, 200);
  });

  it("returns 401 for malformed (non-base64) Authorization header", async () => {
    const res = await worker.fetch(
      request("/api/data", "GET", { Authorization: "Basic !!!not-base64!!!" }),
      authEnv,
    );
    assert.equal(res.status, 401);
  });
});

// ── Internal error suppression ────────────────────────────────────────────

describe("Internal error suppression", () => {
  const auth = withAuth({ "Content-Type": "application/json" });

  it("GET /api/data: 500 body must not expose DB error text", async () => {
    const res = await worker.fetch(request("/api/data", "GET", withAuth()), brokenEnv);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "Internal server error");
    assert.ok(!JSON.stringify(body).includes("SENSITIVE"));
  });

  it("POST /api/log: 500 body must not expose DB error text", async () => {
    const res = await worker.fetch(
      request("/api/log", "POST", auth, JSON.stringify({ hours: 1, topic: "Test" })),
      brokenEnv,
    );
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "Internal server error");
    assert.ok(!JSON.stringify(body).includes("SENSITIVE"));
  });

  it("POST /api/ask: 500 body must not expose DB error text", async () => {
    const res = await worker.fetch(
      request("/api/ask", "POST", auth, JSON.stringify({ question: "What is attention?" })),
      brokenEnv,
    );
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "Internal server error");
    assert.ok(!JSON.stringify(body).includes("SENSITIVE"));
  });
});
