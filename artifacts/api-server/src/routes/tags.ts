import { Router } from "express";
import { db } from "@workspace/db";
import { tagsTable, videoTagsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/tags", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const tags = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.userId, req.user.id))
    .orderBy(tagsTable.name);

  res.json({ tags });
});

router.post("/tags", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, color } = req.body as { name: string; color?: string };

  if (!name) {
    res.status(400).json({ error: "Tag name is required" });
    return;
  }

  const [tag] = await db
    .insert(tagsTable)
    .values({ userId: req.user.id, name, color: color || null })
    .returning();

  res.status(201).json(tag);
});

router.post("/videos/:videoId/tags", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { videoId } = req.params;
  const { tagId } = req.body as { tagId: string };

  await db
    .insert(videoTagsTable)
    .values({ videoId, tagId })
    .onConflictDoNothing();

  res.json({ success: true });
});

router.delete("/videos/:videoId/tags/:tagId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { videoId, tagId } = req.params;

  await db
    .delete(videoTagsTable)
    .where(and(eq(videoTagsTable.videoId, videoId), eq(videoTagsTable.tagId, tagId)));

  res.status(204).send();
});

export default router;
