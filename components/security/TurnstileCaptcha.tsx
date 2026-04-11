/**
 * Cloudflare Turnstile CAPTCHA Component
 * Privacy-friendly bot protection for login and registration
 */

"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Props for the TurnstileWidget component
 * @property onVerify - Callback when user completes challenge successfully
 * @property onError - Callback when widget fails to load or verification fails
 * @property action - Context identifier for the challenge (e.g., "signup", "login")
 * @property widgetRef - Ref to access imperative reset method
 */
interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: () => void
  action?: string
  widgetRef?: React.Ref<{ reset: () => void }>
}

// Cloudflare Turnstile site key (public) - validated at runtime
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
  
  interface TurnstileRenderOptions {
    sitekey: string
    action?: string
    callback?: (token: string) => void
    "error-callback"?: () => void
    "expired-callback"?: () => void
    "timeout-callback"?: () => void
  }
}

/**
 * Cloudflare Turnstile CAPTCHA Widget
 * 
 * Architecture Principles:
 * 1. Stable Effects: Callback refs prevent effect re-runs on parent renders
 * 2. Single Render: Widget renders once per mount, survives React re-renders
 * 3. Imperative Control: Parent can reset widget via ref for token regeneration
 * 4. Token Lifecycle: One-time tokens - parent must reset after use
 * 
 * @example
 * ```tsx
 * const ref = useRef<TurnstileRef>(null)
 * 
 * // After failed submission, reset for new token
 * ref.current?.reset()
 * ```
 */
/**
 * Cloudflare Turnstile CAPTCHA Widget
 * 
 * Architecture Principles:
 * 1. Stable Effects: Callback refs prevent effect re-runs on parent renders
 * 2. Single Render: Widget renders once per mount, survives React re-renders
 * 3. Token Lifecycle: One-time tokens - parent must reset after use via widgetRef
 * 
 * @example
 * ```tsx
 * const widgetRef = useRef<{ reset: () => void }>(null)
 * 
 * // After failed submission, reset for new token
 * widgetRef.current?.reset()
 * ```
 */
export function TurnstileWidget({ 
  onVerify, 
  onError, 
  action = "login",
  widgetRef 
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const hasRenderedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Store callbacks in refs to avoid effect dependencies on function references
  const onVerifyRef = useRef(onVerify)
  const onErrorRef = useRef(onError)
  
  // Sync refs with latest callbacks
  useEffect(() => {
    onVerifyRef.current = onVerify
    onErrorRef.current = onError
  })

  // Expose imperative reset method to parent via callback ref
  useEffect(() => {
    if (!widgetRef) return
    
    const resetFn = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    }
    
    // Handle both callback ref and object ref
    if (typeof widgetRef === 'function') {
      widgetRef({ reset: resetFn })
    } else {
      (widgetRef as React.MutableRefObject<{ reset: () => void } | null>).current = { reset: resetFn }
    }
  }, [widgetRef])

    // Load Turnstile script once on mount
    useEffect(() => {
      if (!TURNSTILE_SITE_KEY) {
        console.error("[CAPTCHA] NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured")
        setHasError(true)
        const missingKeyCallback = onErrorRef.current
        if (missingKeyCallback) missingKeyCallback()
        return
      }

      const scriptId = "turnstile-script"
      const existingScript = document.getElementById(scriptId)
      
      if (existingScript) {
        // Script already loaded
        setIsLoaded(true)
      } else {
        const script = document.createElement("script")
        script.id = scriptId
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => {
          setHasError(true)
          const errorCallback = onErrorRef.current
          if (errorCallback) errorCallback()
        }
        document.body.appendChild(script)
      }

      // Cleanup: remove widget instance on unmount
      return () => {
        const currentWidgetId = widgetIdRef.current
        if (currentWidgetId && window.turnstile) {
          window.turnstile.remove(currentWidgetId)
          widgetIdRef.current = null
          hasRenderedRef.current = false
        }
      }
    }, []) // Empty deps - only run on mount/unmount

    // Render widget once when script loads
    useEffect(() => {
      if (!isLoaded || !containerRef.current || hasRenderedRef.current) return
      if (!window.turnstile || !TURNSTILE_SITE_KEY) return

      // Prevent double render (StrictMode, etc.)
      hasRenderedRef.current = true

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        callback: (token: string) => {
          const verifyCallback = onVerifyRef.current
          if (verifyCallback) verifyCallback(token)
        },
        "error-callback": () => {
          console.error("[CAPTCHA] Challenge verification failed")
          setHasError(true)
          const challengeErrorCallback = onErrorRef.current
          if (challengeErrorCallback) challengeErrorCallback()
        },
        "expired-callback": () => {
          console.warn("[CAPTCHA] Token expired, challenge reset")
          // Widget auto-resets, parent will receive new token via callback
        },
        "timeout-callback": () => {
          console.warn("[CAPTCHA] Challenge timed out")
          setHasError(true)
          const timeoutCallback = onErrorRef.current
          if (timeoutCallback) timeoutCallback()
        }
      })
    }, [isLoaded, action]) // Stable deps - action is string literal

    // Error state: configuration missing (production only)
    if (!TURNSTILE_SITE_KEY && process.env.NODE_ENV !== "development") {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          ⚠️ CAPTCHA not configured. Please contact support.
        </div>
      )
    }

    // Error state: widget failed to load
    if (hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          ❌ CAPTCHA failed to load. {!TURNSTILE_SITE_KEY && "(Site key not configured)"} 
          Please refresh the page or try again later.
        </div>
      )
    }

    return (
      <div className="turnstile-container">
        <div ref={containerRef} className="cf-turnstile" />
        {!isLoaded && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
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
