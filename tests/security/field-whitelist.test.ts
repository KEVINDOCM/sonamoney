/**
 * Security Audit Test Suite - Field Whitelisting
 * Tests for mass assignment vulnerability prevention
 */

import { describe, it, expect } from 'vitest'
import { whitelistFields, TransactionWhitelist, AuthWhitelist } from '@/lib/security'

describe('SECURITY AUDIT: Field Whitelisting', () => {
  describe('Mass Assignment Prevention', () => {
    it('should block forbidden fields like role, is_admin in strict mode', () => {
      const maliciousInput = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        role: 'admin',
        is_admin: true,
        is_superuser: true,
        permissions: ['all'],
      }

      expect(() =>
        whitelistFields(maliciousInput, AuthWhitelist.REGISTER, { strict: true })
      ).toThrow('Forbidden fields detected: role, is_admin, is_superuser, permissions')
    })

    it('should allow only whitelisted fields in non-strict mode', () => {
      const maliciousInput = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        role: 'admin',
        is_admin: true,
      }

      const result = whitelistFields(maliciousInput, AuthWhitelist.REGISTER)

      expect(result).toEqual({
        email: 'user@example.com',
        password: 'SecurePass123!',
      })

      // Verify malicious fields are stripped
      expect(result).not.toHaveProperty('role')
      expect(result).not.toHaveProperty('is_admin')
    })

    it('should validate transaction whitelist for CREATE operations', () => {
      const maliciousTransaction = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        type: 'expense',
        date: '2024-01-15',
        user_id: 'attacker-user-id',
        is_deleted: false,
        is_approved: true,
        admin_notes: 'Hacked',
        role: 'admin',
      }

      expect(() =>
        whitelistFields(maliciousTransaction, TransactionWhitelist.CREATE, { strict: true })
      ).toThrow('Forbidden fields detected: user_id, is_deleted, is_approved, admin_notes, role')
    })

    it('should validate transaction whitelist for UPDATE operations', () => {
      const maliciousUpdate = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        type: 'expense',
        date: '2024-01-15',
        user_id: 'attacker-user-id',
        created_at: '2024-01-01',
      }

      expect(() =>
        whitelistFields(maliciousUpdate, TransactionWhitelist.UPDATE, { strict: true })
      ).toThrow('Forbidden fields detected: user_id, created_at')
    })
  })

  describe('Nested Object Protection', () => {
    it('should handle nested objects with forbidden fields', () => {
      const inputWithNested = {
        email: 'test@test.com',
        password: 'SecurePass123!',
        metadata: {
          role: 'admin',
          is_admin: true,
        },
      }

      // Nested objects with non-whitelist keys should be stripped at top level
      // The whitelist only applies to top-level fields
      const result = whitelistFields(inputWithNested, AuthWhitelist.REGISTER)

      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('password')
      // metadata is not in AuthWhitelist.REGISTER, so it should be stripped
      expect(result).not.toHaveProperty('metadata')
    })
  })

  describe('Empty and Edge Cases', () => {
    it('should handle empty objects', () => {
      const result = whitelistFields({}, AuthWhitelist.LOGIN)
      expect(result).toEqual({})
    })

    it('should handle objects with only forbidden fields', () => {
      const onlyForbidden = {
        role: 'admin',
        is_admin: true,
      }

      expect(() =>
        whitelistFields(onlyForbidden, AuthWhitelist.LOGIN, { strict: true })
      ).toThrow('Forbidden fields detected: role, is_admin')
    })

    it('should handle special characters in field names', () => {
      const trickyInput = {
        email: 'test@test.com',
        'role[0]': 'admin',
        '__proto__': { is_admin: true },
        'constructor': { role: 'superuser' },
      }

      expect(() =>
        whitelistFields(trickyInput, AuthWhitelist.LOGIN, { strict: true })
      ).toThrow()
    })
  })
})
