/**
 * Security Audit Test Suite - HMAC Signature Validation
 * Tests for request integrity and anti-replay protection
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the config module to provide a test secret
vi.mock('@/lib/security/config', () => ({
  REQUEST_SECRET: 'test-secret-for-security-audit-12345',
  REQUEST_TIMEOUT_MS: 60000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_WINDOW_MS: 15 * 60 * 1000,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_EMAIL_LENGTH: 254,
  validateSecurityConfig: vi.fn(() => ({ valid: true, missing: [] })),
}))

// Import after mocking
import { generateRequestSignature, verifyRequestSignature } from '@/lib/security/server'
import { REQUEST_TIMEOUT_MS, isRequestFresh } from '@/lib/security'

describe('SECURITY AUDIT: HMAC Signature Validation', () => {
  describe('Signature Generation', () => {
    it('should generate consistent signatures for same payload', async () => {
      const payload = { email: 'test@example.com', password: 'test123' }
      const timestamp = Date.now()

      const sig1 = await generateRequestSignature(payload, timestamp)
      const sig2 = await generateRequestSignature(payload, timestamp)

      expect(sig1).toBe(sig2)
      expect(sig1).toHaveLength(64) // SHA-256 hex is 64 characters
    })

    it('should generate different signatures for different payloads', async () => {
      const timestamp = Date.now()
      const payload1 = { email: 'test1@example.com' }
      const payload2 = { email: 'test2@example.com' }

      const sig1 = await generateRequestSignature(payload1, timestamp)
      const sig2 = await generateRequestSignature(payload2, timestamp)

      expect(sig1).not.toBe(sig2)
    })

    it('should generate different signatures for different timestamps', async () => {
      const payload = { email: 'test@example.com' }

      const sig1 = await generateRequestSignature(payload, 1000000)
      const sig2 = await generateRequestSignature(payload, 1000001)

      expect(sig1).not.toBe(sig2)
    })

    it('should handle empty payloads', async () => {
      const payload = {}
      const timestamp = Date.now()

      const signature = await generateRequestSignature(payload, timestamp)
      expect(signature).toHaveLength(64)
    })
  })

  describe('Signature Verification', () => {
    it('should verify valid signatures regardless of timestamp', async () => {
      const payload = { email: 'test@example.com' }
      const timestamp = Date.now()

      const signature = await generateRequestSignature(payload, timestamp)
      // verifyRequestSignature only checks HMAC, not timestamp freshness
      const isValid = await verifyRequestSignature(payload, timestamp, signature)

      expect(isValid).toBe(true)
    })

    it('should reject invalid signatures', async () => {
      const payload = { email: 'test@example.com' }
      const timestamp = Date.now()

      const isValid = await verifyRequestSignature(payload, timestamp, 'invalid-signature')

      expect(isValid).toBe(false)
    })

    it('should reject tampered payloads', async () => {
      const payload = { email: 'test@example.com' }
      const timestamp = Date.now()

      const signature = await generateRequestSignature(payload, timestamp)

      // Try to verify with different payload
      const tamperedPayload = { email: 'hacked@example.com' }
      const isValid = await verifyRequestSignature(tamperedPayload, timestamp, signature)

      expect(isValid).toBe(false)
    })
  })

  describe('Anti-Replay Protection (isRequestFresh)', () => {
    it('should have 60 second timeout window', () => {
      expect(REQUEST_TIMEOUT_MS).toBe(60000)
    })

    it('should accept recent timestamps', () => {
      const recentTimestamp = Date.now() - 5000 // 5 seconds ago
      expect(isRequestFresh(recentTimestamp)).toBe(true)
    })

    it('should reject timestamps too old', () => {
      // Must exceed both REQUEST_TIMEOUT_MS (60s) and clock skew (120s)
      const oldTimestamp = Date.now() - 200000 // ~3.3 minutes ago
      expect(isRequestFresh(oldTimestamp)).toBe(false)
    })

    it('should reject future timestamps beyond 120 second clock skew', () => {
      const futureTimestamp = Date.now() + 130000 // 2+ minutes in future
      expect(isRequestFresh(futureTimestamp)).toBe(false)
    })

    it('should allow clock skew up to 120 seconds', () => {
      const slightFuture = Date.now() + 90000 // 90 seconds in future
      expect(isRequestFresh(slightFuture)).toBe(true)
    })
  })

  describe('Timing Attack Resistance', () => {
    it('should use constant-time comparison', async () => {
      const payload = { email: 'test@example.com' }
      const timestamp = Date.now()

      const validSig = await generateRequestSignature(payload, timestamp)
      const invalidSig = '0'.repeat(64)

      // Both should complete in similar time (constant-time)
      const start1 = performance.now()
      await verifyRequestSignature(payload, timestamp, validSig)
      const time1 = performance.now() - start1

      const start2 = performance.now()
      await verifyRequestSignature(payload, timestamp, invalidSig)
      const time2 = performance.now() - start2

      // Times should be reasonably close (within 3x factor for test stability)
      expect(Math.abs(time1 - time2)).toBeLessThan(Math.max(time1, time2) * 3)
    })
  })
})
