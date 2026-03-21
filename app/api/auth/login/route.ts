import { z } from "zod"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { checkAndRecordAttempt, isLockedOut } from "@/lib/utils/authSecurity"
import { validateRequest, loginSchema, sanitizeEmail, getClientIp } from "@/lib/security"

const MAX_ATTEMPTS = 5
const GENERIC_ERROR = "Invalid email or password"

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)
    const body = await req.json()

    // Validate request (signature, timestamp, XSS, schema)
    const validation = await validateRequest(req, body, loginSchema)
    if (!validation.success) {
      return Response.json({ error: GENERIC_ERROR }, { status: validation.status })
    }

    const data = validation.data!
    const email = sanitizeEmail(String(data.email))

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

    return Response.json({ proceed: true }, { status: 200 })
  } catch {
    return Response.json({ error: GENERIC_ERROR }, { status: 500 })
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)
    const body = await req.json()

    // Validate request (signature, timestamp, XSS)
    const validation = await validateRequest(req, body)
    if (!validation.success) {
      return Response.json({ ok: true }, { status: 200 })
    }

    const schema = z.object({
      email: z.string().email().max(254),
      success: z.boolean(),
    })

    const parsed = schema.safeParse(validation.data)
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
