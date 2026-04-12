/**
 * Sessions Management API Route
 * GET /api/auth/sessions - List active sessions
 * DELETE /api/auth/sessions/:id - Revoke specific session
 * DELETE /api/auth/sessions - Revoke all other sessions
 */

import { createClient } from "@supabase/supabase-js"
import { getUserActiveSessions, revokeSession, revokeOtherSessions, validateSession } from "@/lib/mfa"
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
 * List active sessions
 */
export async function GET(req: Request): Promise<Response> {
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

    // Get current session token from cookie
    const currentSessionToken = req.headers.get("cookie")?.match(/mfa_session=([^;]+)/)?.[1]

    // Get active sessions
    const sessions = await getUserActiveSessions(userId)

    // Mark current session
    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: session.sessionToken === currentSessionToken,
    }))

    return Response.json(
      {
        sessions: sessionsWithCurrent.map((s) => ({
          id: s.id,
          deviceName: s.deviceName,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          location: s.location,
          mfaVerified: s.mfaVerified,
          trusted: s.trusted,
          trustedUntil: s.trustedUntil?.toISOString(),
          createdAt: s.createdAt.toISOString(),
          lastActiveAt: s.lastActiveAt.toISOString(),
          isCurrent: s.isCurrent,
        })),
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[SESSIONS] Error:", errorMessage)
    return Response.json({ error: "Failed to get sessions" }, { status: 500 })
  }
}

/**
 * Revoke a session (DELETE with id in body)
 * Or revoke all other sessions
 */
export async function DELETE(req: Request): Promise<Response> {
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

    // Parse body for session to revoke
    const body = await req.json().catch(() => ({}))
    const { sessionId, allOthers } = body

    // Get current session token
    const currentSessionToken = req.headers.get("cookie")?.match(/mfa_session=([^;]+)/)?.[1]

    if (allOthers && currentSessionToken) {
      // Revoke all other sessions
      const success = await revokeOtherSessions(currentSessionToken, userId)

      if (!success) {
        return Response.json({ error: "Failed to revoke sessions" }, { status: 500 })
      }

      await logAuditEvent({
        eventType: "auth.sessions.revoked_all",
        eventStatus: "success",
        userId,
        ipAddress: ip,
        userAgent,
      })

      return Response.json(
        {
          success: true,
          message: "All other sessions revoked",
        },
        { status: 200 }
      )
    }

    if (sessionId) {
      // Revoke specific session
      const success = await revokeSession(sessionId, userId)

      if (!success) {
        return Response.json({ error: "Failed to revoke session" }, { status: 500 })
      }

      await logAuditEvent({
        eventType: "auth.session.revoked",
        eventStatus: "success",
        userId,
        ipAddress: ip,
        userAgent,
        metadata: { sessionId },
      })

      return Response.json(
        {
          success: true,
          message: "Session revoked",
        },
        { status: 200 }
      )
    }

    return Response.json({ error: "sessionId or allOthers required" }, { status: 400 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[SESSIONS DELETE] Error:", errorMessage)
    return Response.json({ error: "Failed to revoke session" }, { status: 500 })
  }
}
