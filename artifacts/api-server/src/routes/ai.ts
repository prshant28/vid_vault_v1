import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, aiOutputsTable } from "@workspace/db";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { generateAiText, AI_PROMPTS, autoAnalyzeVideo } from "../lib/gemini";

const router = Router();

/* ── Generate a single AI output for a video ── */
router.post("/videos/:videoId/ai/generate", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { videoId } = req.params;
  const { type, language } = req.body as { type: string; language?: string };

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
    const basePrompt = AI_PROMPTS[type](video.title, video.description || "", video.channelName || "");
    const prompt = language && language !== "en"
      ? `${basePrompt}\n\nIMPORTANT: Write your entire response in Hindi (हिंदी). Use Devanagari script throughout.`
      : basePrompt;
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

/* ── Get a single AI output by type for a video ── */
router.get("/videos/:videoId/ai/outputs/type/:type", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { videoId, type } = req.params;

  const [video] = await db
    .select({ id: videosTable.id, title: videosTable.title, channelName: videosTable.channelName, url: videosTable.url })
    .from(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  const [output] = await db
    .select()
    .from(aiOutputsTable)
    .where(and(eq(aiOutputsTable.videoId, videoId), eq(aiOutputsTable.userId, req.user.id), eq(aiOutputsTable.type, type)));

  res.json({ video, output: output || null });
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

/* ── AI health-check — returns which providers are configured and live ── */
router.get("/ai/health", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const status: Record<string, any> = {
    google_api_key: !!process.env.GOOGLE_API_KEY,
    replit_integration: !!(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
    openai_key: !!process.env.OPENAI_API_KEY,
    gemini_model_tested: null as string | null,
    gemini_ok: false,
    error: null as string | null,
  };

  if (process.env.GOOGLE_API_KEY) {
    const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of models) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
              generationConfig: { maxOutputTokens: 10, temperature: 0 },
            }),
          },
        );
        if (resp.ok) {
          const data = (await resp.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            status.gemini_ok = true;
            status.gemini_model_tested = model;
            break;
          }
        } else {
          const err = (await resp.json()) as { error?: { message?: string } };
          status.error = err?.error?.message || `HTTP ${resp.status}`;
        }
      } catch (e: any) {
        status.error = e.message;
      }
    }
  }

  res.json(status);
});

/* ── helpers ── */
function isRecallQuery(msg: string) {
  const lower = msg.toLowerCase();
  return /\b(which|what|show|find|recall|remember|list|have i|did i|i watched|i saved|my library|in my vault|from my|about)\b/.test(lower)
    && /\b(watched|saved|library|vault|videos?|seen|have)\b/.test(lower);
}

function isFindQuery(msg: string) {
  const lower = msg.toLowerCase();
  return /\b(find|search|get|show me|recommend|trending|discover|look for|fetch)\b/.test(lower)
    && /\b(videos?|youtube|tutorials?|lectures?|courses?|content)\b/.test(lower);
}

function extractSearchTopic(msg: string): string {
  return msg
    .replace(/\b(find|search|get|show me|recommend|trending|discover|look for|fetch)\s*(me)?\s*(videos?|youtube videos?|tutorials?)?\s*(about|on|for|related to)?\s*/i, "")
    .replace(/\b(on youtube|from youtube)\b/i, "")
    .trim() || msg.trim();
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function searchYouTube(query: string, maxResults = 5) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json() as { items?: any[] };
    return (data.items || []).map((item: any) => ({
      youtubeId: item.id?.videoId,
      title: item.snippet?.title || "Unknown",
      channel: item.snippet?.channelTitle || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id?.videoId}/mqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    })).filter((v: any) => v.youtubeId);
  } catch {
    return [];
  }
}

