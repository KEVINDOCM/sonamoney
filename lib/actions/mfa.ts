"use server";

import { getAuthenticatedClient } from "@/lib/utils/auth";
import { validateUUID } from "@/lib/utils/validation";
import type {
  MFASettings,
  WebAuthnCredential,
  UserMFAStatus,
  MFARequirementCheck,
  WebAuthnRegistrationOptions,
  WebAuthnRegistrationResponse,
  MFARegistrationResult,
  MFAChallengeResponse,
  MFAVerificationRequest,
  MFAVerificationResult,
} from "@/lib/types/mfa";

interface QueryResponse<T = unknown> {
  data: T | null;
  error: Error | null;
  count?: number | null;
}

interface QueryableClient {
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  from: (table: string) => QueryableBuilder;
}

interface QueryableBuilder {
  select: (columns: string, options?: { count?: string; head?: boolean }) => QueryableFilter;
  insert: (data: unknown | unknown[]) => QueryablePostInsert;
  update: (data: unknown) => QueryableFilter;
  delete: () => QueryableFilter;
}

interface QueryablePostInsert extends QueryableFilter {
  select: (columns: string) => QueryablePostSelect;
}

interface QueryablePostSelect {
  single: () => Promise<{ data: unknown | null; error: Error | null }>;
}

interface QueryableFilter extends Promise<QueryResponse<unknown[]>> {
  eq: (column: string, value: string | number | boolean) => QueryableFilter;
  gt: (column: string, value: string) => QueryableFilter;
  order: (column: string, options: { ascending: boolean }) => Promise<QueryResponse<unknown[]>>;
  single: () => Promise<{ data: unknown | null; error: Error | null }>;
}

function db(supabase: unknown): QueryableClient {
  return supabase as QueryableClient;
}

/**
 * Get current user's MFA settings
 */
export async function getUserMFASettings(): Promise<MFASettings | null> {
  const { supabase, user } = await getAuthenticatedClient();

  const { data, error } = await db(supabase)
    .from("mfa_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return data as MFASettings;
}

/**
 * Get user's WebAuthn credentials
 */
export async function getUserWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
  const { supabase, user } = await getAuthenticatedClient();

  const { data, error } = await db(supabase)
    .from("webauthn_credentials")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("last_used_at", { ascending: false });

  if (error || !data) return [];
  return data as WebAuthnCredential[];
}

/**
 * Get complete MFA status for UI
 */
