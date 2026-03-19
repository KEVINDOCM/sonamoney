import type { Transaction, Category } from "@/types"

export interface HealthScoreResult {
  score: number
  level: HealthLevel
  levelLabel: string
  levelColor: string
  levelBg: string
  savingsScore: number
  budgetScore: number
  consistencyScore: number
  activityScore: number
  streakDays: number
  breakdown: HealthBreakdown[]
  warnings: string[]
  badges: BadgeResult[]
}

export interface HealthBreakdown {
  label: string
  score: number
  maxScore: number
  description: string
}

export interface BadgeResult {
  key: string
  name: string
  icon: string
  earned: boolean
  description: string
}

export type HealthLevel =
  | "beginner"
  | "developing"
  | "stable"
  | "skilled"
  | "master"

export const HEALTH_LEVELS: Record<
  HealthLevel,
  {
    label: string
    color: string
    bg: string
    min: number
    max: number
    emoji: string
  }
> = {
  beginner: {
    label: "Pemula Keuangan",
    color: "text-red-500",
    bg: "bg-red-50",
    min: 0,
    max: 20,
    emoji: "🌱",
  },
  developing: {
    label: "Sedang Berkembang",
    color: "text-orange-500",
    bg: "bg-orange-50",
    min: 21,
    max: 40,
    emoji: "📈",
  },
  stable: {
    label: "Cukup Stabil",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    min: 41,
    max: 60,
    emoji: "⚖️",
  },
  skilled: {
    label: "Pengelola Handal",
    color: "text-green-500",
    bg: "bg-green-50",
    min: 61,
    max: 80,
    emoji: "💪",
  },
  master: {
    label: "Master Keuangan",
    color: "text-[#00B9A7]",
    bg: "bg-[#E6F7F6]",
    min: 81,
    max: 100,
    emoji: "🏆",
  },
}

export function getLevelFromScore(score: number): HealthLevel {
  if (score <= 20) return "beginner"
  if (score <= 40) return "developing"
  if (score <= 60) return "stable"
  if (score <= 80) return "skilled"
  return "master"
}

