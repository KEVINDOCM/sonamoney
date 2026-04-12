"use client"

import { useState, useEffect } from "react"
import { Shield, Mail, Smartphone, Check, AlertCircle, Loader2 } from "lucide-react"

interface MFAStatus {
  mfaEnabled: boolean
  mfaMethod: string | null
  settings: {
    webauthnEnabled: boolean
    totpEnabled: boolean
    emailOtpEnabled: boolean
    enforcementLevel: "optional" | "required" | "admin_bypass"
    preferredMethod: string | null
  }
}

export function MFASetup() {
  const [status, setStatus] = useState<MFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch MFA status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("sb-access-token")
        const res = await fetch("/api/auth/mfa/status", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) {
          throw new Error("Failed to fetch MFA status")
        }

        const data = await res.json()
        setStatus(data)
      } catch {
        setError("Failed to load MFA settings")
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  const enableEmailMFA = async () => {
    setEnabling(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem("sb-access-token")
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          method: "email_otp",
          enforcementLevel: "optional",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to enable MFA")
      }

      setSuccess("Email OTP MFA enabled successfully")
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              mfaEnabled: true,
              mfaMethod: "email_otp",
              settings: {
                ...prev.settings,
                emailOtpEnabled: true,
                preferredMethod: "email_otp",
              },
            }
          : null
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable MFA")
    } finally {
      setEnabling(false)
    }
  }

  const disableMFA = async () => {
    if (!confirm("Are you sure you want to disable MFA? This will make your account less secure.")) {
      return
    }

    setEnabling(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem("sb-access-token")
      const res = await fetch("/api/auth/mfa/setup", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to disable MFA")
      }

      setSuccess("MFA disabled successfully")
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              mfaEnabled: false,
              mfaMethod: null,
              settings: {
                ...prev.settings,
                emailOtpEnabled: false,
                webauthnEnabled: false,
                totpEnabled: false,
                preferredMethod: null,
              },
            }
          : null
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable MFA")
    } finally {
      setEnabling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#00B9A7]" />
      </div>
    )
  }

  const isEmailEnabled = status?.settings.emailOtpEnabled ?? false

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#00B9A7]" />
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Add an extra layer of security to your account
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-sm text-green-700">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Status Card */}
      <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[#1A1A2E]">Current Status</p>
            <p className="text-sm text-gray-500">
              {status?.mfaEnabled ? `Enabled via ${status.mfaMethod?.replace("_", " ")}` : "Not enabled"}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              status?.mfaEnabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {status?.mfaEnabled ? "Protected" : "Not Protected"}
          </div>
        </div>
      </div>

      {/* MFA Methods */}
      <div className="space-y-3">
        {/* Email OTP */}
        <div className="p-4 border border-gray-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[#1A1A2E]">Email Verification</h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive a one-time code via email when signing in
              </p>
              <div className="mt-3 flex items-center gap-3">
                {isEmailEnabled ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                      <Check className="w-4 h-4" />
                      Enabled
                    </span>
                    <button
                      onClick={disableMFA}
                      disabled={enabling}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:text-gray-400"
                    >
                      {enabling ? "Processing..." : "Disable"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={enableEmailMFA}
                    disabled={enabling}
                    className="px-4 py-2 bg-[#00B9A7] text-white rounded-lg text-sm font-medium hover:bg-[#0099A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {enabling ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enabling...
                      </span>
                    ) : (
                      "Enable"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TOTP (Coming Soon) */}
        <div className="p-4 border border-gray-200 rounded-xl opacity-60">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[#1A1A2E]">Authenticator App</h3>
              <p className="text-sm text-gray-500 mt-1">
                Use an authenticator app like Google Authenticator or Authy
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Why use 2FA?</h4>
        <p className="text-sm text-blue-700">
          Two-factor authentication adds an extra layer of security by requiring both your password
          and a code from your device. This prevents unauthorized access even if your password
          is compromised.
        </p>
      </div>
    </div>
  )
}
