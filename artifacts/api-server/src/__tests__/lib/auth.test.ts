import { describe, it, expect, vi } from "vitest";

// lib/auth.ts imports @workspace/db at the top level; mock it to avoid
// the "DATABASE_URL must be set" error thrown during module initialisation.
vi.mock("@workspace/db", () => ({
  db: {},
  sessionsTable: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
}));

import { getSessionId, SESSION_COOKIE, SESSION_TTL } from "../../lib/auth";
import type { Request } from "express";

// Build a minimal fake Request
function makeReq(
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
): Request {
  return { headers, cookies } as unknown as Request;
}

describe("getSessionId", () => {
  it("returns the bearer token from Authorization header", () => {
    const req = makeReq({ authorization: "Bearer abc123token" });
    expect(getSessionId(req)).toBe("abc123token");
  });

  it("returns undefined when Authorization header has no Bearer prefix", () => {
    const req = makeReq({ authorization: "Basic somecredentials" });
    expect(getSessionId(req)).toBeUndefined();
  });

  it("returns the session cookie value when no Authorization header", () => {
    const req = makeReq({}, { [SESSION_COOKIE]: "my-cookie-sid" });
    expect(getSessionId(req)).toBe("my-cookie-sid");
  });

  it("prefers Authorization header over cookie", () => {
    const req = makeReq(
      { authorization: "Bearer header-token" },
      { [SESSION_COOKIE]: "cookie-sid" },
    );
    expect(getSessionId(req)).toBe("header-token");
  });

  it("returns undefined when neither header nor cookie is present", () => {
    const req = makeReq();
    expect(getSessionId(req)).toBeUndefined();
  });

  it("returns an empty string when bearer value is empty string", () => {
    const req = makeReq({ authorization: "Bearer " });
    expect(getSessionId(req)).toBe("");
  });
});

describe("SESSION_COOKIE", () => {
  it("is 'sid'", () => {
    expect(SESSION_COOKIE).toBe("sid");
  });
});

describe("SESSION_TTL", () => {
  it("is 7 days in milliseconds", () => {
    expect(SESSION_TTL).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
