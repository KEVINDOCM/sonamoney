import type { Metadata } from "next"
import BudgetCalculatorClient from "./BudgetCalculatorClient"

export const metadata: Metadata = {
  title: "50/30/20 Rule Calculator | Free Budget Planner — SonaMoney",
  description:
    "Calculate your perfect 50/30/20 budget in 30 seconds. Free interactive calculator. Download your personalized budget template. Based on Elizabeth Warren's rule.",
  keywords: [
    "50/30/20 rule calculator",
    "budget calculator",
    "monthly budget planner",
    "50 30 20 budget",
    "budget rule calculator",
    "free budget tool",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "50/30/20 Rule Calculator | Free Budget Planner",
    description:
      "Calculate your perfect budget in 30 seconds. Interactive 50/30/20 calculator with personalized template download.",
    url: "https://sona-money.vercel.app/budget-calculator",
    images: ["/og-image.svg"],
  },
}

export default function BudgetCalculatorPage() {
  return <BudgetCalculatorClient />
}
