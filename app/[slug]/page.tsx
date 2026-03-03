import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/modules/restaurants/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatInterface } from "./ChatInterface";
import type { MenuCategory, MenuItem } from "@/types";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const supabase = createAdminClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, position, restaurant_id, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("position"),
    supabase
      .from("menu_items")
      .select(
        "id, restaurant_id, category_id, name, description, price, currency, tags, allergens, pairing_suggestions, image_url, available, created_at"
      )
      .eq("restaurant_id", restaurant.id)
      .eq("available", true)
      .order("name"),
  ]);

  return (
    <ChatInterface
      restaurant={restaurant}
      categories={(categories ?? []) as MenuCategory[]}
      items={(items ?? []) as MenuItem[]}
    />
  );
}
