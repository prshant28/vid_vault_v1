import { Router } from "express";
import { db } from "@workspace/db";
import { foldersTable, videosTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/folders", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const folders = await db
    .select()
    .from(foldersTable)
    .where(eq(foldersTable.userId, userId))
    .orderBy(foldersTable.name);

  const withCounts = await Promise.all(
    folders.map(async (f) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(videosTable)
        .where(and(eq(videosTable.folderId, f.id), eq(videosTable.userId, userId)));
      return { ...f, videoCount: count };
    }),
  );

  res.json({ folders: withCounts });
});

router.post("/folders", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, color, parentId } = req.body as { name: string; color?: string; parentId?: string };

  if (!name) {
    res.status(400).json({ error: "Folder name is required" });
    return;
  }

  const [folder] = await db
    .insert(foldersTable)
    .values({ userId: req.user.id, name, color: color || null, parentId: parentId || null })
    .returning();

  res.status(201).json({ ...folder, videoCount: 0 });
});

router.patch("/folders/:folderId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { folderId } = req.params;
  const { name, color } = req.body as { name?: string; color?: string };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (color !== undefined) updates.color = color;

  const [updated] = await db
    .update(foldersTable)
    .set(updates)
    .where(and(eq(foldersTable.id, folderId), eq(foldersTable.userId, req.user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(videosTable)
    .where(and(eq(videosTable.folderId, folderId), eq(videosTable.userId, req.user.id)));

  res.json({ ...updated, videoCount: count });
});

router.delete("/folders/:folderId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .delete(foldersTable)
    .where(
      and(
        eq(foldersTable.id, req.params.folderId),
        eq(foldersTable.userId, req.user.id),
      ),
    );
  res.status(204).send();
});

export default router;
