import { fetchGoals } from "@/lib/actions/goals"
import { GoalsClient } from "@/components/goals/GoalsClient"

export const metadata = {
  title: "Financial Goals | SonaMoney",
  description: "Track your financial goals.",
}

export default async function GoalsPage() {
  const goals = await fetchGoals()

  return <GoalsClient initialGoals={goals} />
}
