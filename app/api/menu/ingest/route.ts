import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestMenu } from "@/modules/menu/parser";

type IngestBody = {
  restaurantId: string;
  fileUrl: string;
  fileType: "pdf" | "image";
};

function parseBody(raw: unknown): IngestBody | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const restaurantId = body.restaurantId;
  const fileUrl = body.fileUrl;
  const fileType = body.fileType;
  if (typeof restaurantId !== "string" || !restaurantId) return null;
  if (typeof fileUrl !== "string" || !fileUrl.startsWith("http")) return null;
  if (fileType !== "pdf" && fileType !== "image") return null;
  return { restaurantId, fileUrl, fileType };
}

/**
 * The public URL of an uploaded menu file looks like
 *   https://<project>.supabase.co/storage/v1/object/public/menu-uploads/<path>
 * We parse the `<path>` part so we can delete the file on ingestion failure.
 */
function extractStoragePath(url: string): string | null {
  const marker = "/storage/v1/object/public/menu-uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length).split("?")[0];
  return rest || null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const body = parseBody(raw);
  if (!body) {
    return new Response("Invalid ingest payload", { status: 400 });
  }

  const adminClient = createAdminClient();

  // Verify the user owns this restaurant
  const { data: restaurant } = await adminClient
    .from("restaurants")
    .select("id")
    .eq("id", body.restaurantId)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: job, error } = await adminClient
    .from("ingestion_jobs")
    .insert({
      restaurant_id: body.restaurantId,
      file_url: body.fileUrl,
      file_type: body.fileType,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return new Response("Failed to create ingestion job", { status: 500 });
  }

  const jobId = job.id;
  const storagePath = extractStoragePath(body.fileUrl);

  // Run ingestion in the background — do not await
  ingestMenu(jobId, body.restaurantId, body.fileUrl, body.fileType).catch(
    async (err) => {
      console.error("[ingest] background job failed", err);
      // Best-effort cleanup: remove the source file from Storage so the
      // bucket doesn't accumulate orphans across retries.
      if (storagePath) {
        const { error: rmError } = await adminClient.storage
          .from("menu-uploads")
          .remove([storagePath]);
        if (rmError) console.error("[ingest] storage cleanup failed", rmError);
      }
    }
  );

  return Response.json({ jobId });
}
