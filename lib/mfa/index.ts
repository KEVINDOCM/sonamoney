/**
 * MFA (Multi-Factor Authentication) Core Module
 * Email OTP implementation with device trust and session management
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_ATTEMPTS = 5
const OTP_RATE_LIMIT_WINDOW_MINUTES = 15
const TRUSTED_DEVICE_DAYS = 30
const MAX_CONCURRENT_SESSIONS = 5

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDb = any

function getServiceClient(): SupabaseDb {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase config")
  return createClient(url, key, { auth: { persistSession: false } }) as SupabaseDb
}

// ============================================
// OTP GENERATION & VERIFICATION
// ============================================

/**
 * Generate cryptographically secure 6-digit OTP
 */
export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const otp = (array[0] % 1000000).toString().padStart(OTP_LENGTH, "0")
  return otp
}

/**
 * Hash OTP for storage (using bcrypt)
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

/**
 * Verify OTP against hash
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash)
}

// ============================================
// MFA CHALLENGE MANAGEMENT
// ============================================

export interface MFAChallenge {
  id: string
  userId: string
  challengeType: "email_otp" | "totp" | "webauthn"
  expiresAt: Date
  used: boolean
  deviceFingerprint?: string
  ipAddress?: string
}

/**
 * Create new MFA challenge (stores hashed OTP)
 */
export async function createMFAChallenge(
  userId: string,
  challengeType: "email_otp" | "totp" | "webauthn",
  otp: string,
  deviceFingerprint?: string,
  ipAddress?: string
): Promise<MFAChallenge | null> {
  const supabase = getServiceClient()
  const hashedOTP = await hashOTP(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  const { data, error } = await supabase
    .from("mfa_challenges")
    .insert({
      user_id: userId,
      challenge_type: challengeType,
      otp_code_hash: hashedOTP,
      expires_at: expiresAt.toISOString(),
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[MFA] Failed to create challenge:", error?.message)
    return null
  }

  return {
    id: (data as { id: string }).id,
    userId,
    challengeType,
    expiresAt,
    used: false,
    deviceFingerprint,
    ipAddress,
  }
}

/**
 * Verify MFA challenge
 */
export async function verifyMFAChallenge(
  challengeId: string,
  otp: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = getServiceClient()

  // Get challenge
  const { data: challenge, error } = await supabase
    .from("mfa_challenges")
    .select("*")
    .eq("id", challengeId)
    .single()

  if (error || !challenge) {
    return { success: false, error: "Invalid challenge" }
  }

  const typedChallenge = challenge as {
    id: string
    user_id: string
    otp_code_hash: string
    expires_at: string
    used: boolean
  }

  // Check expiration
  if (new Date(typedChallenge.expires_at) < new Date()) {
    return { success: false, error: "Challenge expired" }
  }

  // Check already used
  if (typedChallenge.used) {
    return { success: false, error: "Challenge already used" }
  }

  // Verify OTP
  const valid = await verifyOTP(otp, typedChallenge.otp_code_hash)
  if (!valid) {
    return { success: false, error: "Invalid code" }
  }

  // Mark as used
  await supabase.from("mfa_challenges").update({ used: true }).eq("id", challengeId)

  return { success: true, userId: typedChallenge.user_id }
}

// ============================================
// RATE LIMITING
// ============================================

export interface RateLimitStatus {
  allowed: boolean
  remainingAttempts: number
  resetAt?: Date
}

/**
 * Check OTP rate limit (send attempts)
 */
export async function checkOTPRateLimit(
  userId: string,
  ipAddress: string
): Promise<RateLimitStatus> {
  const supabase = getServiceClient()
  const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)

  // Check user-based attempts
  const { data: userAttempts } = await supabase
    .from("mfa_attempts")
    .select("attempt_at")
    .eq("user_id", userId)
    .eq("attempt_type", "send")
    .gte("attempt_at", windowStart.toISOString())

  // Check IP-based attempts
  const { data: ipAttempts } = await supabase
    .from("mfa_attempts")
    .select("attempt_at")
    .eq("ip_address", ipAddress)
    .eq("attempt_type", "send")
    .gte("attempt_at", windowStart.toISOString())

  const userCount = (userAttempts as { attempt_at: string }[] | null)?.length ?? 0
  const ipCount = (ipAttempts as { attempt_at: string }[] | null)?.length ?? 0

  // Stricter limit per user (3), more lenient per IP (10)
  if (userCount >= 3 || ipCount >= 10) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: new Date(Date.now() + OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000),
    }
  }

  return {
    allowed: true,
    remainingAttempts: Math.min(3 - userCount, 10 - ipCount),
  }
}

/**
 * Record OTP send attempt
 */
export async function recordOTPSendAttempt(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from("mfa_attempts").insert({
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    attempt_type: "send",
    success: true,
  })
}

