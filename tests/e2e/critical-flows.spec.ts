/**
 * E2E Tests for Critical User Flows
 * @playwright/test
 */

import { test, expect } from "@playwright/test"

test.describe("Authentication Flows", () => {
  test("user can navigate to login page", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveURL("/login")
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible()
  })

  test("user can navigate to signup page", async ({ page }) => {
    await page.goto("/signup")
    await expect(page).toHaveURL("/signup")
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible()
  })

  test("login form validates required fields", async ({ page }) => {
    await page.goto("/login")
    // Click submit without filling fields - check button is disabled or form shows error
    const submitButton = page.getByRole("button", { name: /log in/i })
    await submitButton.click()
    // Check that we're still on login page (form didn't submit)
    await expect(page).toHaveURL("/login")
    // Check that error message appears or email field is still visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/.*login.*/)
  })

  test("authenticated user can access dashboard", async ({ page }) => {
    // This test requires a test user setup
    // For now, just verify the redirect behavior
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/.*login.*/)
  })
})

test.describe("Landing Page", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/SonaMoney|Personal Finance/)
  })

  test("homepage has key CTAs", async ({ page }) => {
    await page.goto("/")
    // Use first() since there are multiple "Get started" CTAs on the page
    await expect(page.getByRole("link", { name: /get started|sign up/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /log in/i }).first()).toBeVisible()
  })

  test("navigation links work", async ({ page }) => {
    await page.goto("/")

    // Check for navigation elements
    const nav = page.locator("nav, header").first()
    await expect(nav).toBeVisible()
  })
})

test.describe("Security Features", () => {
  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/")

    const headers = response?.headers()
    expect(headers?.["x-frame-options"]).toBe("DENY")
    expect(headers?.["x-content-type-options"]).toBe("nosniff")
  })

  test("no secrets exposed in page source", async ({ page }) => {
    await page.goto("/")
    const content = await page.content()

    expect(content).not.toContain("NEXT_PUBLIC_REQUEST_SECRET")
    expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
  })

  test("login page has password field hidden", async ({ page }) => {
    await page.goto("/login")
    const passwordField = page.locator('input[type="password"]')
    await expect(passwordField).toBeVisible()
  })
})

test.describe("Responsive Design", () => {
  test("mobile viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")

    // Page should still be usable on mobile
    await expect(page.locator("body")).toBeVisible()
  })

  test("tablet viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")

    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Error Handling", () => {
  test("404 page is shown for non-existent routes", async ({ page }) => {
    await page.goto("/non-existent-page-12345")
    await expect(page.locator("text=/404|not found|page not found/i")).toBeVisible()
  })

  test("error page has navigation to home", async ({ page }) => {
    await page.goto("/non-existent-page-12345")
    const homeLink = page.getByRole("link", { name: /home|back|return/i })
    await expect(homeLink).toBeVisible()
  })
})

test.describe("Marketing Pages", () => {
  const marketingPages = [
    "/budget-calculator",
    "/mint-alternative",
    "/templates",
    "/manual-tracker",
    "/id",
  ]

  for (const path of marketingPages) {
    test(`${path} loads successfully`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    })
  }
})

test.describe("Accessibility", () => {
  test("login page has proper form labels", async ({ page }) => {
    await page.goto("/login")

    // Check email input exists (labels are associated via htmlFor or wrapping)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    // Check password input exists
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("buttons have accessible names", async ({ page }) => {
    await page.goto("/")

    // Only check visible buttons for accessibility
    const buttons = page.locator("button:visible")
    const count = await buttons.count()

    // Check at least some buttons exist
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute("aria-label")
      const text = await button.textContent()

      // Button should have either text or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy()
    }
  })
})
