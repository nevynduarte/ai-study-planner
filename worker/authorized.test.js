import { describe, it, expect } from "vitest";
import { authorized } from "./index.js";

/** Build a minimal request stub that exposes only the Authorization header. */
function makeRequest(authHeader) {
  return {
    headers: {
      get: (name) => (name === "Authorization" ? authHeader : null),
    },
  };
}

const ENV = { APP_PASSWORD: "correct-password" };

describe("authorized()", () => {
  describe("gate disabled — no APP_PASSWORD set", () => {
    it("allows any request", () => {
      expect(authorized(makeRequest(null), {})).toBe(true);
      expect(authorized(makeRequest("Basic " + btoa("user:wrong")), {})).toBe(true);
    });
  });

  describe("gate enabled — APP_PASSWORD set", () => {
    it("rejects a missing Authorization header", () => {
      expect(authorized(makeRequest(null), ENV)).toBe(false);
    });

    it("rejects a non-Basic auth scheme", () => {
      expect(authorized(makeRequest("Bearer some-token"), ENV)).toBe(false);
    });

    it("rejects invalid base64", () => {
      expect(authorized(makeRequest("Basic !!!not_valid_base64!!!"), ENV)).toBe(false);
    });

    it("grants access with correct username:password", () => {
      const header = "Basic " + btoa("anyuser:correct-password");
      expect(authorized(makeRequest(header), ENV)).toBe(true);
    });

    it("accepts any username — only the password matters", () => {
      const header = "Basic " + btoa("completely-different-user:correct-password");
      expect(authorized(makeRequest(header), ENV)).toBe(true);
    });

    it("rejects the wrong password", () => {
      const header = "Basic " + btoa("user:wrong-password");
      expect(authorized(makeRequest(header), ENV)).toBe(false);
    });

    it("handles a password that itself contains colons", () => {
      const env = { APP_PASSWORD: "pass:with:colons" };
      const header = "Basic " + btoa("user:pass:with:colons");
      expect(authorized(makeRequest(header), env)).toBe(true);
    });

    it("rejects empty credentials", () => {
      const header = "Basic " + btoa("");
      expect(authorized(makeRequest(header), ENV)).toBe(false);
    });

    it("rejects credentials with only a colon (empty password)", () => {
      const header = "Basic " + btoa("user:");
      expect(authorized(makeRequest(header), ENV)).toBe(false);
    });

    // Regression: before the fix, decoded.indexOf(":") returned -1 when the
    // payload had no colon, making slice(-1+1) === slice(0) return the full
    // decoded string.  A payload of just the password therefore compared
    // equal to APP_PASSWORD and was incorrectly accepted.
    it("rejects a password-only payload with no colon separator [regression]", () => {
      const header = "Basic " + btoa("correct-password");
      expect(authorized(makeRequest(header), ENV)).toBe(false);
    });
  });
});
