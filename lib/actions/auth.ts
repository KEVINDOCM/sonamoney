"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAuditEvent, type AuditEventType } from "@/lib/utils/auditLog";

interface AuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
    signOut?: () => Promise<{ error: Error | null }>;
  };
}

/**
 * Helper to log auth events
 */
async function logAuthEvent(
  eventType: AuditEventType,
  userId: string | null = null,
  metadata?: Record<string, string | number | boolean | null>
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType,
    eventStatus: eventType.includes("success") ? "success" : "failure",
    ipAddress: "unknown",
    userAgent: "server-action",
    metadata,
  });
}

export async function logout(): Promise<never> {
  const client = await createSupabaseServerClient();
  const supabase: AuthClient = client;
  
  // Get user before logout for audit log
  const { data: { user } } = await supabase.auth.getUser() as { data: { user: { id: string } | null } };
  
  if (!supabase.auth.signOut) {
    await logAuthEvent("auth.login.failure", user?.id ?? null, { reason: "signOut not available" });
    throw new Error("signOut not available");
  }
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    await logAuthEvent("auth.login.failure", user?.id ?? null, { reason: error.message });
    throw new Error("Logout failed");
  }
  
  // Log successful logout
  await logAuthEvent("auth.logout", user?.id ?? null);
  
  return redirect("/login");
}