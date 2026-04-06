import OpenAI from "openai";

/* ══════════════════════════════════════════
   Shared AI text generation — Gemini first,
   then Replit proxy, then user's OpenAI key.
══════════════════════════════════════════ */

/* Models in priority order — 2.5 series has separate free-tier quotas */
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",   /* fastest, highest free-tier limits */
  "gemini-2.5-flash",        /* more capable, good free-tier limits */
  "gemini-2.0-flash-lite",   /* fallback if 2.5 quota exhausted */
  "gemini-2.0-flash",        /* original, exhausted on busy days */
  "gemini-2.0-flash-001",    /* versioned alias — separate quota bucket */
];

async function tryGemini(prompt: string, key: string): Promise<string | null> {
  for (const model of GEMINI_MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 3000, temperature: 0.75 },
          }),
        },
      );

      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errBody = (await resp.json()) as { error?: { message?: string; status?: string } };
          errMsg = errBody?.error?.message || errMsg;
          /* Quota/billing errors — no point retrying other models */
          if (errBody?.error?.status === "RESOURCE_EXHAUSTED" || resp.status === 429) {
            console.warn(`[Gemini] Quota exhausted for model ${model}: ${errMsg}`);
            return null;
          }
        } catch { /* ignore parse error */ }
        console.warn(`[Gemini] ${model} failed: ${errMsg}`);
        continue; /* try next model */
      }

      const data = (await resp.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
        promptFeedback?: { blockReason?: string };
      };

      /* Handle blocked prompts */
      if (data.promptFeedback?.blockReason) {
        console.warn(`[Gemini] Prompt blocked (${data.promptFeedback.blockReason})`);
        return null;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.info(`[Gemini] Success with model ${model}`);
        return text.trim();
      }

      console.warn(`[Gemini] ${model} returned empty content`);
    } catch (err: any) {
      console.warn(`[Gemini] ${model} threw: ${err.message}`);
    }
  }
  return null;
}

export async function generateAiText(prompt: string): Promise<string> {
  /* 1️⃣  Google Gemini — preferred when GOOGLE_API_KEY is set */
  const googleKey = process.env.GOOGLE_API_KEY;
  if (googleKey) {
    const text = await tryGemini(prompt, googleKey);
    if (text) return text;
    console.warn("[AI] All Gemini models failed — trying fallback providers");
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
        max_completion_tokens: 2048,
      });
      const text = completion.choices[0]?.message?.content;
      if (text) {
        console.info("[AI] Success via Replit Integration proxy");
        return text.trim();
      }
    } catch (err: any) {
      console.warn(`[AI] Replit proxy failed: ${err.message}`);
    }
  }

  /* 3️⃣  User-supplied OpenAI key */
  const ownKey = process.env.OPENAI_API_KEY;
  if (ownKey) {
    try {
      const openai = new OpenAI({ apiKey: ownKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });
      const text = completion.choices[0]?.message?.content;
      if (text) {
        console.info("[AI] Success via user OpenAI key");
        return text.trim();
      }
    } catch (err: any) {
      console.warn(`[AI] OpenAI failed: ${err.message}`);
    }
  }

  const configuredKeys = [
    googleKey && "GOOGLE_API_KEY",
    integrationBase && "AI_INTEGRATIONS_OPENAI",
    ownKey && "OPENAI_API_KEY",
  ].filter(Boolean).join(", ") || "none";

  throw new Error(
    `AI generation failed. Configured providers: ${configuredKeys}. Check server logs for details.`,
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

/* Auto-analysis: generate summary + key_insights in parallel */
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
