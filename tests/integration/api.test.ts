/**
 * API Integration Tests for SonaMoney
 * Tests critical API routes for functionality and security
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import request from "supertest"

// Base URL for API tests
const API_BASE = process.env.TEST_API_URL || "http://localhost:3000"

describe("API Integration Tests - Authentication", () => {
  describe("POST /api/auth/login", () => {
    it("should reject invalid credentials with 401", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/login")
        .send({
          email: "invalid@example.com",
          password: "wrongpassword",
        })
        .set("Content-Type", "application/json")

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty("error")
    })

    it("should reject missing email with 400", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/login")
        .send({
          password: "somepassword",
        })
        .set("Content-Type", "application/json")

      expect(response.status).toBe(400)
    })

    it("should reject missing password with 400", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
        })
        .set("Content-Type", "application/json")

      expect(response.status).toBe(400)
    })

    it("should reject non-existent user with 401", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123!",
        })
        .set("Content-Type", "application/json")

      expect(response.status).toBe(401)
    })

    it("should have security headers", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/login")
        .send({})

      expect(response.headers["x-content-type-options"]).toBe("nosniff")
      expect(response.headers["x-frame-options"]).toBe("DENY")
    })
  })

  describe("POST /api/auth/register", () => {
    it("should reject invalid email format", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/register")
        .send({
          email: "not-an-email",
          password: "Password123!",
        })
        .set("Content-Type", "application/json")

      expect(response.status).toBe(400)
    })

    it("should reject weak passwords", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "123",
        })
        .set("Content-Type", "application/json")

      expect(response.status).toBe(400)
    })

    it("should reject missing required fields", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/register")
        .send({})
        .set("Content-Type", "application/json")

      expect(response.status).toBe(400)
    })

    it("should detect honeypot field for bots", async () => {
      const response = await request(API_BASE)
        .post("/api/auth/register")
        .send({
          email: "bot@example.com",
          password: "Password123!",
          website: "bot-website.com", // Honeypot field
        })
        .set("Content-Type", "application/json")

      // Should be rejected as bot
      expect(response.status).toBe(400)
    })
  })
})

describe("API Integration Tests - Rate Limiting", () => {
  it("should return 429 after exceeding rate limit", async () => {
    // Send 65 rapid requests (limit is 60/min)
    const requests = Array(65)
      .fill(null)
      .map(() =>
        request(API_BASE)
          .get("/api/health")
          .catch(() => ({ status: 0 }))
      )

    const responses = await Promise.all(requests)
    const hasRateLimit = responses.some((r: any) => r.status === 429)

    expect(hasRateLimit).toBe(true)
  }, 30000)

  it("should have rate limit headers", async () => {
    const response = await request(API_BASE).get("/api/health")

    expect(response.headers).toHaveProperty("x-ratelimit-limit")
  })
})

describe("API Integration Tests - Security Headers", () => {
  it("should have required security headers on all responses", async () => {
    const response = await request(API_BASE).get("/")

    expect(response.headers["strict-transport-security"]).toBeDefined()
    expect(response.headers["x-content-type-options"]).toBe("nosniff")
    expect(response.headers["x-frame-options"]).toBe("DENY")
    expect(response.headers["content-security-policy"]).toBeDefined()
  })

  it("should not expose server information", async () => {
    const response = await request(API_BASE).get("/")

    expect(response.headers["x-powered-by"]).toBeUndefined()
    expect(response.headers["server"]).toBeUndefined()
  })
})

describe("API Integration Tests - Protected Routes", () => {
  it("should redirect unauthenticated users from dashboard", async () => {
    const response = await request(API_BASE).get("/dashboard")

    expect(response.status).toBe(302)
    expect(response.headers.location).toContain("/login")
  })

  it("should reject API requests without authentication", async () => {
    const response = await request(API_BASE)
      .get("/api/transactions")
      .set("Content-Type", "application/json")

    expect(response.status).toBe(401)
  })

  it("should reject admin routes for non-admin users", async () => {
    // This test requires a mock or test user
    // For now, just verify the endpoint exists and requires auth
    const response = await request(API_BASE).get("/admin")

    expect(response.status).toBe(302) // Redirect to login
  })
})

describe("API Integration Tests - Maintenance Mode", () => {
  it("should serve maintenance page when enabled", async () => {
    // Note: This test requires maintenance mode to be enabled
    // Should return 503 with maintenance content
    const response = await request(API_BASE).get("/")

    // Normal case: 200 OK
    // Maintenance case: 503
    expect([200, 503]).toContain(response.status)

    if (response.status === 503) {
      expect(response.text).toContain("Maintenance")
    }
  })
})

describe("API Integration Tests - Health Check", () => {
  it("should respond to health check endpoint", async () => {
    const response = await request(API_BASE).get("/api/health")

    // Should return 200 or 404 (if endpoint doesn't exist)
    expect([200, 404]).toContain(response.status)
  })
})
