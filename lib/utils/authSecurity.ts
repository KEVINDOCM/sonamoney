import { createClient } from "@supabase/supabase-js"

const MAX_ATTEMPTS = 5
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000
const LOCKOUT_DURATION_MS = 15 * 60 * 1000

export interface LockoutStatus {
  locked: boolean
  remainingMs: number
  attempts: number
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase config")
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function checkAndRecordAttempt(
  email: string,
  ip: string,
  success: boolean
): Promise<LockoutStatus> {
  const supabase = getServiceClient()
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString()

  // Record this attempt
  await supabase.from("auth_attempts").insert({
    email: email.toLowerCase().trim(),
    ip_address: ip,
    success,
  })

  // If success, clear failed attempts
  if (success) {
    await supabase
      .from("auth_attempts")
      .delete()
      .eq("email", email.toLowerCase().trim())
      .eq("success", false)
    return { locked: false, remainingMs: 0, attempts: 0 }
  }

  // Count recent failed attempts for this email
  const { data: attempts } = await supabase
    .from("auth_attempts")
    .select("attempted_at")
    .eq("email", email.toLowerCase().trim())
    .eq("success", false)
    .gte("attempted_at", windowStart)
    .order("attempted_at", { ascending: false })

  const count = attempts?.length ?? 0

  if (count >= MAX_ATTEMPTS) {
    const oldestInWindow = attempts?.[attempts.length - 1]?.attempted_at
    const lockoutExpiry = oldestInWindow
      ? new Date(oldestInWindow).getTime() + LOCKOUT_DURATION_MS
      : Date.now() + LOCKOUT_DURATION_MS
    const remainingMs = Math.max(0, lockoutExpiry - Date.now())
    return { locked: true, remainingMs, attempts: count }
  }

  return { locked: false, remainingMs: 0, attempts: count }
}

export async function isLockedOut(
  email: string
): Promise<LockoutStatus> {
  const supabase = getServiceClient()
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString()

  const { data: attempts } = await supabase
    .from("auth_attempts")
    .select("attempted_at")
    .eq("email", email.toLowerCase().trim())
    .eq("success", false)
    .gte("attempted_at", windowStart)
    .order("attempted_at", { ascending: false })

  const count = attempts?.length ?? 0

  if (count >= MAX_ATTEMPTS) {
    const oldestInWindow = attempts?.[attempts.length - 1]?.attempted_at
    const lockoutExpiry = oldestInWindow
      ? new Date(oldestInWindow).getTime() + LOCKOUT_DURATION_MS
      : Date.now() + LOCKOUT_DURATION_MS
    const remainingMs = Math.max(0, lockoutExpiry - Date.now())
    return { locked: true, remainingMs, attempts: count }
  }

  return { locked: false, remainingMs: 0, attempts: count }
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254)
}

export function getClientIp(request: Request | { headers: Headers }): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown"
  return "unknown"
}
