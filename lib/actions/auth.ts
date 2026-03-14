"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
    signOut?: () => Promise<{ error: Error | null }>;
  };
}

export async function logout(): Promise<never> {
  const client = await createSupabaseServerClient();
  const supabase: AuthClient = client;
  if (!supabase.auth.signOut) {
    throw new Error("signOut not available");
  }
  await supabase.auth.signOut();
  return redirect("/login");
}