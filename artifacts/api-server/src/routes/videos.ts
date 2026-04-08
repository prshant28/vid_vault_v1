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
import { eq, and, ilike, inArray, sql, gte } from "drizzle-orm";
import { autoAnalyzeVideo } from "../lib/gemini";

async function extractPlaylistVideos(playlistId: string): Promise<Array<{id: string; title: string; description?: string}>> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return [];

  const videos: Array<{id: string; title: string; description?: string}> = [];
  let pageToken = undefined;

  try {
    while (videos.length < 500) {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("playlistId", playlistId);
      url.searchParams.set("part", "snippet");
      url.searchParams.set("maxResults", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const resp = await fetch(url.toString());
      if (!resp.ok) break;

      const data = (await resp.json()) as {
        items?: Array<{snippet?: {resourceId?: {videoId?: string}; title?: string; description?: string}}>;
        nextPageToken?: string;
      };

      if (!data.items) break;

      for (const item of data.items) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (videoId) {
          videos.push({
            id: videoId,
            title: item.snippet?.title || "Untitled",
            description: item.snippet?.description || undefined,
          });
        }
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
  } catch {
    // Silently fail and return what we have
  }

  return videos;
}

const router = Router();

/* ── GET /api/preview?url=... — fetch OG metadata for any URL ── */
router.get("/preview", async (req, res) => {
  const { url } = req.query as { url?: string };
  if (!url) return res.status(400).json({ error: "url required" });

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

      // Try YouTube Data API v3 first for rich metadata
      if (apiKey) {
        try {
          const ytResp = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${apiKey}`,
            { headers: { "Referer": "https://vidvault.app", "X-Referer": "https://vidvault.app" } },
          );
          if (ytResp.ok) {
            const ytData = await ytResp.json() as {
              items?: Array<{
                snippet?: { title?: string; channelTitle?: string; description?: string; publishedAt?: string };
                contentDetails?: { duration?: string };
                statistics?: { viewCount?: string };
              }>;
            };
            const item = ytData.items?.[0];
            if (item) {
              const rawDuration = item.contentDetails?.duration || "";
              const parsedDuration = parseDuration(rawDuration);
              return res.json({
                title: item.snippet?.title || "YouTube Video",
                image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                domain,
                favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
                type: "youtube",
                videoId,
                channelName: item.snippet?.channelTitle || null,
                duration: parsedDuration,
                viewCount: parseInt(item.statistics?.viewCount || "0") || null,
                publishedAt: item.snippet?.publishedAt || null,
              });
            }
          }
        } catch {}
      }

      // Fallback: scrape YouTube page for title, channel, duration, viewCount
      try {
        const pageResp = await fetch(
          `https://www.youtube.com/watch?v=${videoId}`,
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; VidVaultBot/1.0)" } },
        );
        if (pageResp.ok) {
          const html = await pageResp.text();
          const titleMatch = html.match(/"title":"([^"]+)"/);
          const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
          const durMatch = html.match(/"approxDurationMs":"(\d+)"/);
          const viewMatch = html.match(/"viewCount":"(\d+)"/);
          const title = titleMatch?.[1]?.replace(/\\u([\dA-F]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))) || "YouTube Video";
          const channelName = channelMatch?.[1]?.replace(/\\u([\dA-F]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))) || null;
          const durationMs = durMatch ? parseInt(durMatch[1]) : null;
          const durationFormatted = durationMs
            ? (() => {
                const totalSecs = Math.floor(durationMs / 1000);
                const h = Math.floor(totalSecs / 3600);
                const m = Math.floor((totalSecs % 3600) / 60);
                const s = totalSecs % 60;
                return h > 0
                  ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
                  : `${m}:${String(s).padStart(2, "0")}`;
              })()
            : null;
          const viewCount = viewMatch ? parseInt(viewMatch[1]) : null;
          if (title !== "YouTube Video" || channelName) {
            return res.json({
              title,
              image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              domain,
              favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
              type: "youtube",
              videoId,
              channelName,
              duration: durationFormatted,
              viewCount,
              publishedAt: null,
            });
          }
        }
      } catch {}

      // Fallback: oEmbed for title/channel
      try {
        const oeResp = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (oeResp.ok) {
          const oe = await oeResp.json() as { title?: string; author_name?: string };
          return res.json({
            title: oe.title || "YouTube Video",
            image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            domain,
            favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
            type: "youtube",
            videoId,
            channelName: oe.author_name || null,
            duration: null,
            viewCount: null,
            publishedAt: null,
          });
        }
      } catch {}

      // Final fallback: just return minimal info
      return res.json({
        title: "YouTube Video",
        image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        domain,
        favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
        type: "youtube",
        videoId,
        channelName: null,
        duration: null,
        viewCount: null,
        publishedAt: null,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VidVaultBot/1.0)" },
    });
    clearTimeout(timeout);

    const html = await resp.text();
    const getMeta = (prop: string): string | null => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
      return m ? m[1] : null;
    };
    const title = getMeta("og:title") || getMeta("twitter:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || domain;
    const image = getMeta("og:image") || getMeta("twitter:image") || null;
    const description = getMeta("og:description") || getMeta("twitter:description") || null;

    return res.json({
      title: title?.trim() || domain,
      image,
      description,
      domain,
      favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      type: "web",
    });
  } catch {
    try {
      const domain = new URL(url).hostname;
      return res.json({ title: domain, image: null, domain, favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`, type: "web" });
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }
  }
});

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
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${apiKey}`,
        { headers: { "Referer": "https://vidvault.app" } },
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
  const { folderId, tagId, search, favorites, hasAi, watched, recentDays, limit = "20", offset = "0" } = req.query as Record<string, string>;

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

  if (hasAi === "true") {
    const aiVids = await db
      .selectDistinct({ videoId: aiOutputsTable.videoId })
      .from(aiOutputsTable)
      .where(eq(aiOutputsTable.userId, userId));
    const aiIds = aiVids.map((r) => r.videoId);
    if (aiIds.length === 0) {
      res.json({ videos: [], total: 0 });
      return;
    }
    videoIds = videoIds ? videoIds.filter((id) => aiIds.includes(id)) : aiIds;
    if (videoIds.length === 0) {
      res.json({ videos: [], total: 0 });
      return;
    }
  }

  const conditions = [eq(videosTable.userId, userId)];
  if (folderId) conditions.push(eq(videosTable.folderId, folderId));
  if (favorites === "true") conditions.push(eq(videosTable.isFavorite, true));
  if (watched === "true") conditions.push(eq(videosTable.isWatched, true));
  if (search) conditions.push(ilike(videosTable.title, `%${search}%`));
  if (videoIds) conditions.push(inArray(videosTable.id, videoIds));
  if (recentDays) {
    const days = parseInt(recentDays) || 7;
    conditions.push(gte(videosTable.createdAt, new Date(Date.now() - days * 24 * 60 * 60 * 1000)));
  }

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
      const [tags, noteCountRes, aiCountRes] = await Promise.all([
        db.select({ id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
          .from(videoTagsTable)
          .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
          .where(eq(videoTagsTable.videoId, v.id)),
        db.select({ count: sql<number>`count(*)::int` })
          .from(notesTable)
          .where(and(eq(notesTable.videoId, v.id), eq(notesTable.userId, userId))),
        db.select({ count: sql<number>`count(*)::int` })
          .from(aiOutputsTable)
          .where(and(eq(aiOutputsTable.videoId, v.id), eq(aiOutputsTable.userId, userId))),
      ]);
      let folderName: string | null = null;
      if (v.folderId) {
        const [folder] = await db
          .select({ name: foldersTable.name })
          .from(foldersTable)
          .where(eq(foldersTable.id, v.folderId));
        folderName = folder?.name || null;
      }
      return {
        ...v,
        tags,
        folderName,
        notesCount: noteCountRes[0]?.count ?? 0,
        aiOutputsCount: aiCountRes[0]?.count ?? 0,
      };
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
  const { url, folderId, title: customTitle } = req.body as { url: string; folderId?: string; title?: string };

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
      title: customTitle?.trim() || meta.title,
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

  /* Fire-and-forget auto-analysis (summary + key_insights) via Gemini */
  autoAnalyzeVideo(
    video.id, userId,
    video.title, video.description || "",
    video.channelName || "",
    db, aiOutputsTable,
  ).catch(() => { /* ignore failures */ });
});

router.post("/videos/playlist", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const { url, folderName: customFolderName } = req.body as { url: string; folderName?: string };

  if (!url) {
    res.status(400).json({ error: "Playlist URL is required" });
    return;
  }

  // Extract playlist ID from URL
  const playlistMatch = url.match(/(?:youtube\.com\/playlist\?list=|youtube\.com\/watch\?.*list=)([a-zA-Z0-9_-]+)/);
  if (!playlistMatch) {
    res.status(400).json({ error: "Invalid YouTube playlist URL" });
    return;
  }

  const playlistId = playlistMatch[1];

  try {
    // Get playlist info to get the name
    const apiKey = process.env.YOUTUBE_API_KEY;
    let playlistTitle = customFolderName || "Imported Playlist";

    if (apiKey) {
      try {
        const playlistResp = await fetch(
          `https://www.googleapis.com/youtube/v3/playlists?id=${playlistId}&part=snippet&key=${apiKey}`,
        );
        if (playlistResp.ok) {
          const playlistData = (await playlistResp.json()) as {
            items?: Array<{snippet?: {title?: string}}>;
          };
          const title = playlistData.items?.[0]?.snippet?.title;
          if (title && !customFolderName) {
            playlistTitle = title;
          }
        }
      } catch {
        // Continue with default name
      }
    }

    // Create folder for this playlist
    const [folder] = await db
      .insert(foldersTable)
      .values({
        userId,
        name: playlistTitle,
        color: "#6366f1",
      })
      .returning();

    // Extract all videos from playlist
    const playlistVideos = await extractPlaylistVideos(playlistId);

    if (playlistVideos.length === 0) {
      res.status(400).json({ error: "No videos found in playlist or playlist is private" });
      return;
    }

    // Fast insert: use basic playlist data + derived thumbnail (no per-video API calls)
    const importedVideos = [];
    for (const pv of playlistVideos) {
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${pv.id}`;
        const thumbnail = `https://img.youtube.com/vi/${pv.id}/maxresdefault.jpg`;
        const [video] = await db
          .insert(videosTable)
          .values({
            userId,
            url: videoUrl,
            title: pv.title,
            thumbnail,
            description: pv.description || null,
            folderId: folder.id,
          })
          .returning();
        importedVideos.push(video);
      } catch {
        // Continue on error for individual videos
      }
    }

    res.status(201).json({
      folder: { id: folder.id, name: folder.name, videosCount: importedVideos.length },
      imported: importedVideos.length,
      skipped: playlistVideos.length - importedVideos.length,
      total: playlistVideos.length,
    });

    // Background: enrich with full metadata (duration, channel, viewCount)
    for (const v of importedVideos) {
      fetchVideoMeta(v.url || "").then((meta) => {
        db.update(videosTable).set({
          duration: meta.duration,
          channelName: meta.channelName,
          viewCount: meta.viewCount,
          publishedAt: meta.publishedAt,
        }).where(eq(videosTable.id, v.id)).catch(() => {});
      }).catch(() => {});
    }
  } catch (err) {
    req.log.error({ err }, "Playlist import error");
    res.status(500).json({ error: "Failed to import playlist" });
  }
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

router.post("/videos/:videoId/watch", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { videoId } = req.params;
  const [video] = await db
    .select({ isWatched: videosTable.isWatched })
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  const newWatched = !video.isWatched;
  await db
    .update(videosTable)
    .set({ isWatched: newWatched, updatedAt: new Date() })
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  res.json({ isWatched: newWatched });
});

/* ── Transcript: proxy YouTube timedtext for a saved video ── */
router.get("/videos/:videoId/transcript", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { videoId } = req.params;

  const [video] = await db
    .select({ url: videosTable.url })
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  function extractYtId(url: string): string | null {
    if (!url) return null;
    for (const p of [/[?&]v=([a-zA-Z0-9_-]{11})/, /youtu\.be\/([a-zA-Z0-9_-]{11})/, /embed\/([a-zA-Z0-9_-]{11})/, /shorts\/([a-zA-Z0-9_-]{11})/]) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  const ytId = extractYtId(video.url || "");
  if (!ytId) { res.status(400).json({ error: "No YouTube ID found for this video" }); return; }

  try {
    const langs = ["en", "en-US", "en-GB", "a.en"];
    let lines: Array<{ start: number; dur: number; text: string }> = [];

    for (const lang of langs) {
      const url = `https://www.youtube.com/api/timedtext?v=${ytId}&lang=${lang}&fmt=json3`;
      const r = await fetch(url, { headers: { "Accept-Language": "en-US,en;q=0.9" } });
      if (!r.ok) continue;
      const data: any = await r.json();
      const events = data?.events ?? [];
      lines = events
        .filter((e: any) => e.segs)
        .map((e: any) => ({
          start: (e.tStartMs ?? 0) / 1000,
          dur:   (e.dDurationMs ?? 3000) / 1000,
          text:  (e.segs as any[]).map((s: any) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim(),
        }))
        .filter((l: any) => l.text);
      if (lines.length > 0) break;
    }

    if (lines.length === 0) {
      res.status(404).json({ error: "No transcript available for this video. Try a video with captions enabled." });
      return;
    }

    res.json({ ytId, lines });
  } catch (err: any) {
    res.status(503).json({ error: "Could not fetch transcript: " + (err.message || "unknown error") });
  }
});

router.get("/search", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const { q } = req.query as { q?: string };

  if (!q || q.trim().length < 2) {
    res.json({ videos: [], notes: [], aiOutputs: [] });
    return;
  }

  const term = `%${q.trim()}%`;

  const [videos, notes, aiOutputs] = await Promise.all([
    db.select({
      id: videosTable.id,
      title: videosTable.title,
      thumbnail: videosTable.thumbnail,
      channelName: videosTable.channelName,
      duration: videosTable.duration,
      folderId: videosTable.folderId,
      createdAt: videosTable.createdAt,
    }).from(videosTable)
      .where(and(eq(videosTable.userId, userId), ilike(videosTable.title, term)))
      .limit(10),

    db.select({
      id: notesTable.id,
      content: notesTable.content,
      timestamp: notesTable.timestamp,
      videoId: notesTable.videoId,
      createdAt: notesTable.createdAt,
      videoTitle: videosTable.title,
      videoThumbnail: videosTable.thumbnail,
    }).from(notesTable)
      .innerJoin(videosTable, eq(notesTable.videoId, videosTable.id))
      .where(and(eq(notesTable.userId, userId), ilike(notesTable.content, term)))
      .limit(8),

    db.select({
      id: aiOutputsTable.id,
      type: aiOutputsTable.type,
      content: aiOutputsTable.content,
      videoId: aiOutputsTable.videoId,
      createdAt: aiOutputsTable.createdAt,
      videoTitle: videosTable.title,
      videoThumbnail: videosTable.thumbnail,
    }).from(aiOutputsTable)
      .innerJoin(videosTable, eq(aiOutputsTable.videoId, videosTable.id))
      .where(and(eq(aiOutputsTable.userId, userId), ilike(aiOutputsTable.content, term)))
      .limit(8),
  ]);

  res.json({
    videos,
    notes: notes.map((n) => ({ ...n, snippet: n.content.slice(0, 200) })),
    aiOutputs: aiOutputs.map((a) => ({ ...a, snippet: a.content.slice(0, 200) })),
  });
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
