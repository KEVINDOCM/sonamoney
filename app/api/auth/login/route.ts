import { checkAndRecordAttempt, isLockedOut, sanitizeEmail, getClientIp } from "@/lib/utils/authSecurity"
import { loginSchema } from "@/lib/utils/validation"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { z } from "zod"

const MAX_ATTEMPTS = 5
const GENERIC_ERROR = "Invalid email or password"

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

    // Return ok — client will perform actual sign in
    return Response.json({ proceed: true }, { status: 200 })
  } catch {
    return Response.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)
    const body: unknown = await req.json()

    const schema = z.object({
      email: z.string().email().max(254),
      success: z.boolean(),
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ ok: true }, { status: 200 })
    }

    const email = sanitizeEmail(parsed.data.email)
    const { success } = parsed.data

    const attemptResult = await checkAndRecordAttempt(email, ip, success)

    if (success) {
      await logAuditEvent({
        eventType: "auth.login.success",
        eventStatus: "success",
        ipAddress: ip,
        metadata: { email: email.slice(0, 3) + "***" },
      })
    } else {
      if (attemptResult.locked) {
        await logAuditEvent({
          eventType: "auth.login.locked",
          eventStatus: "blocked",
          ipAddress: ip,
          metadata: { email: email.slice(0, 3) + "***", attempts: attemptResult.attempts },
        })
      } else {
        await logAuditEvent({
          eventType: "auth.login.failure",
          eventStatus: "failure",
          ipAddress: ip,
          metadata: { email: email.slice(0, 3) + "***" },
        })
      }
    }

    return Response.json({
      ok: true,
      locked: attemptResult.locked,
      remainingMs: attemptResult.remainingMs,
      attempts: attemptResult.attempts,
    }, { status: 200 })
  } catch {
    return Response.json({ ok: true }, { status: 200 })
  }
}
