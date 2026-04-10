"use client"

import Link from "next/link"
import { Target, PartyPopper } from "lucide-react";
import type { Goal } from "@/lib/actions/goals"

interface GoalsWidgetProps {
  goals: Goal[]
  mounted: boolean
  t: (key: string) => string
}

export function GoalsWidget({
  goals,
  mounted,
  t,
}: GoalsWidgetProps) {
  const activeGoals = goals
    .filter((g) => !g.is_completed)
    .slice(0, 3)

  const completedCount = goals.filter(
    (g) => g.is_completed
  ).length

  const formatAmount = (
    amount: number,
    currency: string
  ) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(amount)

  return (
    <div className="
      bg-white dark:bg-gray-900
      rounded-2xl shadow-sm
      overflow-hidden
      hover:shadow-md
      transition-shadow duration-300
    ">
      {/* Header */}
      <div className="
        flex items-center justify-between
        px-4 pt-4 pb-3
        border-b border-gray-100
        dark:border-gray-800
      ">
        <div>
          <h3 className="
            text-sm font-bold
            text-[#1A1A2E] dark:text-white
          ">
            {mounted ? t("nav.goals") : "Goals"}
          </h3>
          {completedCount > 0 && (
            <p className="
              text-[10px] text-[#00C48C]
              font-semibold mt-0.5
            ">
              {completedCount} completed <PartyPopper className="w-3 h-3 inline" />
            </p>
          )}
        </div>
        <Link
          href="/goals"
          className="
            text-xs font-semibold
            text-[#00B9A7]
            hover:text-[#0099A0]
            transition-colors duration-150
          "
        >
          {mounted ? t("dashboard.viewAll") : "View All"} →
        </Link>
      </div>

      {/* Content */}
      {activeGoals.length === 0 ? (
        <div className="
          flex flex-col items-center
          justify-center py-8 px-4 text-center
        ">
          <Target className="w-8 h-8 mb-2 text-[#00B9A7]" />
          <p className="
            text-sm font-medium
            text-[#1A1A2E] dark:text-white
          ">
            {mounted ? t("goals.noGoals") : "No goals yet"}
          </p>
          <Link
            href="/goals"
            className="
              mt-3 text-xs font-semibold
              text-[#00B9A7]
              hover:text-[#0099A0]
              transition-colors
            "
          >
            + {mounted
              ? t("goals.createFirst")
              : "Create your first goal"} →
          </Link>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {activeGoals.map((goal) => {
            const pct = goal.target_amount > 0
              ? Math.min(
                  (goal.current_amount /
                    goal.target_amount) * 100,
                  100
                )
              : 0

            const daysLeft = goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() -
                    Date.now()) /
                  (1000 * 60 * 60 * 24)
                )
              : null

            return (
              <div key={goal.id}>
                <div className="
                  flex items-center
                  justify-between mb-1.5
                ">
                  <div className="
                    flex items-center gap-2
                  ">
                    <span className="text-base">
                      {goal.icon}
                    </span>
                    <span className="
                      text-xs font-semibold
                      text-[#1A1A2E] dark:text-white
                      truncate max-w-[120px]
                    ">
                      {goal.name}
                    </span>
                  </div>
                  <div className="
                    flex items-center gap-2
                    shrink-0
                  ">
                    {daysLeft !== null && (
                      <span className={`
                        text-[10px] font-medium
                        ${daysLeft <= 7
                          ? "text-[#FF5B5B]"
                          : "text-[#6B7280]"
                        }
                      `}>
                        {daysLeft > 0
                          ? `${daysLeft}d`
                          : daysLeft === 0
                          ? "Today"
                          : "Overdue"
                        }
                      </span>
                    )}
                    <span className="
                      text-[10px] font-bold
                      text-[#1A1A2E] dark:text-white
                    ">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="
                  w-full bg-gray-100
                  dark:bg-gray-700
                  rounded-full h-1.5
                  overflow-hidden
                ">
                  <div
                    className="
                      h-1.5 rounded-full
                      transition-all duration-700
                    "
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                {/* Amounts */}
                <div className="
                  flex justify-between mt-1
                ">
                  <span className="
                    text-[10px] text-[#6B7280]
                  ">
                    {mounted
                      ? formatAmount(
                          goal.current_amount,
                          goal.currency
                        )
                      : "—"}
                  </span>
                  <span className="
                    text-[10px] text-[#6B7280]
                  ">
                    {mounted
                      ? formatAmount(
                          goal.target_amount,
                          goal.currency
                        )
                      : "—"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
