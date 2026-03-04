import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantByOwner } from "@/modules/dashboard/queries";
import { generateInsights } from "@/modules/insights/analyzer";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const restaurant = await getRestaurantByOwner(user.id);
  if (!restaurant) return new Response("Restaurant not found", { status: 404 });

  await generateInsights(restaurant.id, new Date());

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
