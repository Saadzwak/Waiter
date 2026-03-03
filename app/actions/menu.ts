"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MenuActionState = { error?: string };

// ─── Categories ─────────────────────────────────────────────────────────────

export async function createCategory(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const restaurant_id = formData.get("restaurant_id") as string;
  const name = (formData.get("name") as string).trim();

  const { data: existing } = await supabase
    .from("menu_categories")
    .select("position")
    .eq("restaurant_id", restaurant_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = existing ? existing.position + 1 : 0;

  const { error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id, name, position });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}

export async function updateCategory(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();

  const { error } = await supabase
    .from("menu_categories")
    .update({ name })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}

export async function deleteCategory(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}

export async function reorderCategories(
  restaurantId: string,
  orderedIds: string[]
): Promise<MenuActionState> {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, position) =>
      supabase
        .from("menu_categories")
        .update({ position })
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
    )
  );
  revalidatePath("/dashboard/menu");
  return {};
}

// ─── Items ───────────────────────────────────────────────────────────────────

export async function createItem(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const restaurant_id = formData.get("restaurant_id") as string;
  const category_id = (formData.get("category_id") as string) || null;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const priceRaw = formData.get("price") as string;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const currency = (formData.get("currency") as string) || "EUR";
  const tags = formData.getAll("tags") as string[];
  const allergens = formData.getAll("allergens") as string[];
  const pairing_suggestions = (formData.get("pairing_suggestions") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.from("menu_items").insert({
    restaurant_id,
    category_id,
    name,
    description,
    price,
    currency,
    tags,
    allergens,
    pairing_suggestions,
    available: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}

export async function updateItem(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const priceRaw = formData.get("price") as string;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const currency = (formData.get("currency") as string) || "EUR";
  const tags = formData.getAll("tags") as string[];
  const allergens = formData.getAll("allergens") as string[];
  const pairing_suggestions = (formData.get("pairing_suggestions") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Fetch current name/description to detect changes that require re-embedding
  const { data: current } = await supabase
    .from("menu_items")
    .select("name, description")
    .eq("id", id)
    .single();

  const needsReembed =
    current &&
    (current.name !== name || current.description !== description);

  const chef_notes = (formData.get("chef_notes") as string).trim() || null;

  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      description,
      price,
      currency,
      tags,
      allergens,
      pairing_suggestions,
      chef_notes,
      // Null out embedding if text changed — will be regenerated on next ingest
      ...(needsReembed ? { embedding: null } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}

export async function deleteItem(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}

export async function toggleItemAvailability(
  itemId: string,
  available: boolean
): Promise<MenuActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  return {};
}
