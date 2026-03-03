import { createAdminClient } from "@/lib/supabase/admin";
import type { Restaurant } from "@/types";

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}
