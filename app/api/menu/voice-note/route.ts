import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRestaurantByOwner, getMenuWithCategories } from "@/modules/dashboard/queries";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restaurant = await getRestaurantByOwner(user.id);
  if (!restaurant) return NextResponse.json({ error: "No restaurant found" }, { status: 404 });

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;
  const itemId = formData.get("item_id") as string | null;
  const itemName = formData.get("item_name") as string | null;

  if (!audio) return NextResponse.json({ error: "No audio file" }, { status: 400 });

  // Transcribe with Whisper-1
  // Include dish name in prompt when known — dramatically improves accuracy for culinary terms
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audio,
    prompt: itemName
      ? `Chef describing the dish "${itemName}": ingredients, preparation method, culinary techniques.`
      : "Chef describing a restaurant dish: dish name, ingredients, cooking technique, culinary terminology.",
  });
  const transcript = transcription.text.trim();

  const admin = createAdminClient();

  // ── Mode 1: item_id known → direct save, no GPT needed ──────────────────────
  if (itemId) {
    const { error: dbError } = await admin
      .from("menu_items")
      .update({ chef_notes: transcript })
      .eq("id", itemId)
      .eq("restaurant_id", restaurant.id);

    if (dbError) return NextResponse.json({ error: "Failed to save notes." }, { status: 500 });

    return NextResponse.json({
      success: true,
      transcript,
      item_id: itemId,
      item_name: itemName,
      notes: transcript,
    });
  }

  // ── Mode 2: no item_id → GPT identifies the dish ────────────────────────────
  const { items } = await getMenuWithCategories(restaurant.id);
  if (items.length === 0) {
    return NextResponse.json({ error: "No menu items found. Add dishes first." }, { status: 400 });
  }

  const itemList = items.map((i) => `${i.id} | ${i.name}`).join("\n");

  const parseRes = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a kitchen assistant extracting chef notes from voice transcriptions.
Given a chef's voice note and a list of menu items (id | name), identify which dish the chef is talking about and extract their description as clean, professional chef notes.
The chef may say the dish name at the start then describe it. Match even if the name is approximate (e.g. "le boeuf" → "Bœuf Bourguignon").
Respond ONLY with valid JSON: { "item_id": "<uuid>", "item_name": "<matched name>", "notes": "<extracted notes, clean and complete>" }
If you cannot confidently match any dish, return: { "item_id": null, "item_name": null, "notes": "" }`,
      },
      {
        role: "user",
        content: `Transcription: "${transcript}"\n\nMenu items:\n${itemList}`,
      },
    ],
  });

  const parsed = JSON.parse(parseRes.choices[0].message.content ?? "{}") as {
    item_id: string | null;
    item_name: string | null;
    notes: string;
  };

  if (!parsed.item_id) {
    return NextResponse.json({
      transcript,
      success: false,
      error: "Could not identify which dish this note is about. Say the dish name clearly at the start.",
    });
  }

  const { error: dbError } = await admin
    .from("menu_items")
    .update({ chef_notes: parsed.notes })
    .eq("id", parsed.item_id)
    .eq("restaurant_id", restaurant.id);

  if (dbError) return NextResponse.json({ error: "Failed to save notes." }, { status: 500 });

  return NextResponse.json({
    success: true,
    transcript,
    item_id: parsed.item_id,
    item_name: parsed.item_name,
    notes: parsed.notes,
  });
}
