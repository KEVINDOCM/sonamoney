/**
 * MFA Send OTP API Route
 * POST /api/auth/mfa/send
 * Sends Email OTP to authenticated user
 */

import { createClient } from "@supabase/supabase-js"
import { sendEmailOTP } from "@/lib/mfa/email"
import { checkOTPRateLimit } from "@/lib/mfa"
import { logAuditEvent } from "@/lib/utils/auditLog"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDb = any

function getServiceClient(): SupabaseDb {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase config")
  return createClient(url, key, { auth: { persistSession: false } }) as SupabaseDb
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req)
  const userAgent = req.headers.get("user-agent") || "unknown"

  try {
    // Get authorization token
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)

    // Verify token and get user
    const supabase = getServiceClient()
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData?.user) {
      return Response.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = userData.user as { id: string; email?: string }
    const userId = user.id
    const email = user.email

    if (!email) {
      return Response.json({ error: "User email not found" }, { status: 400 })
    }

    // Check if user has MFA enabled
    const { data: mfaSettings } = await supabase
      .from("mfa_settings")
      .select("email_otp_enabled")
      .eq("user_id", userId)
      .single()

    const settings = mfaSettings as { email_otp_enabled: boolean } | null
    if (!settings?.email_otp_enabled) {
      return Response.json({ error: "MFA not enabled for this user" }, { status: 400 })
    }

    // Check rate limit
    const rateLimit = await checkOTPRateLimit(userId, ip)
    if (!rateLimit.allowed) {
      await logAuditEvent({
        eventType: "auth.mfa.rate_limited",
        eventStatus: "blocked",
        userId,
        ipAddress: ip,
        userAgent,
        metadata: { resetAt: rateLimit.resetAt?.toISOString() ?? null },
      })

      return Response.json(
        {
          error: "Too many attempts. Please try again later.",
          resetAt: rateLimit.resetAt?.toISOString(),
        },
        { status: 429 }
      )
    }

    // Send OTP
    const result = await sendEmailOTP(userId, email, ip, userAgent)

    if (!result.success) {
      await logAuditEvent({
        eventType: "auth.mfa.send_failed",
        eventStatus: "failure",
        userId,
        ipAddress: ip,
        userAgent,
        metadata: { error: result.error ?? null },
      })

      return Response.json({ error: result.error }, { status: 500 })
    }

    // Log success
    await logAuditEvent({
      eventType: "auth.mfa.sent",
      eventStatus: "success",
      userId,
      ipAddress: ip,
      userAgent,
      metadata: { challengeId: result.challengeId ?? null },
    })

    return Response.json(
      {
        success: true,
        challengeId: result.challengeId,
        message: "Verification code sent to your email",
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[MFA SEND] Error:", errorMessage)

    await logAuditEvent({
      eventType: "auth.mfa.send_error",
      eventStatus: "failure",
      ipAddress: ip,
      userAgent,
      metadata: { error: errorMessage },
    })

    return Response.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
