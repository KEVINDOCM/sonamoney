/**
 * Test Utilities and Helpers
 */

import { createClient } from "@supabase/supabase-js"

// Test configuration
export const TEST_CONFIG = {
  apiUrl: process.env.TEST_API_URL || "http://localhost:3000",
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
}

// Test user credentials (for integration tests)
export const TEST_USERS = {
  valid: {
    email: "test@example.com",
    password: "TestPassword123!",
  },
  admin: {
    email: "admin@test.com",
    password: "AdminPass123!",
  },
  invalid: {
    email: "invalid@example.com",
    password: "wrongpassword",
  },
}

// Create Supabase client for tests
export function createTestClient() {
  if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseAnonKey) {
    throw new Error("Supabase credentials not configured for tests")
  }

  return createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey)
}

// Helper to generate test data
export function generateTestUser() {
  const timestamp = Date.now()
  return {
    email: `test-${timestamp}@example.com`,
    password: `TestPass${timestamp}!`,
  }
}

// Helper to wait for element with retry
export async function waitForElement(
  locator: any,
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 5000, retries = 3 } = options

  for (let i = 0; i < retries; i++) {
    try {
      await locator.waitFor({ timeout: timeout / retries })
      return true
    } catch {
      if (i === retries - 1) throw new Error("Element not found after retries")
    }
  }
  return false
}

// Mock authenticated session for tests
export function createMockSession(userId: string = "test-user-id") {
  return {
    user: {
      id: userId,
      email: "test@example.com",
    },
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
  }
}
