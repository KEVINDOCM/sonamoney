import * as React from "react"
import { fetchGoals } from "@/lib/actions/goals"
import { GoalsClient } from "@/components/goals/GoalsClient"

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

export default async function GoalsPage() {
  return (
    <React.Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent />
    </React.Suspense>
  )
}

async function GoalsContent() {
  const goals = await fetchGoals()
  return <GoalsClient initialGoals={goals} />
}
