"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface BudgetNotificationProps {
  budgetWarningCount: number
  mounted: boolean
  t: (key: string) => string
}

const DISMISS_KEY = "sona_budget_notification_dismissed"

function getDismissedDate(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

function setDismissedToday(): void {
  if (typeof window === "undefined") return
  try {
    const today = new Date().toISOString().split("T")[0]
    localStorage.setItem(DISMISS_KEY, today)
  } catch {
    // ignore
  }
}

function isAlreadyDismissedToday(): boolean {
  const dismissed = getDismissedDate()
  if (!dismissed) return false
  const today = new Date().toISOString().split("T")[0]
  return dismissed === today
}

export function BudgetNotification({
  budgetWarningCount,
  mounted,
  t,
}: BudgetNotificationProps) {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!mounted) return
    if (budgetWarningCount === 0) return
    if (isAlreadyDismissedToday()) return

    // Small delay for smooth entrance
    const timer = setTimeout(() => {
      setVisible(true)
    }, 800)

    return () => clearTimeout(timer)
  }, [mounted, budgetWarningCount])

  const handleDismiss = () => {
    setDismissedToday()
    setVisible(false)
  }

  const handleReviewClick = () => {
    setDismissedToday()
    setVisible(false)
    router.push("/budget")
  }

  if (!visible) return null

  return (
    <div className="
      fixed top-4 left-4 right-4
      md:left-auto md:right-6
      md:w-96 z-[55]
      animate-slideDown
    ">
      <div className="
        bg-white dark:bg-gray-900
        rounded-2xl shadow-xl
        border border-[#FFB800]/30
        p-4
        flex items-start gap-3
      ">
        {/* Icon */}
        <div className="
          w-10 h-10 rounded-xl shrink-0
          bg-[#FFF8E6] dark:bg-yellow-900/20
          flex items-center justify-center
          text-xl
        ">
          ⚠️
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="
            text-sm font-bold
            text-[#1A1A2E] dark:text-white
          ">
            Budget Alert
          </p>
          <p className="
            text-xs text-[#6B7280]
            dark:text-gray-400 mt-0.5
          ">
            {budgetWarningCount}{" "}
            {mounted
              ? t("budget.warningCategories")
              : "budget(s) need attention"}
          </p>
          <button
            onClick={handleReviewClick}
            className="
              inline-block mt-2
              text-xs font-bold
              text-[#00B9A7]
              hover:text-[#0099A0]
              transition-colors
            "
          >
            Review budgets →
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="
            shrink-0 w-6 h-6
            rounded-lg
            flex items-center justify-center
            text-[#6B7280]
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition-colors duration-150
          "
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
