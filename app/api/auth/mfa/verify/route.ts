/**
 * MFA Verify OTP API Route
 * POST /api/auth/mfa/verify
 * Verifies Email OTP and creates authenticated session
 */

import { createClient } from "@supabase/supabase-js"
import { verifyMFAChallenge, recordOTPVerifyAttempt, createUserSession } from "@/lib/mfa"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { z } from "zod"

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

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  trustDevice: z.boolean().optional(),
})

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req)
  const userAgent = req.headers.get("user-agent") || "unknown"

  try {
    // Get authorization token (optional - can be pre-auth or during login flow)
    const authHeader = req.headers.get("authorization")
    let userId: string | null = null
    let email: string | null = null

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      const supabase = getServiceClient()
      const { data: userData } = await supabase.auth.getUser(token)
      if (userData?.user) {
        const user = userData.user as { id: string; email?: string }
        userId = user.id
        email = user.email ?? null
      }
    }

    // Parse request body
    const body = await req.json()
    const validation = verifySchema.safeParse(body)

    if (!validation.success) {
      return Response.json(
        { error: validation.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { challengeId, otp, trustDevice } = validation.data

    // Verify the challenge
    const verifyResult = await verifyMFAChallenge(challengeId, otp)

    if (!verifyResult.success || !verifyResult.userId) {
      // Record failed attempt
      if (verifyResult.userId) {
        await recordOTPVerifyAttempt(verifyResult.userId, ip, userAgent, false)

        await logAuditEvent({
          eventType: "auth.mfa.verify_failed",
          eventStatus: "failure",
          userId: verifyResult.userId,
          ipAddress: ip,
          userAgent,
          metadata: { challengeId, error: verifyResult.error ?? null },
        })
      }

      return Response.json(
        { error: verifyResult.error || "Invalid verification code" },
        { status: 400 }
      )
    }

    const verifiedUserId = verifyResult.userId

    // Record successful attempt
    await recordOTPVerifyAttempt(verifiedUserId, ip, userAgent, true)

    // Create new session
    const deviceFingerprint = crypto.randomUUID() // Simplified - should use actual device fingerprinting
    const deviceType = /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop"

    const session = await createUserSession(
      verifiedUserId,
      {
        fingerprint: deviceFingerprint,
        name: "Web Browser",
        type: deviceType,
      },
      ip,
      userAgent,
      {
        mfaVerified: true,
        trusted: trustDevice ?? false,
      }
    )

    if (!session) {
      return Response.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Log success
    await logAuditEvent({
      eventType: "auth.mfa.verified",
      eventStatus: "success",
      userId: verifiedUserId,
      ipAddress: ip,
      userAgent,
      metadata: {
        challengeId,
        sessionId: session.id,
        trusted: trustDevice ?? false,
      },
    })

    return Response.json(
      {
        success: true,
        message: "MFA verification successful",
        sessionToken: session.sessionToken,
        trusted: session.trusted,
        trustedUntil: session.trustedUntil?.toISOString(),
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `mfa_session=${session.sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`,
        },
      }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[MFA VERIFY] Error:", errorMessage)

    await logAuditEvent({
      eventType: "auth.mfa.verify_error",
      eventStatus: "failure",
      ipAddress: ip,
      userAgent,
      metadata: { error: errorMessage },
    })

    return Response.json({ error: "Verification failed" }, { status: 500 })
  }
}
