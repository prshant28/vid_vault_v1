import OpenAI from "openai";

/* ══════════════════════════════════════════
   AI text generation — OpenAI (OPENAI_API_KEY)
   is the primary provider. Replit AI Integration
   proxy acts as a fallback if available.
   GOOGLE_API_KEY / YOUTUBE_API_KEY are only
   used for YouTube Data API calls (in routes).
══════════════════════════════════════════ */

export async function generateAiText(prompt: string): Promise<string> {
  /* 1️⃣  User-supplied OpenAI-compatible key — primary */
  const ownKey = process.env.OPENAI_API_KEY;
  if (ownKey) {
    try {
      const isOpenRouter = ownKey.startsWith("sk-or-");
      const openai = new OpenAI({
        apiKey: ownKey,
        ...(isOpenRouter ? { baseURL: "https://openrouter.ai/api/v1" } : {}),
      });
      const model = isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini";
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
        temperature: 0.75,
      });
      const text = completion.choices[0]?.message?.content;
      if (text) {
        console.info("[AI] Success via OpenAI");
        return text.trim();
      }
    } catch (err: any) {
      console.warn(`[AI] OpenAI failed: ${err.message}`);
      throw new Error(`OpenAI request failed: ${err.message}`);
    }
  }

  /* 2️⃣  Replit AI Integration proxy (OpenAI-compatible) */
  const integrationBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const integrationKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (integrationBase && integrationKey) {
    try {
      const openai = new OpenAI({ apiKey: integrationKey, baseURL: integrationBase });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2500,
      });
      const text = completion.choices[0]?.message?.content;
      if (text) {
        console.info("[AI] Success via Replit integration proxy");
        return text.trim();
      }
    } catch (err: any) {
      console.warn(`[AI] Replit integration proxy failed: ${err.message}`);
    }
  }

  const hasProviders = !!ownKey || !!(integrationBase && integrationKey);
  throw new Error(
    hasProviders
      ? "AI generation failed — the configured provider returned an error. Check your OPENAI_API_KEY."
      : "No AI provider configured. Please add your OPENAI_API_KEY in the Secrets panel.",
  );
}

/* ══════════════════════════════════════════
   Prompt registry — all AI tool types
══════════════════════════════════════════ */
export const AI_PROMPTS: Record<string, (title: string, desc: string, channel: string) => string> = {
  summary: (title, desc, channel) =>
    `You are a world-class video summarization expert. Create a clear, engaging 3-5 paragraph summary of the following video. Cover key topics, main takeaways, who it's best for, and why it matters.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nWrite a comprehensive, insightful summary:`,

  key_insights: (title, desc, channel) =>
    `Extract the 8-10 most impactful insights and actionable takeaways from this video. For each insight, write a short bold title (5-7 words) followed by 2-3 sentences of explanation. Be specific and practical.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nKey Insights:`,

  notes: (title, desc, channel) =>
    `Create comprehensive study notes for this video organised by topic. Use clear headings and sub-bullets. Include key definitions, examples, and important concepts. Make them revision-ready.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nStudy Notes:`,

  ppt_outline: (title, desc, channel) =>
    `Create a detailed PowerPoint presentation outline (8-12 slides) for this video. For each slide: slide number, title, 3-5 bullet points, and optional speaker notes. Make it professional and presentation-ready.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nPresentation Outline:`,

  mcq: (title, desc, channel) =>
    `Generate 10 multiple choice questions to test understanding of this video. For each question: the question, 4 options (A–D), the correct answer, and a brief explanation. Range from easy to challenging.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nMCQs:`,

  flashcards: (title, desc, channel) =>
    `Create 15 high-quality flashcards from this video for spaced-repetition study. Format each as:\n**Front:** [question or term]\n**Back:** [answer or definition]\n\nCover the most important concepts.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nFlashcards:`,

  blog_article: (title, desc, channel) =>
    `Write a high-quality 700-900 word blog article based on this video. Include: an attention-grabbing title, strong introduction, 3-4 main sections with subheadings, key insights, practical tips, and a conclusion with call-to-action. Write in a clear, engaging tone.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nBlog Article:`,

  tweet_thread: (title, desc, channel) =>
    `Create an engaging Twitter/X thread (10-15 tweets) summarising the key ideas from this video. Start with a hook tweet, then one insight per tweet, end with a conclusion tweet. Use emojis sparingly. Mark each tweet with its number (1/, 2/, etc.). Keep each tweet under 280 characters.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nTwitter Thread:`,

  action_plan: (title, desc, channel) =>
    `Create a practical 30-60-90 day action plan based on the ideas in this video. Break it into:\n- **Immediate (Week 1):** Quick wins and first steps\n- **Short-term (30 days):** Core implementation steps\n- **Medium-term (60 days):** Progress milestones\n- **Long-term (90 days):** Full integration and review\n\nFor each timeframe, list 3-5 specific, measurable actions.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nAction Plan:`,

  vocabulary: (title, desc, channel) =>
    `Extract 15-20 key terms, concepts, and vocabulary from this video. For each term:\n- **Term:** The exact word or phrase\n- **Definition:** Clear 1-2 sentence explanation\n- **Context:** How it's used in this video\n\nInclude both basic and advanced terms.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nVocabulary List:`,

  executive_brief: (title, desc, channel) =>
    `Write a concise executive briefing document (300-400 words) for this video that a busy professional can read in 2 minutes. Include: a 1-sentence TL;DR, the 3 most important points, business implications, and recommended next steps.\n\nVideo: "${title}"\nChannel: ${channel || "Unknown"}\nDescription: ${desc || "Not available"}\n\nExecutive Brief:`,
};

/* Auto-analysis: generate summary + key_insights in parallel on video save */
export async function autoAnalyzeVideo(
  videoId: string,
  userId: string,
  title: string,
  description: string,
  channelName: string,
  db: any,
  aiOutputsTable: any,
): Promise<void> {
  const types = ["summary", "key_insights"];
  await Promise.allSettled(
    types.map(async (type) => {
      try {
        const prompt = AI_PROMPTS[type](title, description, channelName);
        const content = await generateAiText(prompt);
        await db.insert(aiOutputsTable).values({ videoId, userId, type, content });
      } catch (err: any) {
        console.warn(`[autoAnalyze] ${type} failed for video ${videoId}: ${err.message}`);
      }
    }),
  );
}