/**
 * Record OTP verify attempt
 */
export async function recordOTPVerifyAttempt(
  userId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean
): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from("mfa_attempts").insert({
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    attempt_type: "verify",
    success,
  })
}

// ============================================
// DEVICE FINGERPRINTING
// ============================================

export interface DeviceInfo {
  fingerprint: string
  name: string
  type: "desktop" | "mobile" | "tablet" | "unknown"
}

/**
 * Generate device fingerprint from user agent and screen info
 * Note: Client-side should provide screen dimensions for better fingerprinting
 */
export function generateDeviceFingerprint(
  userAgent: string,
  screenInfo?: { width: number; height: number; colorDepth: number }
): string {
  const components = [userAgent]

  if (screenInfo) {
    components.push(
      screenInfo.width.toString(),
      screenInfo.height.toString(),
      screenInfo.colorDepth.toString()
    )
  }

  // Simple hash (in production, use a proper hash like SHA-256)
  const combined = components.join("|")
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent: string): DeviceInfo["type"] {
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
    if (/ipad/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) {
      return "tablet"
    }
    return "mobile"
  }
  return "desktop"
}

/**
 * Get device name from user agent
 */
export function getDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  if (ua.includes("chrome")) return "Chrome"
  if (ua.includes("firefox")) return "Firefox"
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari"
  if (ua.includes("edge")) return "Edge"
  if (ua.includes("opera")) return "Opera"

  return "Unknown Browser"
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export interface UserSession {
  id: string
  userId: string
  sessionToken: string
  deviceFingerprint: string
  deviceName: string
  deviceType: "desktop" | "mobile" | "tablet" | "unknown"
  ipAddress?: string
  userAgent?: string
  location?: string
  mfaVerified: boolean
  trusted: boolean
  trustedUntil?: Date
  expiresAt: Date
  createdAt: Date
  lastActiveAt: Date
}

/**
 * Create new user session
 */
export async function createUserSession(
  userId: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  userAgent: string,
  options?: {
    mfaVerified?: boolean
    trusted?: boolean
    location?: string
  }
): Promise<UserSession | null> {
  const supabase = getServiceClient()

  // Check concurrent session limit
  const { data: sessionCount } = await supabase.rpc("count_active_sessions", {
    user_uuid: userId,
  })

  if ((sessionCount ?? 0) >= MAX_CONCURRENT_SESSIONS) {
    // Remove oldest session
    const { data: oldestSessions } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("last_active_at", { ascending: true })

    const sessions = oldestSessions as { id: string }[] | null
    if (sessions && sessions.length > 0) {
      await supabase.from("user_sessions").delete().eq("id", sessions[0].id)
    }
  }

  // Generate session token
  const tokenArray = new Uint8Array(32)
  crypto.getRandomValues(tokenArray)
  const sessionToken = Array.from(tokenArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const trustedUntil = options?.trusted
    ? new Date(Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000)
    : undefined

  const { data, error } = await supabase
    .from("user_sessions")
    .insert({
      user_id: userId,
      session_token: sessionToken,
      device_fingerprint: deviceInfo.fingerprint,
      device_name: deviceInfo.name,
      device_type: deviceInfo.type,
      ip_address: ipAddress,
      user_agent: userAgent,
      location: options?.location,
      mfa_verified: options?.mfaVerified ?? false,
      trusted: options?.trusted ?? false,
      trusted_until: trustedUntil?.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("id, created_at")
    .single()

  if (error || !data) {
    console.error("[MFA] Failed to create session:", error?.message)
    return null
  }

  const typedData = data as { id: string; created_at: string }

  return {
    id: typedData.id,
    userId,
    sessionToken,
    deviceFingerprint: deviceInfo.fingerprint,
    deviceName: deviceInfo.name,
    deviceType: deviceInfo.type,
    ipAddress,
    userAgent,
    location: options?.location,
    mfaVerified: options?.mfaVerified ?? false,
    trusted: options?.trusted ?? false,
    trustedUntil,
    expiresAt,
    createdAt: new Date(typedData.created_at),
    lastActiveAt: new Date(),
  }
}

/**
 * Validate session token
 */
export async function validateSession(sessionToken: string): Promise<UserSession | null> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const session = data as {
    id: string
    user_id: string
    session_token: string
    device_fingerprint: string
    device_name: string
    device_type: "desktop" | "mobile" | "tablet" | "unknown"
    ip_address: string
    user_agent: string
    location: string
    mfa_verified: boolean
    trusted: boolean
    trusted_until: string
    expires_at: string
    created_at: string
    last_active_at: string
  }

  // Check expiration
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("user_sessions").delete().eq("id", session.id)
    return null
  }

  return {
    id: session.id,
    userId: session.user_id,
    sessionToken: session.session_token,
    deviceFingerprint: session.device_fingerprint,
    deviceName: session.device_name,
    deviceType: session.device_type,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    location: session.location,
    mfaVerified: session.mfa_verified,
    trusted: session.trusted,
    trustedUntil: session.trusted_until ? new Date(session.trusted_until) : undefined,
    expiresAt: new Date(session.expires_at),
    createdAt: new Date(session.created_at),
    lastActiveAt: new Date(session.last_active_at),
  }
}

/**
 * Check if MFA is required for user
 */
export async function isMFARequired(userId: string): Promise<boolean> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("mfa_settings")
    .select("webauthn_enabled, totp_enabled, email_otp_enabled, enforcement_level")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return false
  }

  const settings = data as {
    webauthn_enabled: boolean
    totp_enabled: boolean
    email_otp_enabled: boolean
    enforcement_level: "optional" | "required" | "admin_bypass"
  }

  const mfaEnabled = settings.webauthn_enabled || settings.totp_enabled || settings.email_otp_enabled
  return mfaEnabled && settings.enforcement_level === "required"
}

