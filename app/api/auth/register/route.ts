import { createClient } from "@supabase/supabase-js"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { getSiteUrl } from "@/lib/utils/url"
import { checkPasswordBreached } from "@/lib/utils/passwordSecurity"
import { validateRequest, signupSchema, sanitizeEmail, getClientIp } from "@/lib/security"

const GENERIC_SUCCESS = "If this email is not registered, you will receive a confirmation email."
const GENERIC_ERROR = "Failed to create account. Please try again."

interface SupabaseAuthApi {
  auth: {
    signUp: (credentials: {
      email: string
      password: string
      options: {
        emailRedirectTo: string
        captchaToken?: string
      }
    }) => Promise<{ error: Error | null }>
  }
}

// Create a direct Supabase client for API routes (no cookie dependency needed for signup)
function createSupabaseApiClient(): SupabaseAuthApi {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  }) as unknown as SupabaseAuthApi
}

export async function POST(req: Request): Promise<Response> {
  let ip = "unknown"
  try {
    ip = getClientIp(req)
    
    // Check critical environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[AUTH] Missing Supabase environment variables")
      return Response.json({ error: "Server configuration error: Missing Supabase config" }, { status: 500 })
    }
    
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch (parseErr) {
      console.error("[AUTH] Failed to parse request body:", parseErr)
      return Response.json({ error: "Invalid request format" }, { status: 400 })
    }

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

    const supabase = createSupabaseApiClient()
    const origin = req.headers.get("origin") ?? getSiteUrl()

    // Get captcha token if provided (required when captcha is enabled in Supabase)
    const captchaToken = body.captchaToken as string | undefined

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/callback`,
        ...(captchaToken && { captchaToken }),
      },
    })

    if (error) {
      // Log the actual error for debugging
      console.error("[AUTH] Supabase signup error:", error.message, "Status:", (error as { status?: number }).status)
      
      // Handle "already registered" gracefully (don't leak user existence)
      const errorMsg = error.message.toLowerCase()
      if (errorMsg.includes("already registered") || errorMsg.includes("user already") || errorMsg.includes("already exists")) {
        return Response.json({ success: true, message: GENERIC_SUCCESS }, { status: 200 })
      }
      
      await logAuditEvent({
        eventType: "auth.register.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { reason: "signup_error", error: error.message.slice(0, 100) },
      })
      return Response.json({ error: `Registration failed: ${error.message}` }, { status: 500 })
    }

    await logAuditEvent({
      eventType: "auth.register.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { email: email.slice(0, 3) + "***" },
    })

    return Response.json({ success: true, message: GENERIC_SUCCESS }, { status: 200 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[AUTH] Unhandled register error:", errorMessage)
    return Response.json({ error: `Server error: ${errorMessage}` }, { status: 500 })
  }
}
