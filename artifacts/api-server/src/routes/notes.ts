import { Router } from "express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/videos/:videoId/notes", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const notes = await db
    .select()
    .from(notesTable)
    .where(
      and(
        eq(notesTable.videoId, req.params.videoId),
        eq(notesTable.userId, req.user.id),
      ),
    )
    .orderBy(sql`created_at ASC`);

  res.json({ notes });
});

router.post("/videos/:videoId/notes", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { content, timestamp } = req.body as { content: string; timestamp?: number };

  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [note] = await db
    .insert(notesTable)
    .values({
      videoId: req.params.videoId,
      userId: req.user.id,
      content,
      timestamp: timestamp || null,
    })
    .returning();

  res.status(201).json(note);
});

router.patch("/notes/:noteId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { content } = req.body as { content?: string };
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (content !== undefined) updates.content = content;

  const [updated] = await db
    .update(notesTable)
    .set(updates)
    .where(and(eq(notesTable.id, req.params.noteId), eq(notesTable.userId, req.user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(updated);
});

router.delete("/notes/:noteId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, req.params.noteId), eq(notesTable.userId, req.user.id)));
  res.status(204).send();
});

export default router;
