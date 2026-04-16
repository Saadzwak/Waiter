import { openai } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";

type ComboItem = {
  id: string;
  name: string;
  category: string | null;
  tags: string[];
};

type GPTCombo = {
  name: string;
  description: string;
  items: string[];
};

function normalize(s: string): string {
  // Lowercase, strip diacritics, collapse whitespace. Keeps the comparison
  // resilient to minor transcription differences ("bœuf" ↔ "boeuf").
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match a candidate name from GPT against our canonical menu items.
 *
 * Strategy, in order:
 *   1. Exact normalized match.
 *   2. Candidate is a full-word prefix/suffix of a canonical name
 *      (e.g. GPT returns "Bourguignon" → match "Bœuf Bourguignon").
 *   3. Otherwise: no match. We deliberately do NOT do generic substring
 *      matching — it caused false positives like "Pasta" matching four
 *      different pasta dishes in the same combo.
 */
function findItemId(
  candidate: string,
  lookup: Map<string, { id: string; name: string }>
): { id: string; name: string } | null {
  const norm = normalize(candidate);
  if (!norm) return null;

  const exact = lookup.get(norm);
  if (exact) return exact;

  // Word-boundary prefix/suffix match: only accept if the candidate is a
  // full word (or sequence of words) of the canonical name.
  for (const [key, value] of lookup) {
    const words = key.split(" ");
    const candWords = norm.split(" ");
    if (candWords.length > words.length) continue;
    if (
      words.slice(0, candWords.length).join(" ") === norm ||
      words.slice(-candWords.length).join(" ") === norm
    ) {
      return value;
    }
  }

  return null;
}

export async function generateMealCombinations(
  restaurantId: string,
  items: ComboItem[]
): Promise<void> {
  if (items.length < 3) return;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a chef and sommelier. Given this restaurant menu, propose 5–8 memorable meal combinations (starter + main + drink, or main + dessert + wine, etc.). Each combo should make culinary sense and tell a story.

For each combination: { name: string, description: string (1 sentence, enticing), items: string[] (2–4 item names exactly as they appear in the menu) }

Return a JSON object with a "combinations" array.`,
      },
      {
        role: "user",
        content: JSON.stringify(
          items.map((i) => ({ name: i.name, category: i.category, tags: i.tags }))
        ),
      },
    ],
    max_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0].message.content ?? "{}") as {
    combinations?: GPTCombo[];
  };
  const combos = parsed.combinations ?? [];

  // Build a normalized lookup once.
  const lookup = new Map<string, { id: string; name: string }>();
  for (const item of items) {
    lookup.set(normalize(item.name), { id: item.id, name: item.name });
  }

  const supabase = createAdminClient();

  for (const combo of combos.slice(0, 8)) {
    const itemIds: string[] = [];
    const itemNames: string[] = [];
    const seen = new Set<string>();

    for (const name of combo.items) {
      const match = findItemId(name, lookup);
      if (!match) continue;
      if (seen.has(match.id)) continue; // avoid double-counting same dish
      seen.add(match.id);
      itemIds.push(match.id);
      itemNames.push(match.name);
    }

    if (itemIds.length >= 2) {
      await supabase.from("meal_combinations").insert({
        restaurant_id: restaurantId,
        name: combo.name,
        description: combo.description,
        item_ids: itemIds,
        item_names: itemNames,
        validated: false,
      });
    }
  }
}
