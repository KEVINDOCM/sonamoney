import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  checkAndRecordAttempt,
  isLockedOut,
  sanitizeEmail,
  getClientIp,
} from "@/lib/utils/authSecurity"
import { loginSchema } from "@/lib/utils/validation"
import { logAuditEvent } from "@/lib/utils/auditLog"

const MAX_ATTEMPTS = 5
const GENERIC_ERROR = "Invalid email or password"

interface SupabaseAuthApi {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: unknown } | null; error: Error | null }>
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)

    const body: unknown = await req.json()

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: GENERIC_ERROR },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(parsed.data.email)
    const { password } = parsed.data

    // Check lockout BEFORE attempting login
    const lockout = await isLockedOut(email)
    if (lockout.locked) {
      const minutes = Math.ceil(lockout.remainingMs / 60000)
      await logAuditEvent({
        eventType: "auth.login.locked",
        eventStatus: "blocked",
        ipAddress: ip,
        metadata: { email: email.slice(0, 3) + "***" },
      })
      return Response.json(
        {
          error: `Account temporarily locked. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
          locked: true,
          remainingMs: lockout.remainingMs,
        },
        { status: 429 }
      )
    }

    const supabase = await createSupabaseServerClient() as unknown as SupabaseAuthApi
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    const success = !error && !!(data?.user)

    // Record attempt (success or failure)
    const attemptResult = await checkAndRecordAttempt(
      email,
      ip,
      success
    )

    if (!success) {
      // Check if now locked after this attempt
      if (attemptResult.locked) {
        const minutes = Math.ceil(attemptResult.remainingMs / 60000)
        await logAuditEvent({
          eventType: "auth.login.locked",
          eventStatus: "blocked",
          ipAddress: ip,
          metadata: { email: email.slice(0, 3) + "***", attempts: attemptResult.attempts },
        })
      return Response.json(
        {
          error: `Too many failed attempts. Account locked for ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
          locked: true,
          remainingMs: attemptResult.remainingMs,
        },
        { status: 429 }
      )
      }

      const remaining = MAX_ATTEMPTS - attemptResult.attempts
      const attemptsMsg = remaining > 0
        ? ` ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
        : ""

      await logAuditEvent({
        eventType: "auth.login.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { email: email.slice(0, 3) + "***", remainingAttempts: remaining },
      })

      return Response.json(
        { error: `${GENERIC_ERROR}.${attemptsMsg}` },
        { status: 401 }
      )
    }

    await logAuditEvent({
      eventType: "auth.login.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { email: email.slice(0, 3) + "***" },
    })

    return Response.json({ success: true }, { status: 200 })
  } catch {
    return Response.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
