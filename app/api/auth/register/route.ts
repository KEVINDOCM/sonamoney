import { createSupabaseServerClient } from "@/lib/supabase/server"
import { sanitizeEmail, getClientIp } from "@/lib/utils/authSecurity"
import { signupSchema } from "@/lib/utils/validation"
import { checkPasswordBreached } from "@/lib/utils/passwordSecurity"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { getSiteUrl } from "@/lib/utils/url"

// Generic message to prevent user enumeration
const GENERIC_SUCCESS = "If this email is not registered, you will receive a confirmation email."

interface SupabaseAuthApi {
  auth: {
    signUp: (credentials: { email: string; password: string; options: { emailRedirectTo: string } }) => Promise<{ error: Error | null }>
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)

    // Basic rate limit — max 3 registrations per IP per hour
    // (handled by middleware IP rate limiter as baseline)

    const body: unknown = await req.json()

    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(parsed.data.email)
    const { password } = parsed.data

    // Check password breach server-side
    const breach = await checkPasswordBreached(password)
    if (breach.breached) {
      return Response.json(
        {
          error: `This password appeared in ${breach.count.toLocaleString()} data breaches. Please choose a stronger password.`,
        },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient() as unknown as SupabaseAuthApi
    const origin = req.headers.get("origin") ?? getSiteUrl()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/callback`,
      },
    })

    // Always return generic success to prevent user enumeration
    // Even if email already exists, Supabase handles silently
    if (error && !error.message.includes("already registered")) {
      await logAuditEvent({
        eventType: "auth.register.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { reason: "signup_error" },
      })
      return Response.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      )
    }

    await logAuditEvent({
      eventType: "auth.register.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { email: email.slice(0, 3) + "***" },
    })

    return Response.json(
      { success: true, message: GENERIC_SUCCESS },
      { status: 200 }
    )
  } catch {
    return Response.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
