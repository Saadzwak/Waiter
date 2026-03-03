import { openai, MODELS } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";

type EmbeddableItem = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  allergens: string[];
  pairing_suggestions: string[];
};

function buildEmbeddingText(item: Omit<EmbeddableItem, "id">): string {
  return [
    item.name,
    item.description,
    item.tags.join(" "),
    item.allergens.join(" "),
    item.pairing_suggestions.join(" "),
  ]
    .filter(Boolean)
    .join(". ");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export async function embedMenuItem(item: EmbeddableItem): Promise<void> {
  const text = buildEmbeddingText(item);
  const embedding = await generateEmbedding(text);
  const supabase = createAdminClient();
  await supabase
    .from("menu_items")
    .update({ embedding })
    .eq("id", item.id);
}
