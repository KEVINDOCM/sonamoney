/**
 * Cloudflare Turnstile CAPTCHA Component
 * Privacy-friendly bot protection for login and registration
 */

"use client"

import { useEffect, useRef, useState } from "react"

interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: () => void
  action?: string
}

// Cloudflare Turnstile site key (public)
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: object) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

export function TurnstileWidget({ onVerify, onError, action = "login" }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Check if site key is configured
    if (!TURNSTILE_SITE_KEY) {
      console.warn("[CAPTCHA] Turnstile site key not configured")
      // In development, bypass CAPTCHA
      if (process.env.NODE_ENV === "development") {
        onVerify("dev-bypass-token")
      }
      return
    }

    // Load Turnstile script
    const scriptId = "turnstile-script"
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script")
      script.id = scriptId
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      script.onerror = () => {
        setHasError(true)
        onError?.()
      }
      document.body.appendChild(script)
    } else {
      setIsLoaded(true)
    }

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [onError, onVerify])

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || !TURNSTILE_SITE_KEY) return

    // Render widget
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
      callback: (token: string) => {
        onVerify(token)
      },
      "error-callback": () => {
        console.error("[CAPTCHA] Verification failed")
        setHasError(true)
        onError?.()
      },
      "expired-callback": () => {
        console.warn("[CAPTCHA] Token expired, resetting...")
        if (widgetIdRef.current) {
          window.turnstile?.reset(widgetIdRef.current)
        }
      },
    })
  }, [isLoaded, action, onVerify, onError])

  if (!TURNSTILE_SITE_KEY && process.env.NODE_ENV !== "development") {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
        ⚠️ CAPTCHA not configured. Please contact support.
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        ❌ CAPTCHA failed to load. Please refresh the page or try again later.
      </div>
    )
  }

  return (
    <div className="turnstile-container">
      <div ref={containerRef} className="cf-turnstile" />
      {!isLoaded && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading verification...</span>
        </div>
      )}
    </div>
  )
}

// Server-side verification helper
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token || token === "dev-bypass-token") {
    return process.env.NODE_ENV === "development"
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.error("[CAPTCHA] Secret key not configured")
    return false
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      console.error("[CAPTCHA] Verification failed:", data["error-codes"])
      return false
    }

    return true
  } catch (error) {
    console.error("[CAPTCHA] Verification error:", error)
    return false
  }
}
