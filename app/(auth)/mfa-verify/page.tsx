"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MFAVerify } from "@/components/auth/MFAVerify"
import { Loader2 } from "lucide-react"

function MFAVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams?.get("redirectTo") || "/dashboard"

  // Send OTP on page load
  useEffect(() => {
    const sendOTP = async () => {
      try {
        const token = localStorage.getItem("sb-access-token")
        
        if (!token) {
          // Not authenticated, redirect to login
          router.push("/login")
          return
        }

        // Store token for MFA flow
        localStorage.setItem("mfa_auth_token", token)

        const res = await fetch("/api/auth/mfa/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          if (res.status === 401) {
            // Token invalid, redirect to login
            router.push("/login")
            return
          }
          throw new Error(data.error || "Failed to send verification code")
        }

        setChallengeId(data.challengeId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize MFA")
      } finally {
        setLoading(false)
      }
    }

    sendOTP()
  }, [router])

  const handleSuccess = () => {
    // Clear MFA auth token
    localStorage.removeItem("mfa_auth_token")
    
    // Redirect to original destination
    router.push(redirectTo)
  }

  const handleCancel = () => {
    // Clear MFA auth token
    localStorage.removeItem("mfa_auth_token")
    
    // Redirect to login
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00B9A7]" />
        <p className="mt-4 text-gray-500">Sending verification code...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A2E] mb-2">Verification Failed</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 bg-[#00B9A7] text-white rounded-xl font-semibold hover:bg-[#0099A0] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (!challengeId) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <p className="text-gray-500">Unable to initialize verification. Please try again.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 w-full py-3 bg-[#00B9A7] text-white rounded-xl font-semibold hover:bg-[#0099A0] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Navbar */}
      <nav className="h-16 px-4 lg:px-6 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#00B9A7] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-[#1A1A2E] text-base">SonaMoney</span>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <MFAVerify
              challengeId={challengeId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export with Suspense to prevent prerender errors
export default function MFAVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00B9A7]" />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    }>
      <MFAVerifyContent />
    </Suspense>
  )
}
