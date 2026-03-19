"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { HEALTH_LEVELS, getLevelFromScore } from "@/lib/utils/healthScore"
import type { SavedHealthScore } from "@/lib/actions/healthScore"

interface HealthScoreFABProps {
  healthScore: SavedHealthScore
}

export function HealthScoreFAB({ healthScore }: HealthScoreFABProps) {
  const [open, setOpen] = useState(false)
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

  const circumference = 2 * Math.PI * 20
  const strokeDashoffset =
    circumference - (healthScore.score / 100) * circumference

  return (
    <>
      {/* FAB Button - Positioned above AI chat button (bottom-20) */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 right-4 z-[55] md:bottom-24 md:right-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-black/20 border-2 border-white dark:border-gray-800"
        style={{ backgroundColor: scoreColor }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="32" height="32" className="-rotate-90">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span className="absolute text-white text-xs font-black">
          {healthScore.score}
        </span>
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm md:w-full"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-bold text-[#1A1A2E] dark:text-white">
                    Financial Health Score
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Score display */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative">
                    <svg width="120" height="120" className="-rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                      <motion.circle
                        cx="60" cy="60" r="50"
                        fill="none"
                        stroke={scoreColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 50}
                        initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 50 - (healthScore.score / 100) * 2 * Math.PI * 50 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black" style={{ color: scoreColor }}>
                        {healthScore.score}
                      </span>
                      <span className="text-xs text-gray-400">/100</span>
                    </div>
                  </div>

                  <div className={`mt-3 px-4 py-1.5 rounded-full ${levelData.bg}`}>
                    <span className={`text-sm font-bold ${levelData.color}`}>
                      {levelData.emoji} {levelData.label}
                    </span>
                  </div>

                  {healthScore.streakDays > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      🔥 {healthScore.streakDays} hari streak aktif
                    </p>
                  )}
                </div>

                {/* Breakdown bars */}
                <div className="space-y-2 mt-2">
                  {[
                    { label: "Tabungan", score: healthScore.savingsScore, max: 30, color: "#00B9A7" },
                    { label: "Budget", score: healthScore.budgetScore, max: 30, color: "#6366F1" },
                    { label: "Konsistensi", score: healthScore.consistencyScore, max: 20, color: "#FFB800" },
                    { label: "Aktivitas", score: healthScore.activityScore, max: 20, color: "#00C48C" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
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
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                {healthScore.badges.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Badges Kamu
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
