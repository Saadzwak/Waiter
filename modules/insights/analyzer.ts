import { openai } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";

type InsightAnalysis = {
  summary: string;
  languages: Array<{ code: string; name: string; count: number; pct: number }>;
  top_items: Array<{ name: string; count: number }>;
  dietary_signals: Array<{ signal: string; count: number }>;
  peak_hours: Array<{ hour: number; count: number }>;
  gaps: string[];
  recommendations: string[];
};

export async function generateInsights(restaurantId: string, date: Date): Promise<void> {
  const supabase = createAdminClient();

  const since = new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from("events")
    .select("properties, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("event", "message_sent")
    .gte("created_at", since);

  if (!events || events.length < 5) return;

  // Only process enriched events (new format — has userQuery from updated chat route)
  const enrichedEvents = events.filter((e) => {
    const props = e.properties as Record<string, unknown>;
    return props.userQuery !== undefined;
  });
  if (enrichedEvents.length < 5) return;

  // Pre-aggregate to avoid sending raw event rows to GPT
  const langCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  const itemCounts: Record<string, number> = {};
  const queries: string[] = [];
  let lowSimilarityCount = 0;

  for (const e of enrichedEvents) {
    const props = e.properties as Record<string, unknown>;

    const lang = props.userLanguage as string | undefined;
    if (lang) langCounts[lang] = (langCounts[lang] ?? 0) + 1;

    const hour = props.hour as number | undefined;
    if (hour !== undefined) hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;

    const matchedItems = props.matchedItems as Array<{ name: string; similarity: number }> | undefined;
    if (matchedItems) {
      for (const item of matchedItems) {
        itemCounts[item.name] = (itemCounts[item.name] ?? 0) + 1;
      }
    }

    const query = props.userQuery as string | undefined;
    if (query && queries.length < 200) queries.push(query);

    const topSim = props.topSimilarity as number | undefined;
    if (topSim !== undefined && topSim < 0.3) lowSimilarityCount++;
  }

  const totalLang = Object.values(langCounts).reduce((a, b) => a + b, 0);

  const aggregated = {
    event_count: enrichedEvents.length,
    languages: Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({
        code,
        count,
        pct: totalLang > 0 ? Math.round((count / totalLang) * 100) : 0,
      })),
    hourly_distribution: Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour),
    top_items: Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count })),
    sample_queries: queries.slice(0, 200),
    low_similarity_pct:
      events.length > 0 ? Math.round((lowSimilarityCount / events.length) * 100) : 0,
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a data analyst for a restaurant. Analyze this behavioral data from customer interactions and return a JSON object with exactly these keys: summary, languages, top_items, dietary_signals, peak_hours, gaps, recommendations.

Be specific and actionable. Focus on patterns useful for the restaurant owner.

- summary: narrative overview (2-3 sentences)
- languages: array of { code, name, count, pct } — add full language name based on code
- top_items: array of { name, count } — most queried items
- dietary_signals: array of { signal, count } — dietary preferences inferred from sample_queries (e.g. vegan, spicy, gluten-free, halal)
- peak_hours: array of { hour, count } — busiest hours (24h format)
- gaps: array of strings — things customers ask about that may not be well-served by the current menu
- recommendations: array of strings — specific, actionable suggestions for the restaurant owner`,
      },
      {
        role: "user",
        content: JSON.stringify(aggregated),
      },
    ],
    max_tokens: 1500,
  });

  const analysis = JSON.parse(
    response.choices[0].message.content ?? "{}"
  ) as InsightAnalysis;

  const analysisDate = date.toISOString().slice(0, 10);

  await supabase.from("insights").upsert(
    {
      restaurant_id: restaurantId,
      analysis_date: analysisDate,
      period: "daily",
      event_count: enrichedEvents.length,
      analysis,
    },
    { onConflict: "restaurant_id,analysis_date,period" }
  );
}
