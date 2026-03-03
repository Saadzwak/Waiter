"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = { error?: string };

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication failed." };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  redirect(restaurant ? "/dashboard" : "/dashboard/onboarding");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  redirect("/dashboard/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
