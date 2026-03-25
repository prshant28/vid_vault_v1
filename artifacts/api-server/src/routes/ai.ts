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
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 2000,
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
    model: "gpt-5-mini",
    messages,
    max_completion_tokens: 1000,
  });

  const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";
  res.json({ message: reply });
});

export default router;
