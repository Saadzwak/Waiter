import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEvent } from "@/modules/events/tracker";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { restaurantId } = (body ?? {}) as { restaurantId?: string };

  if (typeof restaurantId !== "string" || !UUID_RE.test(restaurantId)) {
    return new Response("Invalid restaurantId", { status: 400 });
  }

  const supabase = createAdminClient();

  // Make sure the restaurant actually exists before creating a session.
  // Cheaper than letting the FK fail with a generic 500.
  const { data: restaurant, error: lookupError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (lookupError) {
    return new Response("Restaurant lookup failed", { status: 500 });
  }
  if (!restaurant) {
    return new Response("Restaurant not found", { status: 404 });
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ restaurant_id: restaurantId })
    .select("id")
    .single();

  if (error) {
    return new Response("Failed to create session", { status: 500 });
  }

  trackEvent({
    event: "session_started",
    restaurant_id: restaurantId,
    session_id: data.id,
  }).catch(console.error);

  return Response.json({ sessionId: data.id });
}
