import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, foldersTable, tagsTable, videoTagsTable, notesTable, aiOutputsTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";

const router = Router();

export const LEVELS = [
  { level: 1, title: "Novice",   minXP: 0,     color: "#6b7280" },
  { level: 2, title: "Explorer", minXP: 100,   color: "#3b82f6" },
  { level: 3, title: "Scholar",  minXP: 300,   color: "#8b5cf6" },
  { level: 4, title: "Analyst",  minXP: 700,   color: "#06b6d4" },
  { level: 5, title: "Expert",   minXP: 1500,  color: "#10b981" },
  { level: 6, title: "Master",   minXP: 3000,  color: "#f59e0b" },
  { level: 7, title: "Sage",     minXP: 6000,  color: "#ec4899" },
];

function computeXP(s: {
  totalVideos: number; totalFavorites: number; totalWatched: number;
  totalNotes: number; totalAiOutputs: number; totalTags: number;
}) {
  return s.totalVideos * 10 + s.totalFavorites * 5 + s.totalWatched * 8
       + s.totalNotes * 15 + s.totalAiOutputs * 20 + s.totalTags * 3;
}

function getLevelInfo(xp: number) {
  const current = [...LEVELS].reverse().find((l) => xp >= l.minXP) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.level === current.level + 1);
  const progressXP = xp - current.minXP;
  const rangeXP = next ? next.minXP - current.minXP : 1;
  const progressPct = next ? Math.min(100, Math.round((progressXP / rangeXP) * 100)) : 100;
  return {
    level: current.level,
    levelTitle: current.title,
    levelColor: current.color,
    xp,
    nextLevelXP: next?.minXP ?? current.minXP,
    progressPct,
    isMaxLevel: !next,
  };
}

router.get("/stats", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const [
    [{ totalVideos }],
    [{ totalFolders }],
    [{ totalTags }],
    [{ totalFavorites }],
    [{ totalWatched }],
    [{ totalNotes }],
    [{ totalAiOutputs }],
  ] = await Promise.all([
    db.select({ totalVideos: sql<number>`count(*)::int` }).from(videosTable).where(eq(videosTable.userId, userId)),
    db.select({ totalFolders: sql<number>`count(*)::int` }).from(foldersTable).where(eq(foldersTable.userId, userId)),
    db.select({ totalTags: sql<number>`count(*)::int` }).from(tagsTable).where(eq(tagsTable.userId, userId)),
    db.select({ totalFavorites: sql<number>`count(*)::int` }).from(videosTable).where(and(eq(videosTable.userId, userId), eq(videosTable.isFavorite, true))),
    db.select({ totalWatched: sql<number>`count(*)::int` }).from(videosTable).where(and(eq(videosTable.userId, userId), eq(videosTable.isWatched, true))),
    db.select({ totalNotes: sql<number>`count(*)::int` }).from(notesTable).where(eq(notesTable.userId, userId)),
    db.select({ totalAiOutputs: sql<number>`count(*)::int` }).from(aiOutputsTable).where(eq(aiOutputsTable.userId, userId)),
  ]);

  const [recentVideosRaw, favoriteVideosRaw, recentAiOutputs, aiOutputsByType] = await Promise.all([
    db.select().from(videosTable).where(eq(videosTable.userId, userId)).orderBy(sql`created_at DESC`).limit(10),
    db.select().from(videosTable).where(and(eq(videosTable.userId, userId), eq(videosTable.isFavorite, true))).orderBy(sql`updated_at DESC`).limit(10),
    db.select({
      id: aiOutputsTable.id,
      type: aiOutputsTable.type,
      videoId: aiOutputsTable.videoId,
      createdAt: aiOutputsTable.createdAt,
      videoTitle: videosTable.title,
      videoThumbnail: videosTable.thumbnail,
    }).from(aiOutputsTable)
      .innerJoin(videosTable, eq(aiOutputsTable.videoId, videosTable.id))
      .where(eq(aiOutputsTable.userId, userId))
      .orderBy(desc(aiOutputsTable.createdAt))
      .limit(6),
    db.select({ type: aiOutputsTable.type, count: sql<number>`count(*)::int` })
      .from(aiOutputsTable).where(eq(aiOutputsTable.userId, userId)).groupBy(aiOutputsTable.type),
  ]);

  const enrichVideos = async (videos: typeof recentVideosRaw) =>
    Promise.all(videos.map(async (v) => {
      const tags = await db
        .select({ id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
        .from(videoTagsTable)
        .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
        .where(eq(videoTagsTable.videoId, v.id));
      return { ...v, tags, folderName: null };
    }));

  const [recentVideos, favoriteVideos] = await Promise.all([
    enrichVideos(recentVideosRaw),
    enrichVideos(favoriteVideosRaw),
  ]);

  const xp = computeXP({ totalVideos, totalFavorites, totalWatched, totalNotes, totalAiOutputs, totalTags });
  const levelInfo = getLevelInfo(xp);

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json({
    totalVideos, totalFolders, totalTags, totalFavorites, totalWatched,
    totalNotes, totalAiOutputs,
    recentVideos, favoriteVideos,
    recentAiOutputs, aiOutputsByType,
    ...levelInfo,
  });
});

export default router;
