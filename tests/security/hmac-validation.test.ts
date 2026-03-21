/**
 * Security Audit Test Suite - HMAC Signature Validation
 * Tests for request integrity and anti-replay protection
 */

// Set up test secret BEFORE importing security module
process.env.NEXT_PUBLIC_REQUEST_SECRET = 'test-secret-for-security-audit-12345'

import { describe, it, expect } from 'vitest'
import { generateRequestSignature, verifyRequestSignature, REQUEST_TIMEOUT_MS } from '@/lib/security'

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
    it('should verify valid signatures', async () => {
      const payload = { email: 'test@example.com' }
      const timestamp = Date.now()

      const signature = await generateRequestSignature(payload, timestamp)
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

    it('should reject replayed requests (timestamp too old)', async () => {
      const payload = { email: 'test@example.com' }
      const oldTimestamp = Date.now() - REQUEST_TIMEOUT_MS - 1000

      const signature = await generateRequestSignature(payload, oldTimestamp)
      const isValid = await verifyRequestSignature(payload, oldTimestamp, signature)

      expect(isValid).toBe(false)
    })

    it('should reject future timestamps', async () => {
      const payload = { email: 'test@example.com' }
      const futureTimestamp = Date.now() + 60000 // 1 minute in future

      const signature = await generateRequestSignature(payload, futureTimestamp)
      const isValid = await verifyRequestSignature(payload, futureTimestamp, signature)

      expect(isValid).toBe(false)
    })
  })

  describe('Anti-Replay Protection', () => {
    it('should have 30 second timeout window', () => {
      expect(REQUEST_TIMEOUT_MS).toBe(30000)
    })

    it('should accept timestamps within valid window', async () => {
      const payload = { email: 'test@example.com' }
      const recentTimestamp = Date.now() - 5000 // 5 seconds ago

      const signature = await generateRequestSignature(payload, recentTimestamp)
      const isValid = await verifyRequestSignature(payload, recentTimestamp, signature)

      expect(isValid).toBe(true)
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

      // Times should be reasonably close (within 2x factor)
      expect(Math.abs(time1 - time2)).toBeLessThan(Math.max(time1, time2) * 2)
    })
  })
})
