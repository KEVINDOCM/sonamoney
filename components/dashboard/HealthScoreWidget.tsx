"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Flame, Trophy, TrendingUp } from "lucide-react"
import type { SavedHealthScore } from "@/lib/actions/healthScore"
import { HEALTH_LEVELS, getLevelFromScore } from "@/lib/utils/healthScore"

interface HealthScoreWidgetProps {
  healthScore: SavedHealthScore
}

export function HealthScoreWidget({ healthScore }: HealthScoreWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const level = getLevelFromScore(healthScore.score)
  const levelData = HEALTH_LEVELS[level]

  const scoreColor =
    healthScore.score >= 81
      ? "#00B9A7"
      : healthScore.score >= 61
      ? "#00C48C"
      : healthScore.score >= 41
      ? "#FFB800"
      : healthScore.score >= 21
      ? "#FF9500"
      : "#FF5B5B"

  const circumference = 2 * Math.PI * 36
  const strokeDashoffset =
    circumference - (healthScore.score / 100) * circumference

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative shrink-0">
            <svg width="88" height="88" className="-rotate-90">
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="8"
              />
              <motion.circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-xl font-black"
                style={{ color: scoreColor }}
              >
                {healthScore.score}
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                /100
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{levelData.emoji}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelData.bg} ${levelData.color}`}
              >
                {levelData.label}
              </span>
            </div>
            <p className="text-sm font-bold text-[#1A1A2E] dark:text-white">
              Financial Health Score
            </p>

            <div className="flex items-center gap-3 mt-2">
              {healthScore.streakDays > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {healthScore.streakDays}d streak
                  </span>
                </div>
              )}
              {healthScore.badges.length > 0 && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {healthScore.badges.length} badges
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">

              {/* Score breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Breakdown
                </p>
                {[
                  { label: "Tabungan", score: healthScore.savingsScore, max: 30, color: "#00B9A7" },
                  { label: "Budget", score: healthScore.budgetScore, max: 30, color: "#6366F1" },
                  { label: "Konsistensi", score: healthScore.consistencyScore, max: 20, color: "#FFB800" },
                  { label: "Aktivitas", score: healthScore.activityScore, max: 20, color: "#00C48C" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="text-xs font-bold text-[#1A1A2E] dark:text-white">
                        {item.score}/{item.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Score history */}
              {healthScore.history.length > 1 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Riwayat Skor
                  </p>
                  <div className="flex items-end gap-1.5 h-12">
                    {[...healthScore.history].reverse().map((h, i) => {
                      const barColor =
                        h.score >= 81
                          ? "#00B9A7"
                          : h.score >= 61
                          ? "#00C48C"
                          : h.score >= 41
                          ? "#FFB800"
                          : "#FF5B5B"
                      return (
                        <div
                          key={h.period_month}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <motion.div
                            className="w-full rounded-t-sm"
                            style={{ backgroundColor: barColor }}
                            initial={{ height: 0 }}
                            animate={{ height: `${(h.score / 100) * 44}px` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                          />
                          <span className="text-[8px] text-gray-400">
                            {h.period_month.slice(5)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Badges */}
              {healthScore.badges.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Badges
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {healthScore.badges.map((badge) => (
                      <div
                        key={badge.badge_key}
                        className="flex items-center gap-1.5 bg-[#E6F7F6] dark:bg-[#00B9A7]/10 rounded-full px-2.5 py-1"
                      >
                        <span className="text-sm">{badge.badge_icon}</span>
                        <span className="text-xs font-semibold text-[#007A6E]">
                          {badge.badge_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend indicator */}
              {healthScore.history.length >= 2 && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                  <TrendingUp className="w-4 h-4 text-[#00B9A7]" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {healthScore.history[0].score > (healthScore.history[1]?.score ?? 0)
                      ? `Naik ${healthScore.history[0].score - (healthScore.history[1]?.score ?? 0)} poin dari bulan lalu` 
                      : healthScore.history[0].score < (healthScore.history[1]?.score ?? 0)
                      ? `Turun ${(healthScore.history[1]?.score ?? 0) - healthScore.history[0].score} poin dari bulan lalu` 
                      : "Skor sama dengan bulan lalu"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
