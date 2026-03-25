import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, foldersTable, tagsTable, videoTagsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const [{ totalVideos }] = await db
    .select({ totalVideos: sql<number>`count(*)::int` })
    .from(videosTable)
    .where(eq(videosTable.userId, userId));

  const [{ totalFolders }] = await db
    .select({ totalFolders: sql<number>`count(*)::int` })
    .from(foldersTable)
    .where(eq(foldersTable.userId, userId));

  const [{ totalTags }] = await db
    .select({ totalTags: sql<number>`count(*)::int` })
    .from(tagsTable)
    .where(eq(tagsTable.userId, userId));

  const recentVideosRaw = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.userId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(10);

  const favoriteVideosRaw = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.userId, userId), eq(videosTable.isFavorite, true)))
    .orderBy(sql`updated_at DESC`)
    .limit(10);

  const enrichVideos = async (videos: typeof recentVideosRaw) => {
    return Promise.all(
      videos.map(async (v) => {
        const tags = await db
          .select({ id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
          .from(videoTagsTable)
          .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
          .where(eq(videoTagsTable.videoId, v.id));
        return { ...v, tags, folderName: null };
      }),
    );
  };

  const [recentVideos, favoriteVideos] = await Promise.all([
    enrichVideos(recentVideosRaw),
    enrichVideos(favoriteVideosRaw),
  ]);

  res.json({ totalVideos, totalFolders, totalTags, recentVideos, favoriteVideos });
});

export default router;
