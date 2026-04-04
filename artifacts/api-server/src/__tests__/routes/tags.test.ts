import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, makeDbChain, mockUser } from "../helpers/test-app";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@workspace/db", () => ({
  db: mockDb,
  tagsTable: { id: "id", userId: "userId", name: "name", color: "color" },
  videoTagsTable: { videoId: "videoId", tagId: "tagId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  and: vi.fn((...args: unknown[]) => args),
}));

const { default: tagsRouter } = await import("../../routes/tags");

const mockTag = {
  id: "tag-1",
  userId: mockUser.id,
  name: "JavaScript",
  color: "#f59e0b",
  createdAt: new Date().toISOString(),
};

describe("Tags routes — unauthenticated access", () => {
  const app = createTestApp(tagsRouter, false);

  it("GET /api/tags returns 401", async () => {
    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "Unauthorized" });
  });

  it("POST /api/tags returns 401", async () => {
    const res = await request(app).post("/api/tags").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("POST /api/videos/:videoId/tags returns 401", async () => {
    const res = await request(app).post("/api/videos/vid-1/tags").send({ tagId: "tag-1" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/videos/:videoId/tags/:tagId returns 401", async () => {
    const res = await request(app).delete("/api/videos/vid-1/tags/tag-1");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/tags — authenticated", () => {
  const app = createTestApp(tagsRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns all tags for the user", async () => {
    mockDb.select.mockReturnValue(makeDbChain([mockTag]));

    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tags");
    expect(res.body.tags).toHaveLength(1);
    expect(res.body.tags[0]).toMatchObject({ id: "tag-1", name: "JavaScript" });
  });

  it("returns empty tags array when user has no tags", async () => {
    mockDb.select.mockReturnValue(makeDbChain([]));

    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tags: [] });
  });
});

describe("POST /api/tags — authenticated", () => {
  const app = createTestApp(tagsRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 when tag name is missing", async () => {
    const res = await request(app).post("/api/tags").send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Tag name is required" });
  });

  it("creates a tag and returns 201", async () => {
    mockDb.insert.mockReturnValue(makeDbChain([mockTag]));

    const res = await request(app)
      .post("/api/tags")
      .send({ name: "JavaScript", color: "#f59e0b" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "tag-1", name: "JavaScript" });
  });

  it("creates a tag without color", async () => {
    const tagNoColor = { ...mockTag, color: null };
    mockDb.insert.mockReturnValue(makeDbChain([tagNoColor]));

    const res = await request(app)
      .post("/api/tags")
      .send({ name: "JavaScript" });

    expect(res.status).toBe(201);
  });
});

describe("POST /api/videos/:videoId/tags — authenticated", () => {
  const app = createTestApp(tagsRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("adds tag to video and returns success", async () => {
    mockDb.insert.mockReturnValue(makeDbChain([]));

    const res = await request(app)
      .post("/api/videos/vid-1/tags")
      .send({ tagId: "tag-1" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe("DELETE /api/videos/:videoId/tags/:tagId — authenticated", () => {
  const app = createTestApp(tagsRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("removes tag from video and returns 204", async () => {
    mockDb.delete.mockReturnValue(makeDbChain([]));

    const res = await request(app).delete("/api/videos/vid-1/tags/tag-1");
    expect(res.status).toBe(204);
  });
});
