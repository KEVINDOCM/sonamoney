import { createSupabaseServerClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { getSiteUrl } from "@/lib/utils/url"
import { checkPasswordBreached } from "@/lib/utils/passwordSecurity"
import { validateRequest, signupSchema, sanitizeEmail, getClientIp } from "@/lib/security"

const GENERIC_SUCCESS = "If this email is not registered, you will receive a confirmation email."
const GENERIC_ERROR = "Failed to create account. Please try again."

interface SupabaseAuthApi {
  auth: {
    signUp: (credentials: { email: string; password: string; options: { emailRedirectTo: string } }) => Promise<{ error: Error | null }>
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)
    const body = await req.json()

    // Validate request (signature, timestamp, XSS, schema)
    const validation = await validateRequest(req, body, signupSchema)
    if (!validation.success) {
      const errorReason = validation.error ?? "validation_failed"
      await logAuditEvent({
        eventType: "auth.register.blocked",
        eventStatus: "blocked",
        ipAddress: ip,
        metadata: { reason: errorReason },
      })
      return Response.json({ error: GENERIC_ERROR }, { status: validation.status })
    }

    const data = validation.data!

    // Honeypot check
    if (data.website && String(data.website).trim().length > 0) {
      await logAuditEvent({
        eventType: "auth.register.blocked",
        eventStatus: "blocked",
        ipAddress: ip,
        metadata: { reason: "honeypot" },
      })
      return Response.json({ success: true, message: GENERIC_SUCCESS }, { status: 200 })
    }

    const email = sanitizeEmail(String(data.email))
    const password = String(data.password)

    // Check breached password
    const breach = await checkPasswordBreached(password)
    if (breach.breached) {
      return Response.json(
        { error: `This password appeared in ${breach.count.toLocaleString()} data breaches. Please choose a stronger password.` },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient() as unknown as SupabaseAuthApi
    const origin = req.headers.get("origin") ?? getSiteUrl()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/callback` },
    })

    if (error && !error.message.includes("already registered")) {
      await logAuditEvent({
        eventType: "auth.register.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { reason: "signup_error" },
      })
      return Response.json({ error: GENERIC_ERROR }, { status: 500 })
    }

    await logAuditEvent({
      eventType: "auth.register.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { email: email.slice(0, 3) + "***" },
    })

    return Response.json({ success: true, message: GENERIC_SUCCESS }, { status: 200 })
  } catch {
    return Response.json({ error: GENERIC_ERROR }, { status: 500 })
  }
}
