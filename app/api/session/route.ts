import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEvent } from "@/modules/events/tracker";

export async function POST(req: NextRequest) {
  const { restaurantId } = await req.json();

  const supabase = createAdminClient();
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
