"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Shield, RefreshCw, AlertCircle, Check } from "lucide-react"

interface MFAVerifyProps {
  challengeId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function MFAVerify({ challengeId, onSuccess, onCancel }: MFAVerifyProps) {
  const router = useRouter()
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [trustDevice, setTrustDevice] = useState(false)
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(6).fill(null)) as React.MutableRefObject<(HTMLInputElement | null)[]>

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return

      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      setError(null)

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current![index + 1]?.focus()
      }

      // Auto-submit when all digits entered
      if (value && index === 5) {
        const code = newOtp.join("")
        if (code.length === 6) {
          handleVerify(code)
        }
      }
    },
    [otp]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current![index - 1]?.focus()
      }
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current![index - 1]?.focus()
      }
      if (e.key === "ArrowRight" && index < 5) {
        inputRefs.current![index + 1]?.focus()
      }
    },
    [otp]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
      if (pasted.length === 6) {
        const newOtp = pasted.split("")
        setOtp(newOtp)
        handleVerify(pasted)
      }
    },
    []
  )

  const handleVerify = async (code: string) => {
    if (isVerifying) return
    setIsVerifying(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          otp: code,
          trustDevice,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid verification code")
        // Clear OTP on error
        setOtp(new Array(6).fill(""))
        inputRefs.current![0]?.focus()
        return
      }

      setVerified(true)
      onSuccess?.()

      // Redirect after brief delay to show success
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch {
      setError("Network error. Please try again.")
      setOtp(new Array(6).fill(""))
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus()
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || isResending) return
    setIsResending(true)
    setError(null)

    try {
      // Get auth token from storage
      const token = localStorage.getItem("mfa_auth_token")

      const res = await fetch("/api/auth/mfa/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to resend code")
        return
      }

      setCountdown(60)
      setOtp(new Array(6).fill(""))
      inputRefs.current[0]?.focus()
    } catch {
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (verified) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-[#00C48C] rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2">Verified!</h2>
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#E6F7F6] rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-[#00B9A7]" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E]">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isVerifying}
            className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-[#00B9A7] focus:outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            autoFocus={index === 0}
            aria-label={`Digit ${index + 1} of 6`}
            placeholder="•"
          />
        ))}
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#00B9A7] focus:ring-[#00B9A7]"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-[#1A1A2E]">Trust this device</span>
            <p className="text-xs text-gray-500">Skip 2FA for 30 days on this device</p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="flex items-center gap-2 text-[#00B9A7] hover:text-[#0099A0] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
        </button>

        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
