import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { openai as aiSdkOpenai } from "@ai-sdk/openai";
import OpenAI from "openai";
import { z } from "zod";
import { generateEmbedding } from "@/modules/menu/embeddings";
import { buildSystemPrompt } from "@/modules/chat/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UIMessage, TextUIPart } from "ai";

const openaiClient = new OpenAI();

type MatchedItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  tags: string[];
  allergens: string[];
  pairing_suggestions: string[];
  chef_notes: string | null;
  similarity: number;
};

const SIMILARITY_THRESHOLD = 0.3;

async function detectLanguageAndTranslate(
  userText: string,
  menuLanguage: string
): Promise<{ userLanguage: string; queryForEmbedding: string }> {
  const res = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: `You are a language detection and translation assistant. Given a user message, return a JSON object with exactly two fields:
- "userLanguage": the BCP-47 language code of the user's message (e.g. "en", "fr", "ar", "es", "de", "it", "pt", "zh", "ja", "ru", "nl", "ko")
- "queryForEmbedding": the user's message translated to ${menuLanguage}, keeping only the core food/menu semantic content. Strip filler words, keep the intent. If the message is already in ${menuLanguage}, return it unchanged.`,
      },
      { role: "user", content: userText },
    ],
  });

  try {
    const parsed = JSON.parse(res.choices[0].message.content ?? "{}") as {
      userLanguage?: string;
      queryForEmbedding?: string;
    };
    return {
      userLanguage: parsed.userLanguage ?? "en",
      queryForEmbedding: parsed.queryForEmbedding ?? userText,
    };
  } catch {
    return { userLanguage: "en", queryForEmbedding: userText };
  }
}

async function searchRelevantItems(
  restaurantId: string,
  embedding: number[],
  limit = 6
): Promise<MatchedItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_menu_items", {
    query_embedding: embedding,
    match_restaurant_id: restaurantId,
    match_count: limit,
  });
  if (error) throw error;
  return data ?? [];
}

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "Web search is not configured.";

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
      }),
    });

    if (!res.ok) return "Web search failed.";

    const data = await res.json();
    const answer = data.answer as string | undefined;
    const results = (data.results as { title: string; content: string }[] ?? [])
      .slice(0, 3)
      .map((r) => `${r.title}: ${r.content}`)
      .join("\n\n");

    return answer ?? results ?? "No relevant results found.";
  } catch {
    return "Web search failed.";
  }
}

export async function buildChatStream({
  restaurantId,
  restaurantName,
  menuLanguage,
  messages,
}: {
  restaurantId: string;
  restaurantName: string;
  menuLanguage: string;
  messages: UIMessage[];
}) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const lastText =
    lastUserMessage?.parts
      .filter((p): p is TextUIPart => p.type === "text")
      .map((p) => p.text)
      .join(" ") ?? "";

  // Detect user language + translate query to menu language for accurate embedding
  const { userLanguage, queryForEmbedding } = await detectLanguageAndTranslate(
    lastText,
    menuLanguage
  );

  const supabase = createAdminClient();
  const [embedding, { data: unavailableData }] = await Promise.all([
    generateEmbedding(queryForEmbedding),
    supabase
      .from("menu_items")
      .select("name")
      .eq("restaurant_id", restaurantId)
      .eq("available", false),
  ]);

  const allItems = await searchRelevantItems(restaurantId, embedding);
  // Filter out low-confidence matches to prevent hallucination on irrelevant context
  const relevantItems = allItems.filter((item) => item.similarity >= SIMILARITY_THRESHOLD);
  const soldOutItems = unavailableData?.map((i) => i.name) ?? [];

  const systemPrompt = buildSystemPrompt(restaurantName, relevantItems, undefined, userLanguage, soldOutItems);

  const stream = streamText({
    model: aiSdkOpenai("gpt-4o"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 600,
    stopWhen: stepCountIs(3),
    tools: {
      searchWeb: {
        description:
          "Search the web for culinary information: a dish's history, regional origins, preparation techniques, ingredient details, wine or cocktail pairings, dietary information, etc. Use when the customer asks something not covered by the menu context.",
        inputSchema: z.object({
          query: z.string().describe(
            "Specific search query, e.g. 'history of bouillabaisse Marseille' or 'classic wine pairing for duck confit'"
          ),
        }),
        execute: async (args: { query: string }) => searchWeb(args.query),
      },
    },
  });

  return {
    stream,
    analytics: {
      userLanguage,
      userQuery: lastText,
      matchedItems: relevantItems.map((i) => ({
        id: i.id,
        name: i.name,
        similarity: i.similarity,
      })),
      topSimilarity: relevantItems[0]?.similarity ?? 0,
    },
  };
}