/**
 * Check if user has any MFA method enabled
 */
export async function userHasMFAEnabled(userId: string): Promise<boolean> {
  const supabase = getServiceClient()

  const { data, error } = await supabase.rpc("user_has_mfa_enabled", {
    user_uuid: userId,
  })

  if (error) {
    console.error("[MFA] Error checking MFA status:", error.message)
    return false
  }

  return data ?? false
}

/**
 * Get user's active MFA method
 */
export async function getUserMFAMethod(userId: string): Promise<string | null> {
  const supabase = getServiceClient()

  const { data, error } = await supabase.rpc("get_user_mfa_method", {
    user_uuid: userId,
  })

  if (error) {
    console.error("[MFA] Error getting MFA method:", error.message)
    return null
  }

  return data
}

/**
 * Check if device is trusted
 */
export async function isTrustedDevice(userId: string, fingerprint: string): Promise<boolean> {
  const supabase = getServiceClient()

  const { data, error } = await supabase.rpc("is_trusted_device", {
    user_uuid: userId,
    fingerprint,
  })

  if (error) {
    console.error("[MFA] Error checking trusted device:", error.message)
    return false
  }

  return data ?? false
}

/**
 * Trust a device (mark as trusted for 30 days)
 */
export async function trustDevice(
  sessionToken: string,
  fingerprint: string
): Promise<boolean> {
  const supabase = getServiceClient()
  const trustedUntil = new Date(Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from("user_sessions")
    .update({
      trusted: true,
      trusted_until: trustedUntil.toISOString(),
      device_fingerprint: fingerprint,
    })
    .eq("session_token", sessionToken)

  if (error) {
    console.error("[MFA] Error trusting device:", error.message)
    return false
  }

  return true
}

/**
 * Get user's active sessions
 */
export async function getUserActiveSessions(userId: string): Promise<UserSession[]> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("expires_at", new Date().toISOString())
    .order("last_active_at", { ascending: false })

  if (error || !data) {
    return []
  }

  const sessions = data as Array<{
    id: string
    user_id: string
    session_token: string
    device_fingerprint: string
    device_name: string
    device_type: "desktop" | "mobile" | "tablet" | "unknown"
    ip_address: string
    user_agent: string
    location: string
    mfa_verified: boolean
    trusted: boolean
    trusted_until: string
    expires_at: string
    created_at: string
    last_active_at: string
  }>

  return sessions.map((s) => ({
    id: s.id,
    userId: s.user_id,
    sessionToken: s.session_token,
    deviceFingerprint: s.device_fingerprint,
    deviceName: s.device_name,
    deviceType: s.device_type,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    location: s.location,
    mfaVerified: s.mfa_verified,
    trusted: s.trusted,
    trustedUntil: s.trusted_until ? new Date(s.trusted_until) : undefined,
    expiresAt: new Date(s.expires_at),
    createdAt: new Date(s.created_at),
    lastActiveAt: new Date(s.last_active_at),
  }))
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string, userId: string): Promise<boolean> {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from("user_sessions")
    .delete()
    .match({ id: sessionId, user_id: userId })

  return !error
}

/**
 * Revoke all sessions except current
 */
export async function revokeOtherSessions(
  currentSessionToken: string,
  userId: string
): Promise<boolean> {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from("user_sessions")
    .delete()
    .eq("user_id", userId)
    .neq("session_token", currentSessionToken)

  return !error
}

// Export configuration
export const MFA_CONFIG = {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
  OTP_RATE_LIMIT_WINDOW_MINUTES,
  TRUSTED_DEVICE_DAYS,
  MAX_CONCURRENT_SESSIONS,
} as const
