import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestMenu } from "@/modules/menu/parser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { restaurantId, fileUrl, fileType } = await req.json();

  const adminClient = createAdminClient();

  // Verify the user owns this restaurant
  const { data: restaurant } = await adminClient
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: job, error } = await adminClient
    .from("ingestion_jobs")
    .insert({
      restaurant_id: restaurantId,
      file_url: fileUrl,
      file_type: fileType,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return new Response("Failed to create ingestion job", { status: 500 });
  }

  // Run ingestion in the background — do not await
  ingestMenu(job.id, restaurantId, fileUrl, fileType).catch(console.error);

  return Response.json({ jobId: job.id });
}
