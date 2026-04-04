import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "../helpers/test-app";

// Mock @workspace/api-zod so HealthCheckResponse.parse passes through
vi.mock("@workspace/api-zod", () => ({
  HealthCheckResponse: {
    parse: (v: unknown) => v,
  },
}));

// Import router after mocks
const { default: healthRouter } = await import("../../routes/health");

describe("GET /api/healthz", () => {
  const app = createTestApp(healthRouter);

  it("responds with 200 and status ok", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("responds even when unauthenticated", async () => {
    const unauthApp = createTestApp(healthRouter, false);
    const res = await request(unauthApp).get("/api/healthz");
    expect(res.status).toBe(200);
  });
});
