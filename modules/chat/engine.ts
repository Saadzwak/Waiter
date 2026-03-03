import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { generateEmbedding } from "@/modules/menu/embeddings";
import { buildSystemPrompt } from "@/modules/chat/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UIMessage, TextUIPart } from "ai";

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
  messages,
}: {
  restaurantId: string;
  restaurantName: string;
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

  const embedding = await generateEmbedding(lastText);
  const relevantItems = await searchRelevantItems(restaurantId, embedding);
  const systemPrompt = buildSystemPrompt(restaurantName, relevantItems);

  return streamText({
    model: openai("gpt-4o"),
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
}
