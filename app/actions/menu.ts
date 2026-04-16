"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedMenuItem } from "@/modules/menu/embeddings";
import { revalidatePath } from "next/cache";

export type MenuActionState = { error?: string };

// Fire-and-forget: an embedding failure must never block the UI. The invariant
// is that an item either has a fresh embedding or `embedding = null`, in which
// case it drops out of RAG until re-embedded.
function scheduleReembed(itemId: string): void {
  const admin = createAdminClient();
  // Supabase query builders return a PromiseLike, not a native Promise.
  // Wrap it so .catch() works reliably.
  Promise.resolve(
    admin
      .from("menu_items")
      .select("id, name, description, tags, allergens, pairing_suggestions")
      .eq("id", itemId)
      .single()
  )
    .then(({ data }) => {
      if (!data) return;
      return embedMenuItem({
        id: data.id,
        name: data.name,
        description: data.description,
        tags: data.tags ?? [],
        allergens: data.allergens ?? [],
        pairing_suggestions: data.pairing_suggestions ?? [],
      });
    })
    .catch((err) => console.error("[menu-actions] re-embed failed", err));
}

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
      // Null out embedding if text changed — regenerated just below.
      ...(needsReembed ? { embedding: null } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Keep RAG consistent: when name or description changed, regenerate the
  // embedding right away instead of leaving the row out of search.
  if (needsReembed) scheduleReembed(id);

  revalidatePath("/dashboard/menu");
  return {};
}

export async function updateItemImage(
  _prev: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const raw = (formData.get("image_url") as string | null) ?? "";
  const image_url = raw.trim() === "" ? null : raw.trim();

  const { error } = await supabase
    .from("menu_items")
    .update({ image_url })
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

// ─── Meal Combinations ────────────────────────────────────────────────────────

export async function validateCombination(id: string): Promise<MenuActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_combinations")
    .update({ validated: true })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  revalidatePath("/dashboard/onboarding");
  return {};
}

export async function deleteCombination(id: string): Promise<MenuActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_combinations")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/menu");
  revalidatePath("/dashboard/onboarding");
  return {};
}
