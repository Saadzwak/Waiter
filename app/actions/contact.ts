"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export type ContactState = { error: string } | { success: true } | null;

export async function submitContact(
  _: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name    = (formData.get("name") as string)?.trim();
  const email   = (formData.get("email") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email) {
    return { error: "Please fill in your name and email." };
  }

  // ── Save to Supabase (service role bypasses RLS) ────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabase
    .from("contact_leads")
    .insert({ name, email, message: message || null });

  if (dbError) {
    console.error("contact_leads insert error:", dbError);
    return { error: "Something went wrong. Please email us at contact@aiwaiter.com" };
  }

  // ── Send email notification via Resend ──────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "AIWaiter <onboarding@resend.dev>",
      to:   "saadzwaki@gmail.com",
      subject: `New contact — ${name}`,
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Message: ${message || "(none)"}`,
        ``,
        `Submitted: ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
      ].join("\n"),
    });
  }

  return { success: true as const };
}
