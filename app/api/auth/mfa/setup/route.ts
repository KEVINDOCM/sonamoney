/**
 * MFA Setup API Route
 * POST /api/auth/mfa/setup - Enable MFA
 * DELETE /api/auth/mfa/setup - Disable MFA
 */

import { createClient } from "@supabase/supabase-js"
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

const setupSchema = z.object({
  method: z.enum(["email_otp", "totp", "webauthn"]),
  enforcementLevel: z.enum(["optional", "required"]).optional(),
})

/**
 * Enable MFA for user
 */
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

    const user = userData.user as { id: string; email?: string }
    const userId = user.id

    // Parse request
    const body = await req.json()
    const validation = setupSchema.safeParse(body)

    if (!validation.success) {
      return Response.json(
        { error: validation.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { method, enforcementLevel } = validation.data

    // Get or create MFA settings
    const { data: existingSettings } = await supabase
      .from("mfa_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    const updateData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }

    // Enable the specific method
    switch (method) {
      case "email_otp":
        updateData.email_otp_enabled = true
        break
      case "totp":
        updateData.totp_enabled = true
        break
      case "webauthn":
        updateData.webauthn_enabled = true
        break
    }

    updateData.preferred_method = method
    if (enforcementLevel) {
      updateData.enforcement_level = enforcementLevel
    }

    if (existingSettings) {
      // Update existing
      const { error } = await supabase.from("mfa_settings").update(updateData).eq("user_id", userId)

      if (error) {
        console.error("[MFA SETUP] Update error:", error.message)
        return Response.json({ error: "Failed to enable MFA" }, { status: 500 })
      }
    } else {
      // Create new
      updateData.created_at = new Date().toISOString()
      updateData.enforcement_level = enforcementLevel || "optional"

      const { error } = await supabase.from("mfa_settings").insert(updateData)

      if (error) {
        console.error("[MFA SETUP] Insert error:", error.message)
        return Response.json({ error: "Failed to enable MFA" }, { status: 500 })
      }
    }

    // Log
    await logAuditEvent({
      eventType: "auth.mfa.enabled",
      eventStatus: "success",
      userId,
      ipAddress: ip,
      userAgent,
      metadata: { method, enforcementLevel: enforcementLevel ?? null },
    })

    return Response.json(
      {
        success: true,
        message: `MFA enabled with ${method}`,
        method,
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[MFA SETUP] Error:", errorMessage)
    return Response.json({ error: "Failed to setup MFA" }, { status: 500 })
  }
}

/**
 * Disable MFA for user
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

    // Disable all MFA methods
    const { error } = await supabase
      .from("mfa_settings")
      .update({
        webauthn_enabled: false,
        totp_enabled: false,
        email_otp_enabled: false,
        preferred_method: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      console.error("[MFA SETUP] Disable error:", error.message)
      return Response.json({ error: "Failed to disable MFA" }, { status: 500 })
    }

    // Revoke all trusted devices
    await supabase.from("user_sessions").delete().eq("user_id", userId).eq("trusted", true)

    // Log
    await logAuditEvent({
      eventType: "auth.mfa.disabled",
      eventStatus: "success",
      userId,
      ipAddress: ip,
      userAgent,
    })

    return Response.json(
      {
        success: true,
        message: "MFA disabled successfully",
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[MFA SETUP] Error:", errorMessage)
    return Response.json({ error: "Failed to disable MFA" }, { status: 500 })
  }
}
