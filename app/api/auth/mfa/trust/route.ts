/**
 * Trust Device API Route
 * POST /api/auth/mfa/trust
 * Mark current device as trusted (skips MFA for 30 days)
 */

import { createClient } from "@supabase/supabase-js"
import { trustDevice, validateSession } from "@/lib/mfa"
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

/**
 * Generate device fingerprint from request
 * Note: In production, use client-side fingerprinting with FingerprintJS
 */
function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers.get("user-agent") || ""
  const acceptLanguage = req.headers.get("accept-language") || ""
  const components = [userAgent, acceptLanguage]

  // Simple hash
  let hash = 0
  for (let i = 0; i < components.length; i++) {
    const str = components[i]
    for (let j = 0; j < str.length; j++) {
      const char = str.charCodeAt(j)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
  }
  return Math.abs(hash).toString(36)
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

    const user = userData.user as { id: string }
    const userId = user.id

    // Get session token from cookie or body
    const body = await req.json().catch(() => ({}))
    const sessionToken = body.sessionToken

    if (!sessionToken) {
      return Response.json({ error: "Session token required" }, { status: 400 })
    }

    // Validate session belongs to user
    const session = await validateSession(sessionToken)
    if (!session || session.userId !== userId) {
      return Response.json({ error: "Invalid session" }, { status: 401 })
    }

    // Generate device fingerprint
    const fingerprint = generateDeviceFingerprint(req)

    // Trust the device
    const success = await trustDevice(sessionToken, fingerprint)

    if (!success) {
      return Response.json({ error: "Failed to trust device" }, { status: 500 })
    }

    // Log
    await logAuditEvent({
      eventType: "auth.device.trusted",
      eventStatus: "success",
      userId,
      ipAddress: ip,
      userAgent,
      metadata: {
        sessionId: session.id,
        fingerprint,
      },
    })

    return Response.json(
      {
        success: true,
        message: "Device trusted for 30 days",
        trustedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[TRUST DEVICE] Error:", errorMessage)
    return Response.json({ error: "Failed to trust device" }, { status: 500 })
  }
}
