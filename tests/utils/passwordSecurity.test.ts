import { describe, it, expect } from "vitest"
import {
  validatePasswordStrength,
} from "@/lib/utils/passwordSecurity"

describe("passwordSecurity utils", () => {
  describe("validatePasswordStrength", () => {
    it("accepts strong password", () => {
      const result = validatePasswordStrength(
        "Strong@Pass1"
      )
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("rejects password without uppercase", () => {
      const result = validatePasswordStrength(
        "weak@pass1"
      )
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        "Must contain at least one uppercase letter"
      )
    })

    it("rejects password without number", () => {
      const result = validatePasswordStrength(
        "Weak@Pass"
      )
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        "Must contain at least one number"
      )
    })

    it("rejects short password", () => {
      const result = validatePasswordStrength("Ab1@")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        "Password must be at least 8 characters"
      )
    })

    it("rejects common passwords", () => {
      const result =
        validatePasswordStrength("password")
      expect(result.isValid).toBe(false)
    })

    it("returns correct strength levels", () => {
      const weak = validatePasswordStrength("abc")
      expect(weak.strength).toBe("weak")

      const strong = validatePasswordStrength(
        "Strong@Pass123!"
      )
      expect(["strong", "very-strong"]).toContain(
        strong.strength
      )
    })
  })
})
