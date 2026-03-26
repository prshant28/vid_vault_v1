import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, aiOutputsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

function getOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OpenAI API key configured");
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

const AI_MODEL = "gpt-4o-mini";

const AI_PROMPTS: Record<string, (title: string, desc: string, channel: string) => string> = {
  summary: (title, desc, channel) =>
    `You are a video summarization expert. Summarize the following YouTube video in a clear, engaging way (3-5 paragraphs). Include key topics covered, main takeaways, and who it's best for.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nProvide a comprehensive summary:`,

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

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(503).json({ error: "AI service not configured. Please set OPENAI_API_KEY." });
    return;
  }

  const prompt = AI_PROMPTS[type](
    video.title,
    video.description || "",
    video.channelName || "",
  );

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content || "";

  const [output] = await db
    .insert(aiOutputsTable)
    .values({ videoId, userId: req.user.id, type, content })
    .returning();

  res.json(output);
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

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(503).json({ error: "AI service not configured. Please set OPENAI_API_KEY." });
    return;
  }

  let systemPrompt = "You are VidVault AI, an intelligent video knowledge assistant. Help users understand, analyze, and extract insights from their saved videos.";

  if (videoId) {
    const [video] = await db
      .select()
      .from(videosTable)
      .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.user.id)));
    if (video) {
      systemPrompt += `\n\nThe user is currently viewing this video:\nTitle: "${video.title}"\nChannel: ${video.channelName || "Unknown"}\nDescription: ${video.description || "Not available"}`;
    }
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    max_tokens: 1000,
  });

  const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";
  res.json({ message: reply });
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

/* ── Global AI chat — searches library + YouTube ── */
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

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(503).json({ error: "AI service not configured." });
    return;
  }

  const userId = req.user.id;

  const libraryVideos = await db
    .select({ id: videosTable.id, title: videosTable.title, channelName: videosTable.channelName, thumbnail: videosTable.thumbnail, url: videosTable.url, duration: videosTable.duration })
    .from(videosTable)
    .where(eq(videosTable.userId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(200);

  const libraryContext = libraryVideos.length > 0
    ? `\n\nUser's saved video library (${libraryVideos.length} videos):\n` +
      libraryVideos.map((v, i) => `${i + 1}. "${v.title}"${v.channelName ? ` by ${v.channelName}` : ""} [id:${v.id}]`).join("\n")
    : "\n\nThe user has no videos saved yet.";

  const systemPrompt = `You are VidVault AI — an intelligent assistant that helps users explore their video library and discover new content on YouTube.${libraryContext}

Your capabilities:
1. Answer questions about the user's library
2. Search the library when relevant using search_library
3. Find new YouTube videos on any topic using search_youtube

When users ask to find videos on a topic, ALWAYS call search_youtube. When they ask about their saved collection, call search_library.
Be concise and helpful. Reference library videos by their title.`;

  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "search_library",
        description: "Search the user's saved video library for videos matching a topic or keyword",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search term to find matching videos in the library" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_youtube",
        description: "Search YouTube for the top videos on a topic. Returns thumbnail, title, channel, and URL.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query for YouTube" },
            maxResults: { type: "number", description: "Number of results to return (max 10)", default: 10 },
          },
          required: ["query"],
        },
      },
    },
  ];

  const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  let foundLibraryVideos: typeof libraryVideos = [];
  let foundYoutubeVideos: Array<{
    youtubeId: string; title: string; channel: string; thumbnail: string; description: string; url: string;
  }> = [];
  let action: string | null = null;

  const firstResponse = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: conversationMessages,
    tools,
    tool_choice: "auto",
    max_tokens: 800,
  });

  const firstChoice = firstResponse.choices[0];

  if (firstChoice.finish_reason === "tool_calls" && firstChoice.message.tool_calls) {
    const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [firstChoice.message];

    for (const call of firstChoice.message.tool_calls) {
      const args = JSON.parse(call.function.arguments || "{}");

      if (call.function.name === "search_library") {
        action = "search_library";
        const q = (args.query || "").toLowerCase();
        foundLibraryVideos = libraryVideos.filter((v) =>
          v.title.toLowerCase().includes(q) || (v.channelName || "").toLowerCase().includes(q)
        ).slice(0, 10);

        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: foundLibraryVideos.length > 0
            ? `Found ${foundLibraryVideos.length} videos: ${foundLibraryVideos.map((v) => `"${v.title}"`).join(", ")}`
            : "No matching videos found in the library.",
        });
      } else if (call.function.name === "search_youtube") {
        action = "search_youtube";
        const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
        const maxResults = Math.min(args.maxResults || 10, 10);

        if (apiKey) {
          try {
            const ytResp = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args.query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
            );
            if (ytResp.ok) {
              const ytData = await ytResp.json() as {
                items?: Array<{
                  id: { videoId: string };
                  snippet: { title: string; channelTitle: string; description: string; publishedAt: string; thumbnails: { high?: { url: string }; default?: { url: string } } };
                }>;
              };
              foundYoutubeVideos = (ytData.items || []).map((item) => ({
                youtubeId: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || "",
                description: item.snippet.description,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              }));
            }
          } catch {}
        }

        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: foundYoutubeVideos.length > 0
            ? `Found ${foundYoutubeVideos.length} YouTube videos: ${foundYoutubeVideos.map((v) => `"${v.title}" by ${v.channel}`).join(", ")}`
            : "Could not find YouTube videos. YouTube API may not be configured.",
        });
      }
    }

    const finalMessages = [...conversationMessages, ...toolMessages];
    const finalResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: finalMessages,
      max_tokens: 600,
    });

    const reply = finalResponse.choices[0]?.message?.content || "Here are the results.";
    res.json({ message: reply, libraryVideos: foundLibraryVideos, youtubeVideos: foundYoutubeVideos, action });
  } else {
    const reply = firstChoice.message?.content || "I couldn't generate a response.";
    res.json({ message: reply, libraryVideos: [], youtubeVideos: [], action: null });
  }
});

export default router;
