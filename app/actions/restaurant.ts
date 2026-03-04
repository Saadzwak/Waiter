"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Restaurant } from "@/types";

export type RestaurantActionState = { error?: string; restaurant?: Restaurant };

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export async function createRestaurant(
  _prev: RestaurantActionState,
  formData: FormData
): Promise<RestaurantActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const name = (formData.get("name") as string).trim();
  const language_default = (formData.get("language_default") as string) || "en";

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug(name);
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ owner_id: user.id, slug, name, language_default })
      .select()
      .single();

    if (!error && data) {
      const cookieStore = await cookies();
      cookieStore.set("selected_restaurant", data.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
      revalidatePath("/dashboard");
      return { restaurant: data as Restaurant };
    }

    if (error && !error.code?.includes("23505")) {
      return { error: error.message };
    }
  }

  return { error: "Could not generate a unique URL. Try a slightly different name." };
}

export async function updateRestaurant(
  _prev: RestaurantActionState,
  formData: FormData
): Promise<RestaurantActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const restaurant_id = formData.get("restaurant_id") as string | null;
  const updates: Record<string, string | null> = {};
  const name = formData.get("name") as string | null;
  const description = formData.get("description") as string | null;
  const language_default = formData.get("language_default") as string | null;
  const logo_url = formData.get("logo_url") as string | null;

  if (name !== null) updates.name = name.trim();
  if (description !== null) updates.description = description.trim() || null;
  if (language_default !== null) updates.language_default = language_default;
  if (logo_url !== null) updates.logo_url = logo_url;

  let query = supabase
    .from("restaurants")
    .update(updates)
    .eq("owner_id", user.id);

  if (restaurant_id) {
    query = query.eq("id", restaurant_id);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return {};
}

export async function switchRestaurant(id: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("selected_restaurant", id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
