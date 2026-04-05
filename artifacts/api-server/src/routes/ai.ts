import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, aiOutputsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

/* ── AI provider: Gemini first, OpenAI fallback ── */
async function generateAiText(prompt: string): Promise<string> {
  const googleKey = process.env.GOOGLE_API_KEY;
  if (googleKey) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
      }
    );
    if (resp.ok) {
      const data = await resp.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }
  }

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No AI API key configured. Set GOOGLE_API_KEY or OPENAI_API_KEY.");

  const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
  });
  return completion.choices[0]?.message?.content || "";
}

const AI_PROMPTS: Record<string, (title: string, desc: string, channel: string) => string> = {
  summary: (title, desc, channel) =>
    `You are a video summarization expert. Summarize the following video in a clear, engaging way (3-5 paragraphs). Include key topics covered, main takeaways, and who it's best for.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nProvide a comprehensive summary:`,

  notes: (title, desc, channel) =>
    `Create detailed study notes for this video. Format as bullet points organized by topic with clear headings.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nStudy Notes:`,

  ppt_outline: (title, desc, channel) =>
    `Create a PowerPoint presentation outline for this video content. Include slide titles, bullet points for each slide, and speaker notes suggestions. Target 8-12 slides.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nPresentation Outline:`,

  mcq: (title, desc, channel) =>
    `Generate 10 multiple choice questions (MCQs) to test understanding of this video content. For each question include: the question, 4 options (A-D), and the correct answer with explanation.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nMCQs:`,

  flashcards: (title, desc, channel) =>
    `Create 15 flashcards from this video content. Format each as:\nFront: [question/term]\nBack: [answer/definition]\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nFlashcards:`,

  blog_article: (title, desc, channel) =>
    `Write a comprehensive blog article based on this video content. Include an engaging title, introduction, main sections with subheadings, key insights, and conclusion. Target 600-800 words.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nBlog Article:`,

  key_insights: (title, desc, channel) =>
    `Extract the top 7-10 key insights and actionable takeaways from this video. Format each insight with a bold title and 2-3 sentences of explanation.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nKey Insights:`,
};

router.post("/videos/:videoId/ai/generate", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
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

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  try {
    const prompt = AI_PROMPTS[type](video.title, video.description || "", video.channelName || "");
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

router.get("/videos/:videoId/ai/outputs", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const outputs = await db
    .select()
    .from(aiOutputsTable)
    .where(
      and(
        eq(aiOutputsTable.videoId, req.params.videoId),
        eq(aiOutputsTable.userId, req.user.id),
      ),
    )
    .orderBy(sql`created_at DESC`);

  res.json({ outputs });
});

router.post("/ai/chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { message, videoId, history } = req.body as {
    message: string;
    videoId?: string;
    history?: { role: string; content: string }[];
  };

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  let contextInfo = "";
  if (videoId) {
    const [video] = await db
      .select()
      .from(videosTable)
      .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));
    if (video) {
      contextInfo = `\n\nCurrent video:\nTitle: "${video.title}"\nChannel: ${video.channelName || "Unknown"}\nDescription: ${video.description || "Not available"}`;
    }
  }

  const historyText = (history || []).map((h) => `${h.role}: ${h.content}`).join("\n");
  const prompt = `You are VidVault AI, an intelligent video knowledge assistant. Help users understand, analyze, and extract insights from their saved videos.${contextInfo}\n\n${historyText ? `Conversation history:\n${historyText}\n\n` : ""}User: ${message}\nAssistant:`;

  try {
    const reply = await generateAiText(prompt);
    res.json({ message: reply });
  } catch (err: any) {
    res.status(503).json({ error: err.message || "AI service not configured" });
  }
});

/* ── YouTube search endpoint ── */
router.get("/youtube/search", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { q, maxResults = "10" } = req.query as { q?: string; maxResults?: string };
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "YouTube API key not configured" });
    return;
  }

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
          title: string;
          channelTitle: string;
          description: string;
          publishedAt: string;
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
  } catch (err: any) {
    res.status(502).json({ error: "Failed to search YouTube" });
  }
});

/* ── Global AI chat ── */
router.post("/ai/global-chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { message, history } = req.body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const userId = req.user.id;
  const libraryVideos = await db
    .select({ id: videosTable.id, title: videosTable.title, channelName: videosTable.channelName })
    .from(videosTable)
    .where(eq(videosTable.userId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(100);

  const libraryContext = libraryVideos.length > 0
    ? `\n\nUser library (${libraryVideos.length} videos): ${libraryVideos.map((v) => `"${v.title}"`).join(", ")}`
    : "\n\nNo videos saved yet.";

  const historyText = (history || []).map((h) => `${h.role}: ${h.content}`).join("\n");
  const prompt = `You are VidVault AI — an intelligent assistant that helps users explore their video library and discover new content.${libraryContext}\n\n${historyText ? `Previous messages:\n${historyText}\n\n` : ""}User: ${message}\nAssistant:`;

  try {
    const reply = await generateAiText(prompt);
    res.json({ message: reply, libraryVideos: [], youtubeVideos: [], action: null });
  } catch (err: any) {
    res.status(503).json({ error: err.message || "AI service not available" });
  }
});

export default router;
