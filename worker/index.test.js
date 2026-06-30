/**
 * Unit tests for worker/index.js helpers.
 * Run with: node --test worker/index.test.js
 * Requires Node >= 18 (built-in test runner).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHours } from "./index.js";

// ── parseHours ──────────────────────────────────────────────────────────────
// The key correctness requirement: the old guard `Number(v) <= 0` allows NaN
// and Infinity to pass (NaN <= 0 is false; Infinity <= 0 is false), which
// would corrupt study_log rows. parseHours uses Number.isFinite so these are
// rejected before the D1 INSERT.

test("parseHours: valid integer string", () => {
  assert.equal(parseHours("3"), 3);
});

test("parseHours: valid decimal string", () => {
  assert.equal(parseHours("1.5"), 1.5);
});

test("parseHours: valid numeric value", () => {
  assert.equal(parseHours(2), 2);
});

test("parseHours: zero returns null", () => {
  assert.equal(parseHours(0), null);
});

test("parseHours: zero string returns null", () => {
  assert.equal(parseHours("0"), null);
});

test("parseHours: negative number returns null", () => {
  assert.equal(parseHours(-1), null);
});

test("parseHours: NaN string returns null (was: old guard passed this)", () => {
  assert.equal(parseHours("NaN"), null);
});

test("parseHours: JS NaN returns null", () => {
  assert.equal(parseHours(NaN), null);
});

test("parseHours: Infinity returns null (was: old guard passed this)", () => {
  assert.equal(parseHours(Infinity), null);
});

test("parseHours: -Infinity returns null", () => {
  assert.equal(parseHours(-Infinity), null);
});

test("parseHours: non-numeric string returns null", () => {
  assert.equal(parseHours("two"), null);
});

test("parseHours: empty string returns null", () => {
  assert.equal(parseHours(""), null);
});

test("parseHours: null returns null", () => {
  assert.equal(parseHours(null), null);
});

test("parseHours: undefined returns null", () => {
  assert.equal(parseHours(undefined), null);
});
