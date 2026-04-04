import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, makeDbChain, mockUser } from "../helpers/test-app";

// ---------- mock @workspace/db ----------
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@workspace/db", () => ({
  db: mockDb,
  videosTable: { id: "id", userId: "userId", folderId: "folderId", isFavorite: "isFavorite", title: "title", createdAt: "createdAt", updatedAt: "updatedAt" },
  foldersTable: { id: "id", userId: "userId", name: "name" },
  tagsTable: { id: "id", name: "name", color: "color", userId: "userId" },
  videoTagsTable: { videoId: "videoId", tagId: "tagId" },
  notesTable: { id: "id", videoId: "videoId", userId: "userId" },
  aiOutputsTable: { id: "id", videoId: "videoId", userId: "userId" },
}));

// ---------- mock drizzle-orm helpers ----------
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  and: vi.fn((...args: unknown[]) => args),
  ilike: vi.fn(() => "ilike"),
  inArray: vi.fn(() => "inArray"),
  sql: new Proxy(
    (strings: TemplateStringsArray, ..._vals: unknown[]) => strings[0],
    { get: () => () => "sql" }
  ),
}));

const { default: videosRouter } = await import("../../routes/videos");
const { parseDuration } = await import("../../routes/videos");

const mockVideo = {
  id: "vid-1",
  userId: mockUser.id,
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Test Video",
  thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  duration: "3:33",
  channelName: "Test Channel",
  description: "Test description",
  folderId: null,
  isFavorite: false,
  viewCount: 1000,
  publishedAt: "2021-01-01T00:00:00Z",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("parseDuration", () => {
  it("formats hours:minutes:seconds correctly", () => {
    expect(parseDuration("PT1H2M3S")).toBe("1:02:03");
  });

  it("formats minutes:seconds without hours", () => {
    expect(parseDuration("PT30M15S")).toBe("30:15");
  });

  it("pads seconds with leading zero", () => {
    expect(parseDuration("PT1M5S")).toBe("1:05");
  });

  it("handles seconds only", () => {
    expect(parseDuration("PT45S")).toBe("0:45");
  });

  it("handles hours only", () => {
    expect(parseDuration("PT2H")).toBe("2:00:00");
  });

  it("returns null for empty string", () => {
    expect(parseDuration("")).toBeNull();
  });

  it("returns null for non-matching string", () => {
    expect(parseDuration("invalid")).toBeNull();
  });
});

describe("Videos routes — unauthenticated access", () => {
  const app = createTestApp(videosRouter, false);

  it("GET /api/videos returns 401", async () => {
    const res = await request(app).get("/api/videos");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "Unauthorized" });
  });

  it("POST /api/videos returns 401", async () => {
    const res = await request(app).post("/api/videos").send({ url: "https://example.com" });
    expect(res.status).toBe(401);
  });

  it("GET /api/videos/:videoId returns 401", async () => {
    const res = await request(app).get("/api/videos/vid-1");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/videos/:videoId returns 401", async () => {
    const res = await request(app).patch("/api/videos/vid-1").send({ title: "New" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/videos/:videoId returns 401", async () => {
    const res = await request(app).delete("/api/videos/vid-1");
    expect(res.status).toBe(401);
  });

  it("POST /api/videos/:videoId/favorite returns 401", async () => {
    const res = await request(app).post("/api/videos/vid-1/favorite");
    expect(res.status).toBe(401);
  });

  it("POST /api/videos/playlist returns 401", async () => {
    const res = await request(app).post("/api/videos/playlist").send({ url: "https://youtube.com/playlist?list=abc" });
    expect(res.status).toBe(401);
  });
});

describe("Videos routes — input validation", () => {
  const app = createTestApp(videosRouter, true);

  it("POST /api/videos returns 400 when url is missing", async () => {
    const res = await request(app).post("/api/videos").send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "URL is required" });
  });

  it("POST /api/videos/playlist returns 400 when url is missing", async () => {
    const res = await request(app).post("/api/videos/playlist").send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Playlist URL is required" });
  });

  it("POST /api/videos/playlist returns 400 for non-playlist URL", async () => {
    const res = await request(app).post("/api/videos/playlist").send({ url: "https://youtube.com/watch?v=abc" });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Invalid YouTube playlist URL" });
  });
});

