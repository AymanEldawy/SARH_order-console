import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginSchema } from "../src/features/auth/lib/auth.validation";

describe("auth feature validation", () => {
  it("normalizes a valid email without changing the password", () => {
    const result = loginSchema.parse({ email: "  AGENT@SARH.DEV ", password: "Password123!" });
    assert.deepEqual(result, { email: "agent@sarh.dev", password: "Password123!" });
  });

  it("rejects malformed email addresses and empty passwords", () => {
    assert.equal(loginSchema.safeParse({ email: "invalid", password: "Password123!" }).success, false);
    assert.equal(loginSchema.safeParse({ email: "agent@sarh.dev", password: "" }).success, false);
  });
});
