/**
 * Cloudflare Turnstile CAPTCHA Component
 * Privacy-friendly bot protection for login and registration
 * 
 * Note: You may see 401 errors on the Private Access Token (PAT) endpoint in console.
 * This is expected behavior - Turnstile attempts Privacy Pass tokens first, and 401
 * indicates no valid token exists. The widget automatically falls back to interactive
 * challenges. This does not indicate a failure.
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

// Helper to safely get sitekey from env (avoids module-level object injection issues)
const getSitekey = (): string => {
  const raw = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (typeof raw === 'string') {
    return raw.trim()
  }
  if (raw && typeof raw === 'object') {
    console.error('[CAPTCHA] Sitekey env var is object at module level:', raw)
    return String((raw as Record<string, unknown>).valueOf?.() || '').trim()
  }
  return String(raw || '').trim()
}

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
    "unsupported-callback"?: () => void
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
      const sitekeyValue = String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()
      if (sitekeyValue.length === 0) {
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
          console.error('[CAPTCHA] Failed to load Turnstile script - may be blocked by ad blocker')
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

    // Render widget once when script loads (deferred to avoid forced reflow)
    useEffect(() => {
      if (!isLoaded || !containerRef.current || hasRenderedRef.current) return

      // Capture sitekey at render time - don't read from process.env inside closure
      // This prevents issues where env values might be modified by browser extensions
      const rawSitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      
      // Defensive: handle cases where env var might be an object or non-string
      let sitekey: string
      if (typeof rawSitekey === 'string') {
        sitekey = rawSitekey.trim()
      } else if (rawSitekey && typeof rawSitekey === 'object') {
        // Edge case: env var might be wrapped or parsed as object
        console.error('[CAPTCHA] Sitekey is an object, attempting to extract value:', rawSitekey)
        const obj = rawSitekey as Record<string, unknown>
        sitekey = String(obj.valueOf?.() || JSON.stringify(rawSitekey)).trim()
      } else {
        sitekey = String(rawSitekey || '').trim()
      }
      
      // Also capture action to ensure it's a string
      const actionValue = String(action || 'login').trim()

      // Debug logging to diagnose sitekey issues
      if (process.env.NODE_ENV === 'development') {
        const maskedSitekey = sitekey ? `${sitekey.slice(0, 4)}...${sitekey.slice(-4)}` : '(empty)'
        console.log('[CAPTCHA] Sitekey type:', typeof rawSitekey, 'Length:', sitekey.length, 'Masked:', maskedSitekey)
      }

      if (!window.turnstile || sitekey.length === 0) {
        console.error('[CAPTCHA] Cannot render: turnstile not loaded or sitekey empty. Raw type:', typeof rawSitekey)
        setHasError(true)
        const initErrorCallback = onErrorRef.current
        if (initErrorCallback) initErrorCallback()
        return
      }

      // Prevent double render (StrictMode, etc.)
      hasRenderedRef.current = true

      // Defer render to next frame to avoid forced reflow during initial load
      const renderFrame = requestAnimationFrame(() => {
        if (!containerRef.current || !window.turnstile) return

        // Final validation before passing to Turnstile
        const finalSitekey = String(sitekey)
        const finalAction = String(actionValue)

        // Extra defensive: verify sitekey is actually a string
        if (typeof finalSitekey !== 'string' || finalSitekey.length === 0) {
          console.error('[CAPTCHA] Sitekey invalid. Type:', typeof finalSitekey, 'Value:', finalSitekey)
          setHasError(true)
          return
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: finalSitekey,
          action: finalAction,
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
          },
          "unsupported-callback": () => {
            console.error("[CAPTCHA] Browser unsupported - tracking prevention may be enabled")
            setHasError(true)
            const unsupportedCallback = onErrorRef.current
            if (unsupportedCallback) unsupportedCallback()
          }
        })
      })

      return () => cancelAnimationFrame(renderFrame)
    }, [isLoaded, action]) // Stable deps - action is string literal

    // Error state: configuration missing (production only)
    if (getSitekey().length === 0 && process.env.NODE_ENV !== "development") {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          ⚠️ CAPTCHA not configured. Please contact support.
        </div>
      )
    }

    // Error state: widget failed to load
    if (hasError) {
      const sitekeyEmpty = getSitekey().length === 0
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm space-y-3">
          <div className="flex items-start gap-2">
            <span className="shrink-0">❌</span>
            <div>
              <p className="font-medium">CAPTCHA verification failed</p>
              {sitekeyEmpty && <p className="text-red-600/80 text-xs mt-0.5">Site key not configured</p>}
              <p className="text-red-600/80 text-xs mt-1">
                This may be caused by privacy settings or tracking prevention features in your browser.
                Try disabling &quot;Prevent Cross-Site Tracking&quot; or use a different browser.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setHasError(false)
              setIsLoaded(false)
              hasRenderedRef.current = false
              widgetIdRef.current = null
              // Force re-render by clearing and reloading
              if (containerRef.current) {
                containerRef.current.innerHTML = ''
              }
              // Small delay to allow cleanup before reload attempt
              setTimeout(() => setIsLoaded(true), 100)
            }}
            className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded-lg transition-colors"
          >
            Retry CAPTCHA
          </button>
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
