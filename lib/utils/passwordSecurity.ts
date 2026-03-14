// ============================================
// PASSWORD SECURITY UTILS
// Checks password strength and breach status
// via HaveIBeenPwned API (k-anonymity model)
// No full password ever sent to external API
// ============================================

// Minimum password requirements
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: "weak" | "fair" | "strong" | "very-strong"
  score: number
}

export function validatePasswordStrength(
  password: string
): PasswordValidation {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters")
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push("Must contain at least one uppercase letter")
  } else {
    score += 1
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push("Must contain at least one lowercase letter")
  } else {
    score += 1
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push("Must contain at least one number")
  } else {
    score += 1
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Must contain at least one special character")
  } else {
    score += 2
  }

  // Common passwords check
  const commonPasswords = [
    "password", "123456", "password123",
    "admin", "letmein", "qwerty", "abc123",
    "monkey", "1234567890", "superman",
    "iloveyou", "sunshine", "princess",
    "welcome", "shadow", "master",
  ]

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common")
    score = 0
  }

  const strength =
    score <= 2 ? "weak"
    : score <= 4 ? "fair"
    : score <= 5 ? "strong"
    : "very-strong"

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  }
}

// Check password against HaveIBeenPwned
// Uses k-anonymity — only first 5 chars of
// SHA1 hash sent, never the full password
export async function checkPasswordBreached(
  password: string
): Promise<{ breached: boolean; count: number }> {
  try {
    // Create SHA1 hash of password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest(
      "SHA-1",
      data
    )
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()

    // Only send first 5 chars (k-anonymity)
    const prefix = hashHex.slice(0, 5)
    const suffix = hashHex.slice(5)

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "Add-Padding": "true",
        },
      }
    )

    if (!response.ok) {
      // Fail open — don't block if API unavailable
      return { breached: false, count: 0 }
    }

    const text = await response.text()
    const lines = text.split("\n")

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":")
      if (hashSuffix?.trim() === suffix) {
        const count = parseInt(countStr?.trim() ?? "0", 10)
        return { breached: true, count }
      }
    }

    return { breached: false, count: 0 }
  } catch {
    // Fail open if network error
    return { breached: false, count: 0 }
  }
}

// Combined validation for use in server actions
export async function validatePassword(
  password: string
): Promise<{
  valid: boolean
  errors: string[]
}> {
  // Step 1: strength validation (sync, fast)
  const strengthResult = validatePasswordStrength(password)

  if (!strengthResult.isValid) {
    return {
      valid: false,
      errors: strengthResult.errors,
    }
  }

  // Step 2: breach check (async, network)
  const breachResult = await checkPasswordBreached(password)

  if (breachResult.breached) {
    return {
      valid: false,
      errors: [
        `This password has appeared in ${breachResult.count.toLocaleString()} data breaches. Please choose a different password.`,
      ],
    }
  }

  return { valid: true, errors: [] }
}
