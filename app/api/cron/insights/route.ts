import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInsights } from "@/modules/insights/analyzer";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: restaurants } = await supabase.from("restaurants").select("id");

  const results = await Promise.allSettled(
    (restaurants ?? []).map((r) => generateInsights(r.id, new Date()))
  );

  const failures = results.filter((r) => r.status === "rejected").length;

  return new Response(
    JSON.stringify({ processed: restaurants?.length ?? 0, failures }),
    { headers: { "Content-Type": "application/json" } }
  );
}
