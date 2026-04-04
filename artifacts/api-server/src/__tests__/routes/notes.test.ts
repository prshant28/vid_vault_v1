import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, makeDbChain, mockUser } from "../helpers/test-app";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@workspace/db", () => ({
  db: mockDb,
  notesTable: { id: "id", videoId: "videoId", userId: "userId", content: "content", timestamp: "timestamp" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  and: vi.fn((...args: unknown[]) => args),
  sql: new Proxy(
    (strings: TemplateStringsArray, ..._vals: unknown[]) => strings[0],
    { get: () => () => "sql" }
  ),
}));

const { default: notesRouter } = await import("../../routes/notes");

const mockNote = {
  id: "note-1",
  videoId: "vid-1",
  userId: mockUser.id,
  content: "Great video!",
  timestamp: 120,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Notes routes — unauthenticated access", () => {
  const app = createTestApp(notesRouter, false);

  it("GET /api/videos/:videoId/notes returns 401", async () => {
    const res = await request(app).get("/api/videos/vid-1/notes");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "Unauthorized" });
  });

  it("POST /api/videos/:videoId/notes returns 401", async () => {
    const res = await request(app)
      .post("/api/videos/vid-1/notes")
      .send({ content: "Test note" });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/notes/:noteId returns 401", async () => {
    const res = await request(app)
      .patch("/api/notes/note-1")
      .send({ content: "Updated" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/notes/:noteId returns 401", async () => {
    const res = await request(app).delete("/api/notes/note-1");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/videos/:videoId/notes — authenticated", () => {
  const app = createTestApp(notesRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns notes for a video", async () => {
    mockDb.select.mockReturnValue(makeDbChain([mockNote]));

    const res = await request(app).get("/api/videos/vid-1/notes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("notes");
    expect(res.body.notes).toHaveLength(1);
    expect(res.body.notes[0]).toMatchObject({ id: "note-1", content: "Great video!" });
  });

  it("returns empty notes array", async () => {
    mockDb.select.mockReturnValue(makeDbChain([]));

    const res = await request(app).get("/api/videos/vid-1/notes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notes: [] });
  });
});

describe("POST /api/videos/:videoId/notes — authenticated", () => {
  const app = createTestApp(notesRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 when content is missing", async () => {
    const res = await request(app).post("/api/videos/vid-1/notes").send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Content is required" });
  });

  it("creates a note and returns 201", async () => {
    mockDb.insert.mockReturnValue(makeDbChain([mockNote]));

    const res = await request(app)
      .post("/api/videos/vid-1/notes")
      .send({ content: "Great video!", timestamp: 120 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "note-1", content: "Great video!", timestamp: 120 });
  });

  it("creates a note without timestamp", async () => {
    const noteNoTs = { ...mockNote, timestamp: null };
    mockDb.insert.mockReturnValue(makeDbChain([noteNoTs]));

    const res = await request(app)
      .post("/api/videos/vid-1/notes")
      .send({ content: "Just a note" });

    expect(res.status).toBe(201);
    expect(res.body.timestamp).toBeNull();
  });
});

describe("PATCH /api/notes/:noteId — authenticated", () => {
  const app = createTestApp(notesRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when note not found", async () => {
    mockDb.update.mockReturnValue(makeDbChain([]));

    const res = await request(app)
      .patch("/api/notes/missing-id")
      .send({ content: "Updated" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "Note not found" });
  });

  it("updates note content and returns updated note", async () => {
    const updated = { ...mockNote, content: "Updated content" };
    mockDb.update.mockReturnValue(makeDbChain([updated]));

    const res = await request(app)
      .patch("/api/notes/note-1")
      .send({ content: "Updated content" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ content: "Updated content" });
  });
});

describe("DELETE /api/notes/:noteId — authenticated", () => {
  const app = createTestApp(notesRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 204 on successful deletion", async () => {
    mockDb.delete.mockReturnValue(makeDbChain([]));

    const res = await request(app).delete("/api/notes/note-1");
    expect(res.status).toBe(204);
  });
});
