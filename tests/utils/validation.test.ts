import { describe, it, expect } from "vitest"
import {
  uuidSchema,
  amountSchema,
  dateSchema,
  loginSchema,
  signupSchema,
  validateOrThrow,
} from "@/lib/utils/validation"

describe("validation utils", () => {
  describe("uuidSchema", () => {
    it("accepts valid UUID", () => {
      const result = uuidSchema.safeParse(
        "123e4567-e89b-12d3-a456-426614174000"
      )
      expect(result.success).toBe(true)
    })

    it("rejects invalid UUID", () => {
      const result = uuidSchema.safeParse("not-a-uuid")
      expect(result.success).toBe(false)
    })
  })

  describe("amountSchema", () => {
    it("accepts positive number", () => {
      const result = amountSchema.safeParse(100)
      expect(result.success).toBe(true)
    })

    it("rejects negative number", () => {
      const result = amountSchema.safeParse(-100)
      expect(result.success).toBe(false)
    })

    it("rejects zero", () => {
      const result = amountSchema.safeParse(0)
      expect(result.success).toBe(false)
    })

    it("rejects infinity", () => {
      const result = amountSchema.safeParse(Infinity)
      expect(result.success).toBe(false)
    })
  })

  describe("dateSchema", () => {
    it("accepts valid date format", () => {
      const result = dateSchema.safeParse("2024-01-15")
      expect(result.success).toBe(true)
    })

    it("rejects invalid format", () => {
      const result = dateSchema.safeParse("15-01-2024")
      expect(result.success).toBe(false)
    })

    it("rejects empty string", () => {
      const result = dateSchema.safeParse("")
      expect(result.success).toBe(false)
    })
  })

  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("signupSchema", () => {
    it("accepts strong password", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "Strong@Pass1",
      })
      expect(result.success).toBe(true)
    })

    it("rejects weak password (no uppercase)", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "weakpassword1@",
      })
      expect(result.success).toBe(false)
    })

    it("rejects short password", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "Ab1@",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("validateOrThrow", () => {
    it("returns data on success", () => {
      const result = validateOrThrow(
        amountSchema,
        100
      )
      expect(result).toBe(100)
    })

    it("throws on invalid data", () => {
      expect(() =>
        validateOrThrow(amountSchema, -1)
      ).toThrow()
    })
  })
})
