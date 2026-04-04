import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, makeDbChain, mockUser } from "../helpers/test-app";

const mockDb = {
  select: vi.fn(),
};

vi.mock("@workspace/db", () => ({
  db: mockDb,
  videosTable: { id: "id", userId: "userId", isFavorite: "isFavorite" },
  foldersTable: { id: "id", userId: "userId" },
  tagsTable: { id: "id", name: "name", color: "color", userId: "userId" },
  videoTagsTable: { videoId: "videoId", tagId: "tagId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  and: vi.fn((...args: unknown[]) => args),
  sql: new Proxy(
    (strings: TemplateStringsArray, ..._vals: unknown[]) => strings[0],
    { get: () => () => "sql" }
  ),
}));

const { default: statsRouter } = await import("../../routes/stats");

const mockVideo = {
  id: "vid-1",
  userId: mockUser.id,
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Test Video",
  thumbnail: null,
  duration: "3:33",
  channelName: "Test Channel",
  description: null,
  folderId: null,
  isFavorite: true,
  viewCount: null,
  publishedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Stats route — unauthenticated access", () => {
  const app = createTestApp(statsRouter, false);

  it("GET /api/stats returns 401", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "Unauthorized" });
  });
});

describe("GET /api/stats — authenticated", () => {
  const app = createTestApp(statsRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns stats with counts and video lists", async () => {
    mockDb.select
      // totalVideos
      .mockReturnValueOnce(makeDbChain([{ totalVideos: 10 }]))
      // totalFolders
      .mockReturnValueOnce(makeDbChain([{ totalFolders: 3 }]))
      // totalTags
      .mockReturnValueOnce(makeDbChain([{ totalTags: 5 }]))
      // recentVideosRaw
      .mockReturnValueOnce(makeDbChain([mockVideo]))
      // favoriteVideosRaw
      .mockReturnValueOnce(makeDbChain([mockVideo]))
      // tags enrichment for recentVideo (in Promise.all)
      .mockReturnValueOnce(makeDbChain([]))
      // tags enrichment for favoriteVideo (in Promise.all)
      .mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/stats");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalVideos: 10,
      totalFolders: 3,
      totalTags: 5,
    });
    expect(res.body.recentVideos).toHaveLength(1);
    expect(res.body.favoriteVideos).toHaveLength(1);
  });

  it("returns zero counts with empty arrays when no data", async () => {
    mockDb.select
      .mockReturnValueOnce(makeDbChain([{ totalVideos: 0 }]))
      .mockReturnValueOnce(makeDbChain([{ totalFolders: 0 }]))
      .mockReturnValueOnce(makeDbChain([{ totalTags: 0 }]))
      .mockReturnValueOnce(makeDbChain([]))
      .mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/stats");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalVideos: 0,
      totalFolders: 0,
      totalTags: 0,
      recentVideos: [],
      favoriteVideos: [],
    });
  });
});