/* ── Global AI chat (Recall + YouTube search) ── */
router.post("/ai/global-chat", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { message, history } = req.body as {
    message: string; history?: { role: "user" | "assistant"; content: string }[];
  };
  if (!message) { res.status(400).json({ error: "Message is required" }); return; }

  const userId = req.user.id;

  /* Fetch full library with metadata for context + recall */
  const allLibrary = await db
    .select({
      id: videosTable.id,
      title: videosTable.title,
      channelName: videosTable.channelName,
      thumbnail: videosTable.thumbnail,
      duration: videosTable.duration,
      url: videosTable.url,
      createdAt: videosTable.createdAt,
    })
    .from(videosTable)
    .where(eq(videosTable.userId, userId))
    .orderBy(sql`${videosTable.createdAt} DESC`)
    .limit(200);

  /* ── Recall: search the library for matching videos ── */
  let matchedLibraryVideos: typeof allLibrary = [];
  if (isRecallQuery(message)) {
    const topic = message
      .toLowerCase()
      .replace(/\b(which|what|show|find|recall|remember|list|have i|did i|i watched|i saved|my library|in my vault|from my|about|videos?|watched|saved|the|a|an)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (topic.length >= 2) {
      const words = topic.split(/\s+/).filter((w) => w.length >= 3).slice(0, 5);
      if (words.length > 0) {
        const searchConditions = words.map((w) =>
          or(ilike(videosTable.title, `%${w}%`), ilike(videosTable.channelName, `%${w}%`))
        );
        const filtered = allLibrary.filter((v) =>
          words.some((w) =>
            (v.title || "").toLowerCase().includes(w) ||
            (v.channelName || "").toLowerCase().includes(w)
          )
        );
        matchedLibraryVideos = filtered.slice(0, 8);
      }
    }

    /* Fall back to showing recent videos if no topic match */
    if (matchedLibraryVideos.length === 0 && allLibrary.length > 0) {
      matchedLibraryVideos = allLibrary.slice(0, 5);
    }
  }

  /* ── YouTube search: fetch real results when user asks to find videos ── */
  let youtubeVideos: { youtubeId: string; title: string; channel: string; thumbnail: string; url: string }[] = [];
  if (isFindQuery(message)) {
    const topic = extractSearchTopic(message);
    youtubeVideos = await searchYouTube(topic, 5);
  }

  /* Build library context for the AI prompt */
  const libraryContext = allLibrary.length > 0
    ? `\n\nUser's video library (${allLibrary.length} saved videos, newest first):\n${allLibrary.slice(0, 60).map((v) => `- "${v.title}" by ${v.channelName || "Unknown"} (saved ${new Date(v.createdAt || "").toLocaleDateString()})`).join("\n")}`
    : "\n\nThe user has no saved videos yet.";

  const recallContext = matchedLibraryVideos.length > 0
    ? `\n\nVideos matching the user's recall query:\n${matchedLibraryVideos.map((v) => `- "${v.title}" by ${v.channelName || "Unknown"}${v.duration ? ` (${formatDuration(v.duration)})` : ""}, saved ${new Date(v.createdAt || "").toLocaleDateString()}`).join("\n")}`
    : "";

  const historyText = (history || []).map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n");

  const prompt = `You are VidVault AI — an intelligent assistant that helps users explore their video knowledge library and discover new content on YouTube. Be helpful, concise, and insightful. When asked about their library or what they have watched, reference specific video titles and provide a clear summary of what those videos cover. When asked to find videos, give useful context about the results.${libraryContext}${recallContext}\n\n${historyText ? `Conversation history:\n${historyText}\n\n` : ""}User: ${message}\nAssistant:`;

  try {
    const reply = await generateAiText(prompt);
    res.json({
      message: reply,
      libraryVideos: matchedLibraryVideos.map((v) => ({
        id: v.id,
        title: v.title,
        channelName: v.channelName,
        thumbnail: v.thumbnail,
        duration: v.duration,
        url: v.url,
        createdAt: v.createdAt,
      })),
      youtubeVideos,
      action: null,
    });
  } catch (err: any) {
    res.status(503).json({ error: err.message || "AI service not available" });
  }
});

export default router;
