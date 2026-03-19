"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  calculateHealthScore,
  getLevelFromScore,
  HEALTH_LEVELS,
} from "@/lib/utils/healthScore"
import type { Transaction, Category } from "@/types"

interface SupabaseClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>
  }
  from: (table: string) => QueryBuilder
}

interface QueryBuilder {
  upsert: (data: unknown, options?: { onConflict?: string }) => Promise<{ error: Error | null }>
  select: (columns: string) => SelectQuery
}

interface SelectQuery {
  eq: (column: string, value: string) => FilteredQuery
}

interface FilteredQuery extends Promise<{ data: unknown[] | null }> {
  order: (column: string, options: { ascending: boolean }) => OrderedQuery
}

interface OrderedQuery {
  limit: (n: number) => Promise<{ data: unknown[] | null }>
}

export interface SavedHealthScore {
  score: number
  level: string
  levelLabel: string
  levelColor: string
  levelBg: string
  savingsScore: number
  budgetScore: number
  consistencyScore: number
  activityScore: number
  streakDays: number
  periodMonth: string
  history: Array<{ period_month: string; score: number }>
  badges: Array<{ badge_key: string; badge_name: string; badge_icon: string }>
}

export async function getOrComputeHealthScore(
  transactions: Transaction[],
  categories: Category[]
): Promise<SavedHealthScore> {
  const supabase = await createSupabaseServerClient() as unknown as SupabaseClient
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const periodMonth = new Date().toISOString().slice(0, 7)

  const computed = calculateHealthScore(transactions, categories, 30)
  const level = getLevelFromScore(computed.score)
  const levelData = HEALTH_LEVELS[level]

  await supabase
    .from("financial_health")
    .upsert(
      {
        user_id: user.id,
        score: computed.score,
        level,
        savings_score: computed.savingsScore,
        budget_score: computed.budgetScore,
        consistency_score: computed.consistencyScore,
        activity_score: computed.activityScore,
        streak_days: computed.streakDays,
        period_month: periodMonth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period_month" }
    )

  // Save newly earned badges
  const earnedBadges = computed.badges.filter((b) => b.earned)
  if (earnedBadges.length > 0) {
    await supabase
      .from("health_badges")
      .upsert(
        earnedBadges.map((b) => ({
          user_id: user.id,
          badge_key: b.key,
          badge_name: b.name,
          badge_icon: b.icon,
        })),
        { onConflict: "user_id,badge_key" }
      )
  }

  // Fetch last 6 months history
  const { data: history } = await supabase
    .from("financial_health")
    .select("period_month, score")
    .eq("user_id", user.id)
    .order("period_month", { ascending: false })
    .limit(6)

  // Fetch all earned badges
  const { data: allBadges } = await supabase
    .from("health_badges")
    .select("badge_key, badge_name, badge_icon")
    .eq("user_id", user.id)

  return {
    score: computed.score,
    level,
    levelLabel: levelData.label,
    levelColor: levelData.color,
    levelBg: levelData.bg,
    savingsScore: computed.savingsScore,
    budgetScore: computed.budgetScore,
    consistencyScore: computed.consistencyScore,
    activityScore: computed.activityScore,
    streakDays: computed.streakDays,
    periodMonth,
    history: (history ?? []) as Array<{ period_month: string; score: number }>,
    badges: (allBadges ?? []) as Array<{
      badge_key: string
      badge_name: string
      badge_icon: string
    }>,
  }
}
