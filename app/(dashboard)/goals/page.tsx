import * as React from "react"
import { fetchGoals } from "@/lib/actions/goals"
import { GoalsClient } from "@/components/goals/GoalsClient"

// Force dynamic rendering since this page uses cookies for auth (via fetchGoals)
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Financial Goals | SonaMoney",
  description: "Track your financial goals.",
}

function GoalsSkeleton() {
  return (
    <div className="
      bg-[#F5F7FA] dark:bg-[#0F172A]
      min-h-screen pb-6
    ">
      <div className="px-4 md:px-0 mb-4">
        <div className="skeleton h-7 w-40 rounded-xl mb-2"/>
        <div className="skeleton h-4 w-56 rounded-lg"/>
      </div>
      <div className="px-4 md:px-0 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton rounded-2xl h-[120px]"
          />
        ))}
      </div>
    </div>
  )
}

function GoalsError() {
  return (
    <div className="
      bg-[#F5F7FA] dark:bg-[#0F172A]
      min-h-screen pb-6 px-4 md:px-0 pt-4 md:pt-0
    ">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 text-center">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h2 className="text-lg font-bold text-[#1A1A2E] dark:text-white mb-2">
          Failed to load goals
        </h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-4">
          There was an error loading your goals. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#00B9A7] text-white rounded-full text-sm font-semibold hover:bg-[#0099A0] transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}

export default async function GoalsPage() {
  return (
    <React.Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent />
    </React.Suspense>
  )
}

async function GoalsContent() {
  try {
    const goals = await fetchGoals()
    return <GoalsClient initialGoals={goals} />
  } catch (error) {
    console.error("GoalsPage: Error fetching goals:", error)
    return <GoalsError />
  }
}
