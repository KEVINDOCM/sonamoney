"use client"

import { useState, useTransition, FormEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { signupSchema } from "@/lib/security"
import { validatePasswordStrength } from "@/lib/utils/passwordSecurity"
import { generateSecureHeaders } from "@/lib/security/client"
import { TurnstileWidget } from "@/components/security/TurnstileCaptcha"
import { AlertTriangle } from "lucide-react"

interface TurnstileRef {
  reset: () => void
}

interface AuthClient {
  auth: {
    signUp: (credentials: {
      email: string
      password: string
      options: { emailRedirectTo: string }
    }) => Promise<{ error: Error | null }>
    signInWithOAuth: (options: {
      provider: string
      options: { redirectTo: string }
    }) => Promise<void>
  }
}

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string>("")
  const turnstileRef = useRef<TurnstileRef>(null)
  const [passwordStrength, setPasswordStrength] =
    useState<{
      score: number
      strength: string
      errors: string[]
    } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value
    setPassword(val)
    if (val.length > 0) {
      const result = validatePasswordStrength(val)
      setPasswordStrength(result)
    } else {
      setPasswordStrength(null)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const website = String(formData.get("website") ?? "") // Honeypot field

    const parsed = signupSchema.safeParse({ email, password, website })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input")
      setIsSubmitting(false)
      return
    }

    try {
      const payload = { email, password, website, captchaToken }
      const headers = await generateSecureHeaders(payload)

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data: unknown = await res.json()
      const json = data as { error?: string; success?: boolean }

      setIsSubmitting(false)

      if (!res.ok) {
        // Reset Turnstile widget - tokens are one-time use only
        turnstileRef.current?.reset()
        setCaptchaToken("")
        setError(json.error ?? "Failed to create account.")
        return
      }

      // Show success message - email confirmation required before login
      setRegisteredEmail(email)
      setShowSuccess(true)
    } catch {
      setIsSubmitting(false)
      setError("Network error. Please try again.")
    }
  }

  const strengthColor =
    passwordStrength?.strength === "very-strong"
      ? "bg-[#00C48C]"
      : passwordStrength?.strength === "strong"
      ? "bg-[#00B9A7]"
      : passwordStrength?.strength === "fair"
      ? "bg-[#FFB800]"
      : "bg-[#FF5B5B]"

  const strengthWidth =
    passwordStrength?.strength === "very-strong"
      ? "w-full"
      : passwordStrength?.strength === "strong"
      ? "w-3/4"
      : passwordStrength?.strength === "fair"
      ? "w-1/2"
      : "w-1/4"

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Navbar */}
      <nav className="
        h-16 px-4 lg:px-6
        flex items-center justify-between
        bg-white border-b border-gray-100
      ">
        <Link href="/" className="flex items-center gap-2">
          <div className="
            h-8 w-8 rounded-xl bg-[#00B9A7]
            flex items-center justify-center
          ">
            <span className="text-white font-bold text-sm">
              S
            </span>
          </div>
          <span className="font-bold text-[#1A1A2E]">
            SonaMoney
          </span>
        </Link>
        <Link
          href="/login"
          className="
            text-sm font-semibold text-[#00B9A7]
            hover:text-[#0099A0] transition-colors
          "
        >
          Log in →
        </Link>
      </nav>

      {/* Main */}
      <div className="
        flex-1 flex items-center
        justify-center px-4 py-12
      ">
        <div className="w-full max-w-md">

          {/* Success Screen */}
          {showSuccess ? (
            <div className="
              bg-white rounded-3xl shadow-sm
              border border-gray-100 p-6 lg:p-8 text-center
            ">
              <div className="
                inline-flex items-center justify-center
                w-16 h-16 rounded-2xl bg-[#E6F7F6] mb-4
              ">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Check your email
              </h2>
              <p className="text-sm text-[#6B7280] mb-4">
                We sent a confirmation link to <strong className="text-[#1A1A2E]">{registeredEmail}</strong>.
                Click the link to activate your account before logging in.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="
                    block w-full py-3 px-4
                    bg-[#00B9A7] hover:bg-[#0099A0]
                    text-white font-semibold rounded-xl
                    transition-colors text-center
                  "
                >
                  Go to Login
                </Link>
                <button
                  onClick={() => {
                    setShowSuccess(false)
                    setRegisteredEmail("")
                    setPassword("")
                    setCaptchaToken("")
                  }}
                  className="
                    block w-full py-3 px-4
                    text-[#6B7280] font-medium
                    hover:text-[#1A1A2E] transition-colors
                  "
                >
                  Create another account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="
                  inline-flex items-center justify-center
                  w-14 h-14 rounded-2xl bg-[#E6F7F6] mb-4
                ">
                  <span className="text-2xl">🚀</span>
                </div>
                <h1 className="
                  text-2xl font-extrabold text-[#1A1A2E]
                ">
                  Create your account
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">
                  Free forever. No credit card needed.
                </p>
              </div>

              {/* Card */}
              <div className="
                bg-white rounded-3xl shadow-sm
                border border-gray-100 p-6 lg:p-8 space-y-5
              ">
                {/* Error */}
                {error && (
                  <div className="
                    rounded-2xl bg-[#FFF0F0]
                    border border-[#FF5B5B]/20
                    px-4 py-3 flex items-start gap-2
                  ">
                    <AlertTriangle className="w-4 h-4 text-[#FF5B5B] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#FF5B5B] font-medium">
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="
                  text-xs font-semibold text-[#1A1A2E]
                  uppercase tracking-wide block
                ">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="
                    w-full h-11 border border-gray-200
                    rounded-xl px-4 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-[#00B9A7]/30
                    focus:border-[#00B9A7]
                    transition-all duration-200
                  "
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="
                  text-xs font-semibold text-[#1A1A2E]
                  uppercase tracking-wide block
                ">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  className="
                    w-full h-11 border border-gray-200
                    rounded-xl px-4 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-[#00B9A7]/30
                    focus:border-[#00B9A7]
                    transition-all duration-200
                  "
                />

                {/* Password strength indicator */}
                {passwordStrength && (
                  <div className="space-y-2 mt-2">
                    <div className="
                      w-full bg-gray-100 rounded-full h-1.5
                    ">
                      <div className={`
                        h-1.5 rounded-full
                        transition-all duration-300
                        ${strengthColor} ${strengthWidth}
                      `}/>
                    </div>
                    <div className="flex justify-between">
                      <span className="
                        text-xs text-[#6B7280] capitalize
                      ">
                        {passwordStrength.strength.replace(
                          "-", " "
                        )}
                      </span>
                      {passwordStrength.errors[0] && (
                        <span className="
                          text-xs text-[#FF5B5B]
                        ">
                          {passwordStrength.errors[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CAPTCHA Widget - required when CAPTCHA is enabled in Supabase */}
              <div className="space-y-1.5">
                <label className="
                  text-xs font-semibold text-[#1A1A2E]
                  uppercase tracking-wide block
                ">
                  Security Verification
                </label>
                <TurnstileWidget
                  widgetRef={turnstileRef}
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => setError("CAPTCHA verification failed. Please refresh and try again.")}
                  action="signup"
                />
              </div>

              {/* Honeypot field - hidden from real users, bots will fill this */}
              <div className="absolute opacity-0 -z-10" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  placeholder="Leave this field empty"
                  className="w-px h-px"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="
                  w-full h-11 bg-[#00B9A7] text-white
                  rounded-full font-semibold text-sm
                  hover:bg-[#0099A0] active:scale-95
                  transition-all duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  shadow-md shadow-[#00B9A7]/25
                "
              >
                {isSubmitting
                  ? "Creating account..."
                  : "Create free account"
                }
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100"/>
              <span className="text-xs text-[#6B7280] font-medium">
                or continue with
              </span>
              <div className="flex-1 h-px bg-gray-100"/>
            </div>

            {/* Google */}
            <button
              onClick={async () => {
                setIsSubmitting(true)
                const supabase = createSupabaseBrowserClient() as AuthClient
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/callback`,
                  },
                })
              }}
              disabled={isSubmitting}
              className="
                w-full h-11 border border-gray-200
                rounded-full font-semibold text-sm
                text-[#1A1A2E]
                flex items-center justify-center gap-3
                hover:bg-gray-50 hover:border-gray-300
                active:scale-95 transition-all duration-200
                disabled:opacity-50
              "
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-[#6B7280] mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="
                font-semibold text-[#00B9A7]
                hover:text-[#0099A0] transition-colors
              "
            >
              Log in
            </Link>
          </p>
              </>
            )}
        </div>
      </div>
    </div>
  )
}
