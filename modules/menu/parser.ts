import { openai, MODELS } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedMenuItem } from "@/modules/menu/embeddings";
import { generateMealCombinations } from "@/modules/menu/combinations";
import {
  cropAndSaveDishImage,
  fetchImageBuffer,
  type NormalizedBBox,
} from "@/modules/menu/images";
import { PDFParse } from "pdf-parse";

type ParsedItem = {
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  tags: string[];
  allergens: string[];
  pairing_suggestions: string[];
  photo_bbox?: NormalizedBBox | null;
};

type ParsedCategory = {
  name: string;
  position: number;
  items: ParsedItem[];
};

type ParsedMenu = {
  categories: ParsedCategory[];
};

const TEXT_EXTRACTION_PROMPT = `Extract the complete menu from this restaurant document and return a JSON object with this exact structure:
{
  "categories": [
    {
      "name": "category name",
      "position": 0,
      "items": [
        {
          "name": "dish name",
          "description": "description or null",
          "price": 12.50,
          "currency": "EUR",
          "tags": ["vegan", "vegetarian", "gluten-free", "spicy", "halal", "kosher", "dairy-free", "seafood", "nuts", "popular"],
          "allergens": ["gluten", "dairy", "nuts", "eggs", "soy", "fish", "shellfish"],
          "pairing_suggestions": ["Bordeaux", "sparkling water"]
        }
      ]
    }
  ]
}

Rules:
- Only include tags and allergens that are clearly present or implied
- Keep descriptions concise (1-2 sentences max)
- Extract ALL items visible in the menu
- Default currency to EUR if not specified
- Set price to null if not listed`;

// For images we additionally ask the model to return a normalized bounding
// box for dishes that have an associated photo in the image. Coordinates
// are expressed as fractions of the image (top-left origin, values in [0,1]).
const IMAGE_EXTRACTION_PROMPT = `${TEXT_EXTRACTION_PROMPT}

Additionally, for EACH item, if and ONLY if there is a clearly visible photograph of that dish somewhere in this image, also return:

  "photo_bbox": { "x": 0.12, "y": 0.08, "width": 0.34, "height": 0.22 }

- All four values MUST be numbers between 0 and 1 representing a fraction of the full image (top-left origin).
- The box should tightly frame JUST the photo of the dish itself — not its name, price, or decorative text.
- If the dish has no associated photograph, set "photo_bbox" to null.
- Never invent a bounding box. Only include one when you can actually see the dish's photo.`;

async function extractMenuFromText(text: string): Promise<ParsedMenu> {
  const response = await openai.chat.completions.create({
    model: MODELS.chat,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `${TEXT_EXTRACTION_PROMPT}\n\nMENU TEXT:\n${text.slice(0, 12000)}`,
      },
    ],
    max_tokens: 4000,
  });
  return JSON.parse(response.choices[0].message.content ?? "{}") as ParsedMenu;
}

async function extractMenuFromImage(imageUrl: string): Promise<ParsedMenu> {
  const response = await openai.chat.completions.create({
    model: MODELS.vision,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
          { type: "text", text: IMAGE_EXTRACTION_PROMPT },
        ],
      },
    ],
    max_tokens: 4000,
  });
  return JSON.parse(response.choices[0].message.content ?? "{}") as ParsedMenu;
}

type SavedItemRef = {
  id: string;
  photoBBox: NormalizedBBox | null;
};

async function saveMenu(
  restaurantId: string,
  menu: ParsedMenu
): Promise<SavedItemRef[]> {
  const supabase = createAdminClient();
  const saved: SavedItemRef[] = [];

  for (const category of menu.categories) {
    const { data: catData, error: catError } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurantId,
        name: category.name,
        position: category.position,
      })
      .select("id")
      .single();

    if (catError) throw catError;

    for (const item of category.items) {
      const { data: itemData, error: itemError } = await supabase
        .from("menu_items")
        .insert({
          restaurant_id: restaurantId,
          category_id: catData.id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency || "EUR",
          tags: item.tags || [],
          allergens: item.allergens || [],
          pairing_suggestions: item.pairing_suggestions || [],
        })
        .select("id, name, description, tags, allergens, pairing_suggestions")
        .single();

      if (itemError) throw itemError;

      await embedMenuItem({
        id: itemData.id,
        name: itemData.name,
        description: itemData.description,
        tags: itemData.tags,
        allergens: itemData.allergens,
        pairing_suggestions: itemData.pairing_suggestions,
      });

      saved.push({
        id: itemData.id,
        photoBBox: item.photo_bbox ?? null,
      });
    }
  }

  return saved;
}

/**
 * For each item that came with a photo_bbox, crop that region from the
 * source menu image and store it as the item's image_url. Any individual
 * failure is logged but never propagated — dish-image extraction is
 * strictly best-effort.
 */
async function extractAndSaveDishPhotos(
  restaurantId: string,
  sourceImageUrl: string,
  saved: SavedItemRef[]
): Promise<void> {
  const withPhotos = saved.filter((s) => s.photoBBox);
  if (withPhotos.length === 0) return;

  let sourceBuffer: Buffer;
  try {
    sourceBuffer = await fetchImageBuffer(sourceImageUrl);
  } catch (err) {
    console.error("[ingest] failed to fetch source image for cropping", err);
    return;
  }

  const supabase = createAdminClient();

  // Run crops in parallel but cap concurrency at 3 to keep memory predictable.
  const queue = [...withPhotos];
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next || !next.photoBBox) continue;
      const publicUrl = await cropAndSaveDishImage({
        restaurantId,
        itemId: next.id,
        sourceBuffer,
        bbox: next.photoBBox,
      });
      if (publicUrl) {
        const { error } = await supabase
          .from("menu_items")
          .update({ image_url: publicUrl })
          .eq("id", next.id);
        if (error) console.error("[ingest] image_url update failed", error);
      }
    }
  });
  await Promise.all(workers);
}

export async function ingestMenu(
  jobId: string,
  restaurantId: string,
  fileUrl: string,
  fileType: "pdf" | "image"
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("ingestion_jobs")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    let menu: ParsedMenu;

    if (fileType === "pdf") {
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      menu = await extractMenuFromText(result.text);
    } else {
      menu = await extractMenuFromImage(fileUrl);
    }

    const saved = await saveMenu(restaurantId, menu);

    // Dish-image extraction — image menus only. Non-blocking: any failure
    // is swallowed so the ingestion stays "done" even if no photos land.
    if (fileType === "image") {
      try {
        await extractAndSaveDishPhotos(restaurantId, fileUrl, saved);
      } catch (err) {
        console.error("[ingest] dish photo extraction failed", err);
      }
    }

    // Generate meal combinations in background — failure must not fail the
    // ingestion. Fire-and-forget with console logging.
    Promise.resolve(
      supabase
        .from("menu_items")
        .select("id, name, tags")
        .eq("restaurant_id", restaurantId)
    )
      .then(({ data: savedItems }) => {
        if (savedItems && savedItems.length >= 3) {
          return generateMealCombinations(
            restaurantId,
            savedItems.map((i) => ({
              id: i.id,
              name: i.name,
              category: null,
              tags: (i.tags as string[]) ?? [],
            }))
          );
        }
      })
      .catch(console.error);

    await supabase
      .from("ingestion_jobs")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    throw err;
  }
}
