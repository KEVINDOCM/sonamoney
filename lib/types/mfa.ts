// ============================================
// MFA TYPES - CR-2026-002: PCI DSS 4.0 Compliance
// TypeScript types for WebAuthn/FIDO2 MFA support
// ============================================

/**
 * MFA Settings for a user
 */
export interface MFASettings {
  id: string;
  user_id: string;
  webauthn_enabled: boolean;
  totp_enabled: boolean;
  enforcement_level: 'optional' | 'required' | 'admin_bypass';
  preferred_method: 'webauthn' | 'totp' | null;
  device_count: number;
  last_mfa_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * WebAuthn Credential stored in database
 */
export interface WebAuthnCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: Uint8Array; // bytea in database
  sign_count: number;
  device_name: string;
  device_type: 'platform' | 'cross-platform' | null;
  aaguid: string | null;
  is_backup: boolean;
  is_active: boolean;
  last_used_at: string | null;
  last_verified_at: string;
  registered_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * MFA Verification Session
 */
export interface MFAVerificationSession {
  id: string;
  user_id: string;
  session_token_hash: string;
  challenge: string;
  method: 'webauthn' | 'totp' | 'recovery_code';
  verified: boolean;
  verified_at: string | null;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * MFA Audit Log Entry
 */
export interface MFAAuditLogEntry {
  id: string;
  user_id: string;
  event_type:
    | 'mfa_enabled'
    | 'mfa_disabled'
    | 'mfa_verified'
    | 'mfa_failed'
    | 'webauthn_registered'
    | 'webauthn_removed'
    | 'webauthn_used'
    | 'totp_enabled'
    | 'totp_disabled'
    | 'totp_used'
    | 'recovery_code_used'
    | 'recovery_codes_regenerated'
    | 'mfa_required_blocked';
  method: 'webauthn' | 'totp' | 'recovery_code' | null;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  credential_id: string | null;
  created_at: string;
}

/**
 * WebAuthn Registration Options (from navigator.credentials.create)
 */
export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    residentKey?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  timeout?: number;
  excludeCredentials?: Array<{
    id: string;
    type: 'public-key';
  }>;
}

/**
 * WebAuthn Authentication Options (from navigator.credentials.get)
 */
export interface WebAuthnAuthenticationOptions {
  challenge: string;
  rpId: string;
  allowCredentials: Array<{
    id: string;
    type: 'public-key';
    transports?: Array<'usb' | 'nfc' | 'ble' | 'hybrid' | 'internal'>;
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  timeout?: number;
}

/**
 * WebAuthn Registration Response
 */
export interface WebAuthnRegistrationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    attestationObject: string;
    authenticatorData?: string;
    publicKey?: string;
    publicKeyAlgorithm?: number;
  };
  authenticatorAttachment?: 'platform' | 'cross-platform';
  clientExtensionResults?: Record<string, unknown>;
}

/**
 * WebAuthn Authentication Response
 */
export interface WebAuthnAuthenticationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  authenticatorAttachment?: 'platform' | 'cross-platform';
  clientExtensionResults?: Record<string, unknown>;
}

/**
 * MFA Challenge Response from server
 */
export interface MFAChallengeResponse {
  session_token: string;
  webauthn_options?: WebAuthnAuthenticationOptions;
  // For TOTP, the client generates the code locally
}

/**
 * MFA Verification Request
 */
export interface MFAVerificationRequest {
  session_token: string;
  webauthn_response?: WebAuthnAuthenticationResponse;
  totp_code?: string;
  recovery_code?: string;
}

/**
 * MFA Verification Result
 */
export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  mfa_verified: boolean;
  redirect_url?: string;
}

/**
 * MFA Registration Request for WebAuthn
 */
export interface WebAuthnRegistrationRequest {
  device_name: string;
  is_backup?: boolean;
}

/**
 * MFA Registration Result
 */
export interface MFARegistrationResult {
  success: boolean;
  error?: string;
  credential_id?: string;
}

/**
 * User MFA Status (for UI display)
 */
export interface UserMFAStatus {
  isEnabled: boolean;
  methods: {
    webauthn: boolean;
    totp: boolean;
  };
  devices: Array<{
    id: string;
    name: string;
    type: 'platform' | 'cross-platform' | null;
    isBackup: boolean;
    isActive: boolean;
    lastUsedAt: string | null;
    registeredAt: string;
  }>;
  enforcementLevel: 'optional' | 'required' | 'admin_bypass';
  preferredMethod: 'webauthn' | 'totp' | null;
}

/**
 * MFA Requirement Check Result
 */
export interface MFARequirementCheck {
  required: boolean;
  mfa_enabled: boolean;
  enforcement_level: 'optional' | 'required' | 'admin_bypass';
  action: 'proceed' | 'mfa_required' | 'setup_required';
  redirect_url?: string;
}
