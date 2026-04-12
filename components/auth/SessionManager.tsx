"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Laptop, Smartphone, Tablet, LogOut, AlertCircle, Check, Loader2 } from "lucide-react"

interface Session {
  id: string
  deviceName: string
  deviceType: "desktop" | "mobile" | "tablet" | "unknown"
  ipAddress: string
  location?: string
  mfaVerified: boolean
  trusted: boolean
  trustedUntil?: string
  createdAt: string
  lastActiveAt: string
  isCurrent: boolean
}

export function SessionManager() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("sb-access-token")
        const res = await fetch("/api/auth/sessions", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) {
          throw new Error("Failed to fetch sessions")
        }

        const data = await res.json()
        setSessions(data.sessions || [])
      } catch {
        setError("Failed to load sessions")
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem("sb-access-token")
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ sessionId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke session")
      }

      setSuccess("Session revoked successfully")
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session")
    } finally {
      setRevoking(null)
    }
  }

  const revokeOtherSessions = async () => {
    if (!confirm("Are you sure you want to log out all other devices?")) {
      return
    }

    setRevokingAll(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem("sb-access-token")
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ allOthers: true }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke sessions")
      }

      setSuccess("All other devices logged out")
      // Keep only current session
      setSessions((prev) => prev.filter((s) => s.isCurrent))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke sessions")
    } finally {
      setRevokingAll(false)
    }
  }

  const getDeviceIcon = (type: Session["deviceType"]) => {
    switch (type) {
      case "desktop":
        return <Laptop className="w-5 h-5" />
      case "mobile":
        return <Smartphone className="w-5 h-5" />
      case "tablet":
        return <Tablet className="w-5 h-5" />
      default:
        return <Laptop className="w-5 h-5" />
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    return `${diffDays} days ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#00B9A7]" />
      </div>
    )
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent)
  const currentSession = sessions.find((s) => s.isCurrent)

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1A1A2E]">Active Sessions</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage devices where you&apos;re currently logged in
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

      {/* Current Session */}
      {currentSession && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
            Current Device
          </h3>
          <div className="p-4 bg-[#E6F7F6] border border-[#00B9A7]/20 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#00B9A7]">
                {getDeviceIcon(currentSession.deviceType)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1A1A2E]">
                    {currentSession.deviceName}
                  </span>
                  <span className="px-2 py-0.5 bg-[#00B9A7] text-white text-xs rounded-full">
                    This device
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {currentSession.location || currentSession.ipAddress} • Active now
                </p>
                {currentSession.trusted && (
                  <p className="text-xs text-[#00B9A7] mt-1">
                    Trusted until {formatDate(currentSession.trustedUntil || "")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Other Devices ({otherSessions.length})
            </h3>
            <button
              onClick={revokeOtherSessions}
              disabled={revokingAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {revokingAll ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Logging out...
                </span>
              ) : (
                "Log out all"
              )}
            </button>
          </div>

          <div className="space-y-3">
            {otherSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {getDeviceIcon(session.deviceType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1A1A2E]">
                        {session.deviceName}
                      </span>
                      <button
                        onClick={() => revokeSession(session.id)}
                        disabled={revoking === session.id}
                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {revoking === session.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <LogOut className="w-3 h-3" />
                            Revoke
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.location || session.ipAddress} •{" "}
                      {formatRelativeTime(session.lastActiveAt)}
                    </p>
                    {session.trusted && (
                      <p className="text-xs text-gray-400 mt-1">
                        Trusted • Expires {formatDate(session.trustedUntil || "")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherSessions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No other active sessions</p>
          <p className="text-sm mt-1">
            You&apos;re only logged in on this device
          </p>
        </div>
      )}

      {/* Security Tip */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <h4 className="text-sm font-medium text-amber-900 mb-1">Security Tip</h4>
        <p className="text-sm text-amber-700">
          If you notice any unfamiliar devices, revoke them immediately and consider changing your
          password. Regularly reviewing your active sessions helps keep your account secure.
        </p>
      </div>
    </div>
  )
}
