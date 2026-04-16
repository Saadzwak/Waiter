import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

const DISH_IMAGES_BUCKET = "dish-images";

// Normalized bounding box as returned by GPT-4o Vision — every value in [0, 1].
export type NormalizedBBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function sanitizeBBox(bbox: NormalizedBBox): NormalizedBBox | null {
  const x = clamp01(bbox.x);
  const y = clamp01(bbox.y);
  const w = clamp01(bbox.width);
  const h = clamp01(bbox.height);
  if (w < 0.04 || h < 0.04) return null; // too small to be a dish photo
  if (x + w > 1.001 || y + h > 1.001) {
    // allow tiny overflow due to rounding; clip instead of rejecting
    return { x, y, width: Math.min(w, 1 - x), height: Math.min(h, 1 - y) };
  }
  return { x, y, width: w, height: h };
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch source image: ${res.status} ${res.statusText}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

/**
 * Crop the source image to the normalized bbox and return a WebP-encoded
 * buffer. Keeps dimensions reasonable (max 800px on the long edge) so that
 * customer mobile devices load fast.
 */
async function cropToWebp(source: Buffer, bbox: NormalizedBBox): Promise<Buffer> {
  const img = sharp(source, { failOn: "none" });
  const meta = await img.metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (srcW === 0 || srcH === 0) {
    throw new Error("Invalid source image dimensions");
  }

  const left = Math.max(0, Math.round(bbox.x * srcW));
  const top = Math.max(0, Math.round(bbox.y * srcH));
  const width = Math.max(1, Math.min(srcW - left, Math.round(bbox.width * srcW)));
  const height = Math.max(1, Math.min(srcH - top, Math.round(bbox.height * srcH)));

  return await sharp(source, { failOn: "none" })
    .extract({ left, top, width, height })
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

/**
 * Upload a cropped dish image to the `dish-images` bucket and return its
 * public URL. Path is namespaced by restaurant so policies stay simple.
 */
async function uploadDishImage(
  restaurantId: string,
  itemId: string,
  buffer: Buffer
): Promise<string> {
  const supabase = createAdminClient();
  const path = `${restaurantId}/${itemId}-${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from(DISH_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) throw new Error(`Dish image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(DISH_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Full pipeline: crop one dish region from the source menu image, upload
 * it, and return the public URL. Returns null on any non-fatal failure
 * (we never want dish-image extraction to break the whole ingestion).
 */
export async function cropAndSaveDishImage(args: {
  restaurantId: string;
  itemId: string;
  sourceBuffer: Buffer;
  bbox: NormalizedBBox;
}): Promise<string | null> {
  const clean = sanitizeBBox(args.bbox);
  if (!clean) return null;

  try {
    const cropped = await cropToWebp(args.sourceBuffer, clean);
    return await uploadDishImage(args.restaurantId, args.itemId, cropped);
  } catch (err) {
    console.error("[dish-images] crop failed", err);
    return null;
  }
}

export { fetchImageBuffer };
