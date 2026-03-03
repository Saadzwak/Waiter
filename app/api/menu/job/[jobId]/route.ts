import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("ingestion_jobs")
    .select("id, status, error_message, restaurant_id")
    .eq("id", jobId)
    .single();

  if (error || !job) return new Response("Not found", { status: 404 });

  // Verify ownership
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id")
    .eq("id", job.restaurant_id)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) return new Response("Forbidden", { status: 403 });

  return Response.json({
    status: job.status,
    error_message: job.error_message ?? null,
  });
}
