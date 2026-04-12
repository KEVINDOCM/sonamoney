/**
 * MFA Status API Route
 * GET /api/auth/mfa/status
 * Check MFA status for current user
 */

import { createClient } from "@supabase/supabase-js"
import { userHasMFAEnabled, getUserMFAMethod } from "@/lib/mfa"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDb = any

function getServiceClient(): SupabaseDb {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase config")
  return createClient(url, key, { auth: { persistSession: false } }) as SupabaseDb
}

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

    // Check MFA status
    const mfaEnabled = await userHasMFAEnabled(userId)
    const mfaMethod = await getUserMFAMethod(userId)

    // Get detailed MFA settings
    const { data: settings } = await supabase
      .from("mfa_settings")
      .select("webauthn_enabled, totp_enabled, email_otp_enabled, enforcement_level, preferred_method")
      .eq("user_id", userId)
      .single()

    const typedSettings = settings as {
      webauthn_enabled: boolean
      totp_enabled: boolean
      email_otp_enabled: boolean
      enforcement_level: "optional" | "required" | "admin_bypass"
      preferred_method: string | null
    } | null

    return Response.json(
      {
        mfaEnabled,
        mfaMethod,
        settings: {
          webauthnEnabled: typedSettings?.webauthn_enabled ?? false,
          totpEnabled: typedSettings?.totp_enabled ?? false,
          emailOtpEnabled: typedSettings?.email_otp_enabled ?? false,
          enforcementLevel: typedSettings?.enforcement_level ?? "optional",
          preferredMethod: typedSettings?.preferred_method,
        },
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[MFA STATUS] Error:", errorMessage)
    return Response.json({ error: "Failed to get MFA status" }, { status: 500 })
  }
}
