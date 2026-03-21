import { createClient } from "@supabase/supabase-js"

export type AuditEventType =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.login.locked"
  | "auth.register.success"
  | "auth.register.failure"
  | "auth.register.blocked"
  | "auth.logout"
  | "auth.password_reset.requested"
  | "account.deleted"
  | "data.export"
  | "scan.receipt.success"
  | "scan.receipt.failure"
  | "security.rate_limit_hit"

export type AuditEventStatus = "success" | "failure" | "blocked"

export interface AuditLogEntry {
  userId?: string | null
  eventType: AuditEventType
  eventStatus: AuditEventStatus
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getServiceClient()
    if (!supabase) return

    await supabase.from("audit_log").insert({
      user_id: entry.userId ?? null,
      event_type: entry.eventType,
      event_status: entry.eventStatus,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      metadata: entry.metadata ?? {},
    })
  } catch {
    // Audit log failure must never break the main flow
    // Silent fail — log to server console only
    console.error("[AUDIT] Failed to write audit log")
  }
}

export function getRequestMeta(request: Request): {
  ipAddress: string
  userAgent: string
} {
  const forwarded = request.headers.get("x-forwarded-for")
  const ipAddress = forwarded
    ? (forwarded.split(",")[0]?.trim() ?? "unknown")
    : "unknown"

  const userAgent = request.headers.get("user-agent")?.slice(0, 200) ?? "unknown"

  return { ipAddress, userAgent }
}