describe("GET /api/videos — authenticated", () => {
  const app = createTestApp(videosRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns videos and total", async () => {
    // First call: count query
    mockDb.select
      .mockReturnValueOnce(makeDbChain([{ count: 1 }]))
      // Second call: videos query
      .mockReturnValueOnce(makeDbChain([mockVideo]))
      // Third call: tags enrichment for the video
      .mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/videos");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total", 1);
    expect(res.body.videos).toHaveLength(1);
    expect(res.body.videos[0]).toMatchObject({ id: "vid-1", title: "Test Video" });
  });

  it("returns empty list when no videos exist", async () => {
    mockDb.select
      .mockReturnValueOnce(makeDbChain([{ count: 0 }]))
      .mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/videos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ videos: [], total: 0 });
  });

  it("returns empty result for tagId filter that matches no videos", async () => {
    // tagId filter: no videoIds found
    mockDb.select.mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/videos?tagId=nonexistent-tag");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ videos: [], total: 0 });
  });
});

describe("POST /api/videos — authenticated", () => {
  const app = createTestApp(videosRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a video and returns 201", async () => {
    // fetchVideoMeta will try to fetch; mock global fetch
    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));

    mockDb.insert.mockReturnValue(makeDbChain([mockVideo]));

    const res = await request(app)
      .post("/api/videos")
      .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "vid-1", tags: [], folderName: null });

    global.fetch = globalFetch;
  });
});

describe("GET /api/videos/:videoId — authenticated", () => {
  const app = createTestApp(videosRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when video not found", async () => {
    // getVideoWithTags: select video -> empty
    mockDb.select
      .mockReturnValueOnce(makeDbChain([])); // video not found

    const res = await request(app).get("/api/videos/missing-id");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "Video not found" });
  });

  it("returns video with notes and aiOutputs", async () => {
    mockDb.select
      // getVideoWithTags: select video
      .mockReturnValueOnce(makeDbChain([mockVideo]))
      // getVideoWithTags: select tags
      .mockReturnValueOnce(makeDbChain([]))
      // select notes
      .mockReturnValueOnce(makeDbChain([]))
      // select aiOutputs
      .mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/videos/vid-1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "vid-1", notes: [], aiOutputs: [] });
  });
});

describe("PATCH /api/videos/:videoId — authenticated", () => {
  const app = createTestApp(videosRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when video not found", async () => {
    mockDb.update.mockReturnValue(makeDbChain([]));

    const res = await request(app)
      .patch("/api/videos/missing-id")
      .send({ title: "New Title" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "Video not found" });
  });

  it("updates and returns the video", async () => {
    const updatedVideo = { ...mockVideo, title: "Updated Title" };
    mockDb.update.mockReturnValue(makeDbChain([updatedVideo]));
    // getVideoWithTags after update
    mockDb.select
      .mockReturnValueOnce(makeDbChain([updatedVideo]))
      .mockReturnValueOnce(makeDbChain([])); // tags

    const res = await request(app)
      .patch("/api/videos/vid-1")
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Updated Title" });
  });
});

describe("DELETE /api/videos/:videoId — authenticated", () => {
  const app = createTestApp(videosRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 204 on successful deletion", async () => {
    mockDb.delete.mockReturnValue(makeDbChain([]));

    const res = await request(app).delete("/api/videos/vid-1");
    expect(res.status).toBe(204);
  });
});

describe("POST /api/videos/:videoId/favorite — authenticated", () => {
  const app = createTestApp(videosRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when video not found", async () => {
    mockDb.select.mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).post("/api/videos/missing-id/favorite");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "Video not found" });
  });

  it("toggles isFavorite from false to true", async () => {
    mockDb.select.mockReturnValueOnce(makeDbChain([{ isFavorite: false }]));
    mockDb.update.mockReturnValue(makeDbChain([{ isFavorite: true }]));

    const res = await request(app).post("/api/videos/vid-1/favorite");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isFavorite: true });
  });

  it("toggles isFavorite from true to false", async () => {
    mockDb.select.mockReturnValueOnce(makeDbChain([{ isFavorite: true }]));
    mockDb.update.mockReturnValue(makeDbChain([{ isFavorite: false }]));

    const res = await request(app).post("/api/videos/vid-1/favorite");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isFavorite: false });
  });
});

describe("GET /api/preview", () => {
  const app = createTestApp(videosRouter, true);

  it("returns 400 when url is missing", async () => {
    const res = await request(app).get("/api/preview");
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "url required" });
  });

  it("returns youtube metadata for a YouTube URL", async () => {
    const res = await request(app).get(
      "/api/preview?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("returns 400 for a completely invalid URL", async () => {
    const res = await request(app).get("/api/preview?url=not-a-url");
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Invalid URL" });
  });
});
