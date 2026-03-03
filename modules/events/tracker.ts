import { createAdminClient } from "@/lib/supabase/admin";
import type { TrackEvent } from "@/types";

export async function trackEvent(data: TrackEvent): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("events").insert({
    event: data.event,
    restaurant_id: data.restaurant_id,
    session_id: data.session_id,
    properties: data.properties ?? null,
  });
}