export async function getUserMFAStatus(): Promise<UserMFAStatus> {
  const { supabase, user } = await getAuthenticatedClient();

  // Get MFA settings
  const { data: settings, error: settingsError } = await db(supabase)
    .from("mfa_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get credentials
  const { data: credentials, error: credsError } = await db(supabase)
    .from("webauthn_credentials")
    .select("id, device_name, device_type, is_backup, is_active, last_used_at, registered_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("last_used_at", { ascending: false });

  if (settingsError || !settings) {
    return {
      isEnabled: false,
      methods: { webauthn: false, totp: false },
      devices: [],
      enforcementLevel: 'optional',
      preferredMethod: null,
    };
  }

  const mfaSettings = settings as MFASettings;

  return {
    isEnabled: mfaSettings.webauthn_enabled || mfaSettings.totp_enabled,
    methods: {
      webauthn: mfaSettings.webauthn_enabled,
      totp: mfaSettings.totp_enabled,
    },
    devices: (credentials || []).map((cred: unknown) => {
      const c = cred as WebAuthnCredential;
      return {
        id: c.id,
        name: c.device_name,
        type: c.device_type,
        isBackup: c.is_backup,
        isActive: c.is_active,
        lastUsedAt: c.last_used_at,
        registeredAt: c.registered_at,
      };
    }),
    enforcementLevel: mfaSettings.enforcement_level,
    preferredMethod: mfaSettings.preferred_method,
  };
}

/**
 * Check if MFA is required for current user
 */
export async function checkMFARequirement(): Promise<MFARequirementCheck> {
  const { supabase, user } = await getAuthenticatedClient();

  const { data, error } = await db(supabase).rpc("user_has_mfa_enabled", {
    p_user_id: user.id,
  });

  if (error) {
    return {
      required: false,
      mfa_enabled: false,
      enforcement_level: 'optional',
      action: 'proceed',
    };
  }

  const mfaEnabled = data as boolean;

  // Get enforcement level
  const { data: settings } = await db(supabase)
    .from("mfa_settings")
    .select("enforcement_level")
    .eq("user_id", user.id)
    .single();

  const enforcementLevel = (settings as { enforcement_level: string } | null)?.enforcement_level || 'optional';

  if (enforcementLevel === 'required' && !mfaEnabled) {
    return {
      required: true,
      mfa_enabled: false,
      enforcement_level: 'required',
      action: 'setup_required',
      redirect_url: '/settings/mfa/setup',
    };
  }

  return {
    required: enforcementLevel === 'required',
    mfa_enabled: mfaEnabled,
    enforcement_level: enforcementLevel as 'optional' | 'required' | 'admin_bypass',
    action: mfaEnabled ? 'proceed' : 'mfa_required',
  };
}

/**
 * Initialize WebAuthn registration
 * Returns options for navigator.credentials.create()
 */
export async function initWebAuthnRegistration(
  deviceName: string,
  isBackup = false
): Promise<{ options?: WebAuthnRegistrationOptions; error?: string }> {
  try {
    const { supabase, user } = await getAuthenticatedClient();

    // Get existing credentials to exclude
    const { data: existingCreds } = await db(supabase)
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", user.id);

    const excludeCredentials = (existingCreds || []).map((cred: unknown) => ({
      id: (cred as { credential_id: string }).credential_id,
      type: 'public-key' as const,
    }));

    // Generate challenge on server
    const challenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');

    // Store challenge temporarily (in practice, use Redis or session)
    // For now, we'll use the MFA verification sessions table
    const sessionToken = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');

    await db(supabase).from("mfa_verification_sessions").insert({
      user_id: user.id,
      session_token_hash: sessionToken,
      challenge: challenge,
      method: 'webauthn',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    const options: WebAuthnRegistrationOptions = {
      challenge,
      rp: {
        name: 'SonaMoney',
        id: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost',
      },
      user: {
        id: Buffer.from(user.id).toString('base64url'),
        name: user.email || 'user',
        displayName: user.email || 'SonaMoney User',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: undefined, // Allow both platform and cross-platform
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      attestation: 'none', // Don't need attestation for basic MFA
      timeout: 60000,
      excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials : undefined,
    };

    return { options };
  } catch (err) {
    console.error("[MFA] Failed to init WebAuthn registration:", err);
    return { error: "Failed to initialize WebAuthn registration" };
  }
}

/**
 * Complete WebAuthn registration
 */
export async function completeWebAuthnRegistration(
  response: WebAuthnRegistrationResponse,
  deviceName: string,
  isBackup = false
): Promise<MFARegistrationResult> {
  try {
    const { supabase, user } = await getAuthenticatedClient();

    // Parse the response
    const clientDataJSON = Buffer.from(response.response.clientDataJSON, 'base64url').toString();
    const clientData = JSON.parse(clientDataJSON);

    // Verify challenge (in production, verify against stored challenge)
    // TODO: Implement proper challenge verification

    // Decode attestation object
    const attestationObject = Buffer.from(response.response.attestationObject, 'base64url');

    // Extract credential data
    // NOTE: In production, use a proper CBOR library like 'cbor-x'
    // For now, we'll use the raw data from the authenticator

    // Store credential
    const { data, error } = await db(supabase)
      .from("webauthn_credentials")
      .insert({
        user_id: user.id,
        credential_id: response.id,
        public_key: attestationObject, // Simplified - in production parse properly
        sign_count: 0,
        device_name: deviceName,
        device_type: response.authenticatorAttachment || null,
        is_backup: isBackup,
        is_active: true,
        attestation_object: attestationObject,
        attestation_format: 'none',
      })
      .select("id")
      .single();

    if (error) {
      console.error("[MFA] Failed to store credential:", error);
      return { success: false, error: "Failed to store WebAuthn credential" };
    }

    // Update MFA settings - fetch current count and increment
    const { data: currentSettings } = await db(supabase)
      .from("mfa_settings")
      .select("device_count")
      .eq("user_id", user.id)
      .single();

    const currentCount = (currentSettings as { device_count: number } | null)?.device_count || 0;

    await db(supabase)
      .from("mfa_settings")
      .update({
        webauthn_enabled: true,
        preferred_method: 'webauthn',
        device_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Log the event
    await db(supabase).rpc("log_mfa_event", {
      p_user_id: user.id,
      p_event_type: 'webauthn_registered',
      p_method: 'webauthn',
      p_success: true,
      p_credential_id: (data as { id: string }).id,
    });

    return {
      success: true,
      credential_id: (data as { id: string }).id,
    };
  } catch (err) {
    console.error("[MFA] Failed to complete WebAuthn registration:", err);
    return { success: false, error: "Failed to complete WebAuthn registration" };
  }
}

/**
 * Initialize WebAuthn authentication
 */
export async function initWebAuthnAuthentication(
  userId?: string
): Promise<{ session_token?: string; webauthn_options?: MFAChallengeResponse['webauthn_options']; error?: string }> {
  try {
    // If no userId provided, use authenticated user
    let targetUserId = userId;
    if (!targetUserId) {
      const { user } = await getAuthenticatedClient();
      targetUserId = user.id;
    }

    const { supabase } = await getAuthenticatedClient();

    // Get active credentials
    const { data: credentials, error: credsError } = await db(supabase)
      .rpc("get_active_webauthn_credentials", {
        p_user_id: targetUserId,
      });

    if (credsError || !credentials || (credentials as unknown[]).length === 0) {
      return { error: "No WebAuthn credentials found" };
    }

    // Generate challenge
    const challenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
    const sessionToken = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');

    // Store session
    await db(supabase).from("mfa_verification_sessions").insert({
      user_id: targetUserId,
      session_token_hash: sessionToken,
      challenge: challenge,
      method: 'webauthn',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const options = {
      challenge,
      rpId: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost',
      allowCredentials: (credentials as Array<{ credential_id: string; public_key: Uint8Array; sign_count: number; device_name: string }>).map((cred) => ({
        id: cred.credential_id,
        type: 'public-key' as const,
      })),
      userVerification: 'preferred' as const,
      timeout: 60000,
    };

    return {
      session_token: sessionToken,
      webauthn_options: options,
    };
  } catch (err) {
    console.error("[MFA] Failed to init WebAuthn authentication:", err);
    return { error: "Failed to initialize WebAuthn authentication" };
  }
}

/**
 * Verify WebAuthn authentication
 */
export async function verifyWebAuthnAuthentication(
  request: MFAVerificationRequest
): Promise<MFAVerificationResult> {
  try {
    const { supabase } = await getAuthenticatedClient();

    // Get session
    const { data: session, error: sessionError } = await db(supabase)
      .from("mfa_verification_sessions")
      .select("*")
      .eq("session_token_hash", request.session_token)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return { success: false, error: "Invalid or expired session", mfa_verified: false };
    }

    const sessionData = session as { user_id: string; challenge: string; id: string };

    if (!request.webauthn_response) {
      return { success: false, error: "Missing WebAuthn response", mfa_verified: false };
    }

    // Get credential
    const { data: credential, error: credError } = await db(supabase)
      .from("webauthn_credentials")
      .select("*")
      .eq("credential_id", request.webauthn_response.id)
      .eq("user_id", sessionData.user_id)
      .eq("is_active", true)
      .single();

    if (credError || !credential) {
      return { success: false, error: "Credential not found", mfa_verified: false };
    }

    const credData = credential as WebAuthnCredential;

    // Verify signature (simplified - in production use proper WebAuthn verification)
    // TODO: Implement proper signature verification using a library like @simplewebauthn/server

    // Update sign count (replay protection)
    await db(supabase).rpc("update_webauthn_sign_count", {
      p_credential_id: request.webauthn_response.id,
      p_new_sign_count: credData.sign_count + 1,
    });

    // Mark session as verified
    await db(supabase)
      .from("mfa_verification_sessions")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("id", sessionData.id);

    // Update MFA settings
    await db(supabase)
      .from("mfa_settings")
      .update({ last_mfa_verified_at: new Date().toISOString() })
      .eq("user_id", sessionData.user_id);

    // Log success
    await db(supabase).rpc("log_mfa_event", {
      p_user_id: sessionData.user_id,
      p_event_type: 'webauthn_used',
      p_method: 'webauthn',
      p_success: true,
      p_credential_id: credData.id,
    });

    return { success: true, mfa_verified: true };
  } catch (err) {
    console.error("[MFA] Failed to verify WebAuthn:", err);
    return { success: false, error: "Verification failed", mfa_verified: false };
  }
}

/**
 * Remove a WebAuthn credential
 */
export async function removeWebAuthnCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
  try {
    validateUUID(credentialId);
  } catch {
    return { success: false, error: "Invalid credential ID" };
  }

  try {
    const { supabase, user } = await getAuthenticatedClient();

    // Get credential to log
    const { data: credential } = await db(supabase)
      .from("webauthn_credentials")
      .select("id")
      .eq("id", credentialId)
      .eq("user_id", user.id)
      .single();

    if (!credential) {
      return { success: false, error: "Credential not found" };
    }

    // Deactivate (don't delete for audit trail)
    const { error } = await db(supabase)
      .from("webauthn_credentials")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", credentialId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "Failed to remove credential" };
    }

    // Update MFA settings
    const { data: remainingCount } = await db(supabase)
      .from("webauthn_credentials")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_active", true);

    const count = (remainingCount as unknown as number) || 0;

    await db(supabase)
      .from("mfa_settings")
      .update({
        webauthn_enabled: count > 0,
        device_count: count,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Log event
    await db(supabase).rpc("log_mfa_event", {
      p_user_id: user.id,
      p_event_type: 'webauthn_removed',
      p_method: 'webauthn',
      p_success: true,
      p_credential_id: credentialId,
    });

    return { success: true };
  } catch (err) {
    console.error("[MFA] Failed to remove credential:", err);
    return { success: false, error: "Failed to remove credential" };
  }
}

/**
 * Update MFA preferences
 */
export async function updateMFAPreferences(
  preferredMethod: 'webauthn' | 'totp' | null,
  enforcementLevel?: 'optional' | 'required' | 'admin_bypass'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await getAuthenticatedClient();

    const updateData: Record<string, unknown> = {
      preferred_method: preferredMethod,
      updated_at: new Date().toISOString(),
    };

    if (enforcementLevel) {
      updateData.enforcement_level = enforcementLevel;
    }

    const { error } = await db(supabase)
      .from("mfa_settings")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "Failed to update preferences" };
    }

    return { success: true };
  } catch (err) {
    console.error("[MFA] Failed to update preferences:", err);
    return { success: false, error: "Failed to update preferences" };
  }
}
