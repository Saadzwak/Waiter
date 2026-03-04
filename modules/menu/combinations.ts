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

  // Build name→id lookup (lowercase for fuzzy matching)
  const nameToId: Record<string, string> = {};
  const nameToOriginal: Record<string, string> = {};
  for (const item of items) {
    const key = item.name.toLowerCase();
    nameToId[key] = item.id;
    nameToOriginal[key] = item.name;
  }

  const supabase = createAdminClient();

  for (const combo of combos.slice(0, 8)) {
    const itemIds: string[] = [];
    const itemNames: string[] = [];

    for (const name of combo.items) {
      const lower = name.toLowerCase();
      // Exact match
      if (nameToId[lower]) {
        itemIds.push(nameToId[lower]);
        itemNames.push(nameToOriginal[lower]);
        continue;
      }
      // Partial match
      const key = Object.keys(nameToId).find(
        (k) => k.includes(lower) || lower.includes(k)
      );
      if (key) {
        itemIds.push(nameToId[key]);
        itemNames.push(nameToOriginal[key]);
      }
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
