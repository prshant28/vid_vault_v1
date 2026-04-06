import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, aiOutputsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { generateAiText, AI_PROMPTS, autoAnalyzeVideo } from "../lib/gemini";

const router = Router();

/* ── Generate a single AI output for a video ── */
router.post("/videos/:videoId/ai/generate", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { videoId } = req.params;
  const { type } = req.body as { type: string };

  if (!AI_PROMPTS[type]) {
    res.status(400).json({ error: `Invalid type. Must be one of: ${Object.keys(AI_PROMPTS).join(", ")}` });
    return;
  }

  const [video] = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  try {
    const prompt  = AI_PROMPTS[type](video.title, video.description || "", video.channelName || "");
    const content = await generateAiText(prompt);

    const [existing] = await db
      .select()
      .from(aiOutputsTable)
      .where(and(eq(aiOutputsTable.videoId, videoId), eq(aiOutputsTable.userId, req.user.id), eq(aiOutputsTable.type, type)));

    let output;
    if (existing) {
      [output] = await db
        .update(aiOutputsTable)
        .set({ content, createdAt: new Date() })
        .where(eq(aiOutputsTable.id, existing.id))
        .returning();
    } else {
      [output] = await db
        .insert(aiOutputsTable)
        .values({ videoId, userId: req.user.id, type, content })
        .returning();
    }
    res.json(output);
  } catch (err: any) {
    res.status(503).json({ error: err.message || "AI service not available" });
  }
});

/* ── Quick-analyze: generate summary + key_insights in parallel ── */
router.post("/videos/:videoId/ai/quick-analyze", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { videoId } = req.params;

  const [video] = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  const types = ["summary", "key_insights"] as const;
  const results: Record<string, any> = {};

  await Promise.allSettled(
    types.map(async (type) => {
      try {
        const prompt  = AI_PROMPTS[type](video.title, video.description || "", video.channelName || "");
        const content = await generateAiText(prompt);

        const [existing] = await db
          .select()
          .from(aiOutputsTable)
          .where(and(eq(aiOutputsTable.videoId, videoId), eq(aiOutputsTable.userId, req.user.id), eq(aiOutputsTable.type, type)));

        let output;
        if (existing) {
          [output] = await db.update(aiOutputsTable).set({ content, createdAt: new Date() }).where(eq(aiOutputsTable.id, existing.id)).returning();
        } else {
          [output] = await db.insert(aiOutputsTable).values({ videoId, userId: req.user.id, type, content }).returning();
        }
        results[type] = output;
      } catch (err: any) {
        results[type] = { error: err.message };
      }
    }),
  );
  res.json({ results });
});

/* ── Regenerate / delete a specific AI output ── */
router.delete("/videos/:videoId/ai/outputs/:outputId", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db
    .delete(aiOutputsTable)
    .where(and(eq(aiOutputsTable.id, req.params.outputId), eq(aiOutputsTable.userId, req.user.id)));
  res.status(204).send();
});

/* ── List all AI outputs for a video ── */
router.get("/videos/:videoId/ai/outputs", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const outputs = await db
    .select()
    .from(aiOutputsTable)
    .where(and(eq(aiOutputsTable.videoId, req.params.videoId), eq(aiOutputsTable.userId, req.user.id)))
    .orderBy(sql`created_at DESC`);
  res.json({ outputs });
});

/* ── Video-specific AI chat ── */
router.post("/ai/chat", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { message, videoId, history } = req.body as {
    message: string; videoId?: string;
    history?: { role: string; content: string }[];
  };
  if (!message) { res.status(400).json({ error: "Message is required" }); return; }

  let contextInfo = "";
  if (videoId) {
    const [video] = await db
      .select()
      .from(videosTable)
      .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));
    if (video) {
      contextInfo = `\n\nContext — current video:\nTitle: "${video.title}"\nChannel: ${video.channelName || "Unknown"}\nDescription: ${video.description || "Not available"}`;
    }
  }

  const historyText = (history || []).map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n");
  const prompt = `You are VidVault AI — an expert video-knowledge assistant. Help the user understand, analyse, and extract insights from their videos. Give clear, well-structured answers.${contextInfo}\n\n${historyText ? `Conversation history:\n${historyText}\n\n` : ""}User: ${message}\nAssistant:`;

  try {
    const reply = await generateAiText(prompt);
    res.json({ message: reply });
  } catch (err: any) {
    res.status(503).json({ error: err.message || "AI service not configured" });
  }
});

/* ── YouTube Data API search ── */
router.get("/youtube/search", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { q, maxResults = "10" } = req.query as { q?: string; maxResults?: string };
  if (!q) { res.status(400).json({ error: "Query parameter 'q' is required" }); return; }

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) { res.status(503).json({ error: "YouTube API key not configured" }); return; }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=${Math.min(parseInt(maxResults) || 10, 10)}&key=${apiKey}`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) {
      const err = await searchResp.json() as { error?: { message?: string } };
      res.status(502).json({ error: err?.error?.message || "YouTube API error" });
      return;
    }
    const data = await searchResp.json() as {
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string; channelTitle: string; description: string; publishedAt: string;
          thumbnails: { high?: { url: string }; default?: { url: string } };
        };
      }>;
    };
    const videos = (data.items || []).map((item) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || "",
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
    }));
    res.json({ videos, query: q });
  } catch {
    res.status(502).json({ error: "Failed to search YouTube" });
  }
});

/* ── Global AI chat (with library context + YouTube search) ── */
router.post("/ai/global-chat", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { message, history } = req.body as {
    message: string; history?: { role: "user" | "assistant"; content: string }[];
  };
  if (!message) { res.status(400).json({ error: "Message is required" }); return; }

  const userId = req.user.id;
  const libraryVideos = await db
    .select({ id: videosTable.id, title: videosTable.title, channelName: videosTable.channelName })
    .from(videosTable)
    .where(eq(videosTable.userId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(100);

  const libraryContext = libraryVideos.length > 0
    ? `\n\nUser's video library (${libraryVideos.length} saved videos):\n${libraryVideos.map((v) => `- "${v.title}" by ${v.channelName || "Unknown"}`).join("\n")}`
    : "\n\nThe user has no saved videos yet.";

  const historyText = (history || []).map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n");

  const prompt = `You are VidVault AI — an intelligent assistant that helps users explore their video knowledge library and discover new content. Be helpful, concise, and insightful. When asked about their library, reference actual video titles. When asked to find videos, give useful topic guidance.${libraryContext}\n\n${historyText ? `Conversation history:\n${historyText}\n\n` : ""}User: ${message}\nAssistant:`;

  try {
    const reply = await generateAiText(prompt);
    res.json({ message: reply, libraryVideos: [], youtubeVideos: [], action: null });
  } catch (err: any) {
    res.status(503).json({ error: err.message || "AI service not available" });
  }
});

export default router;
