import { Router } from "express";
import { db } from "@workspace/db";
import {
  videosTable,
  foldersTable,
  tagsTable,
  videoTagsTable,
  notesTable,
  aiOutputsTable,
} from "@workspace/db";
import { eq, and, ilike, inArray, sql } from "drizzle-orm";

const router = Router();

async function fetchVideoMeta(url: string) {
  try {
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    );
    if (!ytMatch) {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname + urlObj.pathname,
        thumbnail: null,
        duration: null,
        channelName: null,
        description: null,
        viewCount: null,
        publishedAt: null,
      };
    }
    const videoId = ytMatch[1];
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${apiKey}`,
      );
      if (resp.ok) {
        const data = await resp.json() as { items?: { snippet?: { title?: string; channelTitle?: string; description?: string; publishedAt?: string }; contentDetails?: { duration?: string }; statistics?: { viewCount?: string } }[] };
        const item = data.items?.[0];
        if (item) {
          const rawDuration = item.contentDetails?.duration || "";
          const duration = parseDuration(rawDuration);
          return {
            title: item.snippet?.title || "Untitled Video",
            thumbnail,
            duration,
            channelName: item.snippet?.channelTitle || null,
            description: item.snippet?.description?.slice(0, 500) || null,
            viewCount: parseInt(item.statistics?.viewCount || "0") || null,
            publishedAt: item.snippet?.publishedAt || null,
          };
        }
      }
    }
    const oembedResp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (oembedResp.ok) {
      const oembed = await oembedResp.json() as { title?: string; author_name?: string };
      return {
        title: oembed.title || "YouTube Video",
        thumbnail,
        duration: null,
        channelName: oembed.author_name || null,
        description: null,
        viewCount: null,
        publishedAt: null,
      };
    }
    return {
      title: `YouTube Video (${videoId})`,
      thumbnail,
      duration: null,
      channelName: null,
      description: null,
      viewCount: null,
      publishedAt: null,
    };
  } catch {
    return {
      title: url,
      thumbnail: null,
      duration: null,
      channelName: null,
      description: null,
      viewCount: null,
      publishedAt: null,
    };
  }
}

function parseDuration(iso: string): string | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getVideoWithTags(videoId: string, userId: string) {
  const [video] = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, userId)));
  if (!video) return null;

  const tags = await db
    .select({ id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
    .from(videoTagsTable)
    .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .where(eq(videoTagsTable.videoId, videoId));

  let folderName: string | null = null;
  if (video.folderId) {
    const [folder] = await db
      .select({ name: foldersTable.name })
      .from(foldersTable)
      .where(eq(foldersTable.id, video.folderId));
    folderName = folder?.name || null;
  }

  return { ...video, tags, folderName };
}

router.get("/videos", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { folderId, tagId, search, favorites, limit = "20", offset = "0" } = req.query as Record<string, string>;

  const limitN = Math.min(parseInt(limit) || 20, 100);
  const offsetN = parseInt(offset) || 0;

  let videoIds: string[] | null = null;
  if (tagId) {
    const tagged = await db
      .select({ videoId: videoTagsTable.videoId })
      .from(videoTagsTable)
      .where(eq(videoTagsTable.tagId, tagId));
    videoIds = tagged.map((t) => t.videoId);
    if (videoIds.length === 0) {
      res.json({ videos: [], total: 0 });
      return;
    }
  }

  const conditions = [eq(videosTable.userId, userId)];
  if (folderId) conditions.push(eq(videosTable.folderId, folderId));
  if (favorites === "true") conditions.push(eq(videosTable.isFavorite, true));
  if (search) conditions.push(ilike(videosTable.title, `%${search}%`));
  if (videoIds) conditions.push(inArray(videosTable.id, videoIds));

  const where = and(...conditions);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(videosTable)
    .where(where);

  const videos = await db
    .select()
    .from(videosTable)
    .where(where)
    .orderBy(sql`${videosTable.createdAt} DESC`)
    .limit(limitN)
    .offset(offsetN);

  const enriched = await Promise.all(
    videos.map(async (v) => {
      const tags = await db
        .select({ id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
        .from(videoTagsTable)
        .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
        .where(eq(videoTagsTable.videoId, v.id));
      let folderName: string | null = null;
      if (v.folderId) {
        const [folder] = await db
          .select({ name: foldersTable.name })
          .from(foldersTable)
          .where(eq(foldersTable.id, v.folderId));
        folderName = folder?.name || null;
      }
      return { ...v, tags, folderName };
    }),
  );

  res.json({ videos: enriched, total: count });
});

router.post("/videos", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { url, folderId } = req.body as { url: string; folderId?: string };

  if (!url) {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  const meta = await fetchVideoMeta(url);

  const [video] = await db
    .insert(videosTable)
    .values({
      userId,
      url,
      title: meta.title,
      thumbnail: meta.thumbnail,
      duration: meta.duration,
      channelName: meta.channelName,
      description: meta.description,
      folderId: folderId || null,
      viewCount: meta.viewCount,
      publishedAt: meta.publishedAt,
    })
    .returning();

  res.status(201).json({ ...video, tags: [], folderName: null });
});

router.get("/videos/:videoId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { videoId } = req.params;
  const video = await getVideoWithTags(videoId, req.user.id);
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  const notes = await db
    .select()
    .from(notesTable)
    .where(
      and(
        eq(notesTable.videoId, videoId),
        eq(notesTable.userId, req.user.id),
      ),
    )
    .orderBy(sql`created_at ASC`);

  const aiOutputs = await db
    .select()
    .from(aiOutputsTable)
    .where(
      and(
        eq(aiOutputsTable.videoId, videoId),
        eq(aiOutputsTable.userId, req.user.id),
      ),
    )
    .orderBy(sql`created_at DESC`);

  res.json({ ...video, notes, aiOutputs });
});

router.patch("/videos/:videoId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { videoId } = req.params;
  const { folderId, title } = req.body as { folderId?: string | null; title?: string };

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (folderId !== undefined) updates.folderId = folderId;
  if (title !== undefined) updates.title = title;

  const [updated] = await db
    .update(videosTable)
    .set(updates)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  const video = await getVideoWithTags(videoId, req.user.id);
  res.json(video);
});

router.delete("/videos/:videoId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .delete(videosTable)
    .where(
      and(
        eq(videosTable.id, req.params.videoId),
        eq(videosTable.userId, req.user.id),
      ),
    );
  res.status(204).send();
});

router.post("/videos/:videoId/favorite", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { videoId } = req.params;
  const [video] = await db
    .select({ isFavorite: videosTable.isFavorite })
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  const newFav = !video.isFavorite;
  await db
    .update(videosTable)
    .set({ isFavorite: newFav, updatedAt: new Date() })
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  res.json({ isFavorite: newFav });
});

export default router;