export function calculateHealthScore(
  transactions: Transaction[],
  categories: Category[],
  periodDays: number = 30
): HealthScoreResult {
  const warnings: string[] = []

  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(periodStart.getDate() - periodDays)

  const periodTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date)
    return txDate >= periodStart && txDate <= now
  })

  const income = periodTxs
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const expenses = periodTxs
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  // 1. SAVINGS SCORE (30 points)
  let savingsScore = 0
  if (income > 0) {
    const savingsRate = (income - expenses) / income
    if (savingsRate >= 0.3) savingsScore = 30
    else if (savingsRate >= 0.2) savingsScore = 24
    else if (savingsRate >= 0.1) savingsScore = 18
    else if (savingsRate >= 0) savingsScore = 10
    else {
      savingsScore = 0
      warnings.push("Pengeluaran melebihi pemasukan bulan ini")
    }
  } else if (expenses === 0) {
    savingsScore = 15
  }

  // 2. BUDGET ADHERENCE SCORE (30 points)
  let budgetScore = 0
  const expenseCategories = categories.filter(
    (c) => c.type === "expense" && c.budget_limit !== null && c.budget_limit > 0
  )

  if (expenseCategories.length > 0) {
    const spendingMap = new Map<string, number>()
    periodTxs
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const current = spendingMap.get(tx.category_id) ?? 0
        spendingMap.set(tx.category_id, current + Number(tx.amount))
      })

    const underBudget = expenseCategories.filter((cat) => {
      const spent = spendingMap.get(cat.id) ?? 0
      return spent <= (cat.budget_limit ?? 0)
    }).length

    const overBudget = expenseCategories.length - underBudget
    const adherenceRate = underBudget / expenseCategories.length

    budgetScore = Math.round(adherenceRate * 30)

    if (overBudget > 0) {
      warnings.push(`${overBudget} kategori melebihi budget`)
    }
  } else {
    budgetScore = 15
  }

  // 3. CONSISTENCY SCORE (20 points)
  let consistencyScore = 0
  const weeklyExpenses: number[] = []
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)

    const weekTotal = periodTxs
      .filter((tx) => {
        const d = new Date(tx.date)
        return tx.type === "expense" && d >= weekStart && d <= weekEnd
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0)

    weeklyExpenses.push(weekTotal)
  }

  const nonZeroWeeks = weeklyExpenses.filter((w) => w > 0)
  if (nonZeroWeeks.length >= 2) {
    const avg =
      nonZeroWeeks.reduce((a, b) => a + b, 0) / nonZeroWeeks.length
    const maxDeviation = Math.max(
      ...nonZeroWeeks.map((w) => Math.abs(w - avg) / avg)
    )
    if (maxDeviation <= 0.1) consistencyScore = 20
    else if (maxDeviation <= 0.25) consistencyScore = 16
    else if (maxDeviation <= 0.5) consistencyScore = 10
    else {
      consistencyScore = 5
      warnings.push("Pengeluaran tidak konsisten minggu ini")
    }
  } else {
    consistencyScore = 10
  }

  // 4. ACTIVITY SCORE (20 points)
  let activityScore = 0
  const uniqueDays = new Set(periodTxs.map((tx) => tx.date)).size
  const activityRate = uniqueDays / periodDays
  if (activityRate >= 0.7) activityScore = 20
  else if (activityRate >= 0.5) activityScore = 16
  else if (activityRate >= 0.3) activityScore = 12
  else if (activityRate >= 0.1) activityScore = 8
  else activityScore = 4

  // STREAK CALCULATION
  const sortedDates = [...new Set(transactions.map((tx) => tx.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  let streakDays = 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    let checkDate = new Date(sortedDates[0])
    for (const dateStr of sortedDates) {
      const d = new Date(dateStr)
      const diffDays = Math.round(
        (checkDate.getTime() - d.getTime()) / 86400000
      )
      if (diffDays <= 1) {
        streakDays++
        checkDate = d
      } else {
        break
      }
    }
  }

  const totalScore = Math.min(
    100,
    savingsScore + budgetScore + consistencyScore + activityScore
  )

  const level = getLevelFromScore(totalScore)
  const levelData = HEALTH_LEVELS[level]

  // BADGES
  const badges: BadgeResult[] = [
    {
      key: "first_transaction",
      name: "Transaksi Pertama",
      icon: "🎉",
      earned: transactions.length >= 1,
      description: "Catat transaksi pertamamu",
    },
    {
      key: "week_streak",
      name: "Seminggu Aktif",
      icon: "🔥",
      earned: streakDays >= 7,
      description: "Catat transaksi 7 hari berturut-turut",
    },
    {
      key: "budget_master",
      name: "Budget Master",
      icon: "🎯",
      earned: budgetScore >= 27,
      description: "90%+ kategori under budget",
    },
    {
      key: "saver",
      name: "Super Saver",
      icon: "💰",
      earned: savingsScore >= 24,
      description: "Tabung 20%+ dari pemasukan",
    },
    {
      key: "consistent",
      name: "Konsisten",
      icon: "⚡",
      earned: consistencyScore >= 16,
      description: "Pengeluaran stabil 4 minggu",
    },
    {
      key: "master",
      name: "Master Keuangan",
      icon: "🏆",
      earned: totalScore >= 81,
      description: "Raih skor di atas 80",
    },
  ]

  const breakdown: HealthBreakdown[] = [
    {
      label: "Tabungan",
      score: savingsScore,
      maxScore: 30,
      description: "Rasio pemasukan vs pengeluaran",
    },
    {
      label: "Budget",
      score: budgetScore,
      maxScore: 30,
      description: "Kepatuhan terhadap limit kategori",
    },
    {
      label: "Konsistensi",
      score: consistencyScore,
      maxScore: 20,
      description: "Stabilitas pengeluaran mingguan",
    },
    {
      label: "Aktivitas",
      score: activityScore,
      maxScore: 20,
      description: "Rutin mencatat transaksi",
    },
  ]

  return {
    score: totalScore,
    level,
    levelLabel: levelData.label,
    levelColor: levelData.color,
    levelBg: levelData.bg,
    savingsScore,
    budgetScore,
    consistencyScore,
    activityScore,
    streakDays,
    breakdown,
    warnings,
    badges,
  }
}
