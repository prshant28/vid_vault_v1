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
  foldersTable: { id: "id", userId: "userId", name: "name", color: "color", parentId: "parentId" },
  videosTable: { id: "id", userId: "userId", folderId: "folderId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  and: vi.fn((...args: unknown[]) => args),
  sql: new Proxy(
    (strings: TemplateStringsArray, ..._vals: unknown[]) => strings[0],
    { get: () => () => "sql" }
  ),
}));

const { default: foldersRouter } = await import("../../routes/folders");

const mockFolder = {
  id: "folder-1",
  userId: mockUser.id,
  name: "My Folder",
  color: "#6366f1",
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Folders routes — unauthenticated access", () => {
  const app = createTestApp(foldersRouter, false);

  it("GET /api/folders returns 401", async () => {
    const res = await request(app).get("/api/folders");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "Unauthorized" });
  });

  it("POST /api/folders returns 401", async () => {
    const res = await request(app).post("/api/folders").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/folders/:folderId returns 401", async () => {
    const res = await request(app).patch("/api/folders/folder-1").send({ name: "New" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/folders/:folderId returns 401", async () => {
    const res = await request(app).delete("/api/folders/folder-1");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/folders — authenticated", () => {
  const app = createTestApp(foldersRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns folders with video counts", async () => {
    mockDb.select
      .mockReturnValueOnce(makeDbChain([mockFolder]))
      .mockReturnValueOnce(makeDbChain([{ count: 3 }]));

    const res = await request(app).get("/api/folders");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("folders");
    expect(res.body.folders).toHaveLength(1);
    expect(res.body.folders[0]).toMatchObject({ id: "folder-1", videoCount: 3 });
  });

  it("returns empty folders array", async () => {
    mockDb.select.mockReturnValueOnce(makeDbChain([]));

    const res = await request(app).get("/api/folders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ folders: [] });
  });
});

describe("POST /api/folders — authenticated", () => {
  const app = createTestApp(foldersRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app).post("/api/folders").send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Folder name is required" });
  });

  it("creates a folder and returns 201", async () => {
    mockDb.insert.mockReturnValue(makeDbChain([mockFolder]));

    const res = await request(app)
      .post("/api/folders")
      .send({ name: "My Folder", color: "#6366f1" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "folder-1", videoCount: 0 });
  });
});

describe("PATCH /api/folders/:folderId — authenticated", () => {
  const app = createTestApp(foldersRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when folder not found", async () => {
    mockDb.update.mockReturnValue(makeDbChain([]));

    const res = await request(app)
      .patch("/api/folders/missing-id")
      .send({ name: "New Name" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "Folder not found" });
  });

  it("updates folder and returns it with video count", async () => {
    const updated = { ...mockFolder, name: "Renamed Folder" };
    mockDb.update.mockReturnValue(makeDbChain([updated]));
    mockDb.select.mockReturnValue(makeDbChain([{ count: 5 }]));

    const res = await request(app)
      .patch("/api/folders/folder-1")
      .send({ name: "Renamed Folder" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Renamed Folder", videoCount: 5 });
  });
});

describe("DELETE /api/folders/:folderId — authenticated", () => {
  const app = createTestApp(foldersRouter, true);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 204 on successful deletion", async () => {
    mockDb.delete.mockReturnValue(makeDbChain([]));

    const res = await request(app).delete("/api/folders/folder-1");
    expect(res.status).toBe(204);
  });
});
