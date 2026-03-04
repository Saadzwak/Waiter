import { createClient } from "@/lib/supabase/server";
import type { Restaurant, MenuCategory, MenuItem } from "@/types";

export type DashboardStats = {
  totalSessions: number;
  sessions30d: number;
  messages30d: number;
  totalMenuItems: number;
  avgMessagesPerSession: number;
};

export type EventDataPoint = {
  date: string;
  count: number;
};

export type IngestionJob = {
  id: string;
  file_url: string;
  file_type: string;
  status: "pending" | "processing" | "done" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type RecentSession = {
  id: string;
  language_detected: string | null;
  created_at: string;
  message_count: number;
};

export async function getRestaurantByOwner(
  userId: string
): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  return data;
}

export async function getDashboardStats(
  restaurantId: string
): Promise<DashboardStats> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalSessions },
    { count: sessions30d },
    { count: totalMenuItems },
    { data: messages30dData },
  ] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId),
    supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("available", true),
    supabase
      .from("events")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("event", "message_sent")
      .gte("created_at", thirtyDaysAgo),
  ]);

  const messages30d = messages30dData?.length ?? 0;
  const avgMessagesPerSession =
    sessions30d && sessions30d > 0
      ? Math.round(messages30d / sessions30d)
      : 0;

  return {
    totalSessions: totalSessions ?? 0,
    sessions30d: sessions30d ?? 0,
    messages30d,
    totalMenuItems: totalMenuItems ?? 0,
    avgMessagesPerSession,
  };
}

export async function getMenuWithCategories(restaurantId: string): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
}> {
  const supabase = await createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, position, restaurant_id, created_at")
      .eq("restaurant_id", restaurantId)
      .order("position"),
    supabase
      .from("menu_items")
      .select(
        "id, restaurant_id, category_id, name, description, price, currency, tags, allergens, pairing_suggestions, image_url, available, chef_notes, created_at"
      )
      .eq("restaurant_id", restaurantId)
      .order("name"),
  ]);
  return {
    categories: (categories ?? []) as MenuCategory[],
    items: (items ?? []) as MenuItem[],
  };
}

export async function getRecentSessions(
  restaurantId: string,
  limit = 20
): Promise<RecentSession[]> {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, language_detected, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  // Count message_sent events per session (source of truth — chat route tracks here)
  const { data: events } = await supabase
    .from("events")
    .select("session_id")
    .eq("event", "message_sent")
    .in("session_id", sessionIds);

  const countMap: Record<string, number> = {};
  for (const e of events ?? []) {
    if (e.session_id) countMap[e.session_id] = (countMap[e.session_id] ?? 0) + 1;
  }

  return sessions.map((s) => ({
    ...s,
    message_count: countMap[s.id] ?? 0,
  }));
}

export async function getEventTimeSeries(
  restaurantId: string,
  days = 30
): Promise<EventDataPoint[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("events")
    .select("created_at")
    .eq("restaurant_id", restaurantId)
    .eq("event", "message_sent")
    .gte("created_at", since)
    .order("created_at");

  // Group by day client-side (avoids needing a DB function)
  const buckets: Record<string, number> = {};

  // Pre-fill all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }

  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 10);
    if (key in buckets) buckets[key]++;
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export async function getIngestionJobs(
  restaurantId: string
): Promise<IngestionJob[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingestion_jobs")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as IngestionJob[];
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export type InsightAnalysis = {
  summary: string;
  languages: Array<{ code: string; name: string; count: number; pct: number }>;
  top_items: Array<{ name: string; count: number }>;
  dietary_signals: Array<{ signal: string; count: number }>;
  peak_hours: Array<{ hour: number; count: number }>;
  gaps: string[];
  recommendations: string[];
};

export type InsightRow = {
  id: string;
  restaurant_id: string;
  analysis_date: string;
  period: string;
  event_count: number;
  analysis: InsightAnalysis;
  created_at: string;
};

export async function getLatestInsights(
  restaurantId: string
): Promise<InsightRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insights")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("analysis_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as InsightRow | null;
}

export async function getInsightsHistory(
  restaurantId: string,
  limit = 30
): Promise<InsightRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insights")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("analysis_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as InsightRow[];
}

// ─── Meal Combinations ────────────────────────────────────────────────────────

export type MealCombination = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  item_ids: string[];
  item_names: string[];
  validated: boolean;
  created_at: string;
};

export async function getUnvalidatedCombinations(
  restaurantId: string
): Promise<MealCombination[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_combinations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("validated", false)
    .order("created_at", { ascending: false });
  return (data ?? []) as MealCombination[];
}

export async function getAllCombinations(
  restaurantId: string
): Promise<MealCombination[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_combinations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as MealCombination[];
}
