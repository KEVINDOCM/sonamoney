"use client"

import { useState } from "react"
import { Target, Plus, Trash2, Pencil } from "lucide-react"
import {
  createGoal,
  updateGoalAmount,
  deleteGoal,
  type Goal,
} from "@/lib/actions/goals"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useCurrency } from "@/lib/hooks/useCurrency"
import { useToast } from "@/lib/hooks/useToast"
import { ToastContainer } from "@/components/ui/Toast"

interface GoalsClientProps {
  initialGoals: Goal[]
}

const GOAL_ICONS = [
  "🎯", "🏠", "🚗", "✈️", "💍", "📱",
  "💻", "🏋️", "📚", "🎓", "💰", "🏦",
]

const GOAL_COLORS = [
  "#00B9A7", "#6366F1", "#FFB800",
  "#00C48C", "#FF5B5B", "#EC4899",
]

export function GoalsClient({
  initialGoals,
}: GoalsClientProps) {
  const { t, mounted } = useTranslation()
  const { baseCurrency } = useCurrency()
  const { toast, toasts, removeToast } = useToast()
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingGoalId, setEditingGoalId] =
    useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")

  // Form state
  const [form, setForm] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    currency: baseCurrency,
    deadline: "",
    icon: "🎯",
    color: "#00B9A7",
  })

  const handleCreate = async () => {
    setIsSubmitting(true)
    const result = await createGoal({
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount),
      currency: form.currency,
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color,
    })

    if (result.success) {
      toast.success("Goal created!")
      setIsAddOpen(false)
      setForm({
        name: "",
        target_amount: "",
        current_amount: "0",
        currency: baseCurrency,
        deadline: "",
        icon: "🎯",
        color: "#00B9A7",
      })
      // Refresh goals
      window.location.reload()
    } else {
      toast.error(result.error ?? "Failed to create goal")
    }
    setIsSubmitting(false)
  }

  const handleUpdateAmount = async (goalId: string) => {
    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount < 0) return

    const result = await updateGoalAmount(goalId, amount)
    if (result.success) {
      toast.success("Progress updated!")
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                current_amount: amount,
                is_completed: amount >= g.target_amount,
              }
            : g
        )
      )
      setEditingGoalId(null)
      setEditAmount("")
    } else {
      toast.error(result.error ?? "Failed to update")
    }
  }

  const handleDelete = async (goalId: string) => {
    const result = await deleteGoal(goalId)
    if (result.success) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
      toast.success("Goal deleted")
    } else {
      toast.error(result.error ?? "Failed to delete")
    }
  }

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="
      bg-[#F5F7FA] dark:bg-[#0F172A]
      min-h-screen pb-6
    ">
      {/* Header */}
      <div className="
        px-4 pt-4 pb-0 md:px-0 md:pt-0
        flex items-center justify-between mb-4
      ">
        <div>
          <h1 className="
            text-xl font-extrabold
            text-[#1A1A2E] dark:text-white
          ">
            {mounted ? t("nav.goals") : "Financial Goals"}
          </h1>
          <p className="
            text-xs text-[#6B7280]
            dark:text-gray-400 mt-0.5
          ">
            {mounted
              ? t("goals.description")
              : "Track your savings goals"}
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="
            hidden lg:flex items-center gap-2
            btn-primary text-sm
          "
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="
          mx-4 md:mx-0
          bg-white dark:bg-gray-900
          rounded-2xl shadow-sm p-10
          flex flex-col items-center
          text-center
        ">
          <span className="text-5xl mb-4">🎯</span>
          <h3 className="
            text-base font-bold
            text-[#1A1A2E] dark:text-white
          ">
            No goals yet
          </h3>
          <p className="
            text-sm text-[#6B7280] mt-1 mb-4
          ">
            Set a financial goal to start tracking
            your progress
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary text-sm"
          >
            + Create your first goal
          </button>
        </div>
      ) : (
        <div className="
          px-4 md:px-0 space-y-3
          stagger-children
        ">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0
              ? Math.min(
                  (goal.current_amount /
                    goal.target_amount) * 100,
                  100
                )
              : 0
            const isEditing = editingGoalId === goal.id
            const daysLeft = goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() -
                    Date.now()) /
                  (1000 * 60 * 60 * 24)
                )
              : null

            return (
              <div
                key={goal.id}
                className="
                  bg-white dark:bg-gray-900
                  rounded-2xl shadow-sm p-4
                  hover:shadow-md
                  transition-all duration-200
                "
              >
                {/* Header row */}
                <div className="
                  flex items-center gap-3 mb-3
                ">
                  <div
                    className="
                      w-10 h-10 rounded-xl shrink-0
                      flex items-center justify-center
                      text-lg
                    "
                    style={{
                      backgroundColor: `${goal.color}20`,
                    }}
                  >
                    {goal.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="
                      flex items-center gap-2
                    ">
                      <p className="
                        text-sm font-bold
                        text-[#1A1A2E] dark:text-white
                        truncate
                      ">
                        {goal.name}
                      </p>
                      {goal.is_completed && (
                        <span className="
                          text-[10px] font-bold
                          bg-[#E6FAF4] text-[#00C48C]
                          px-2 py-0.5 rounded-full
                          shrink-0
                        ">
                          ✓ Done
                        </span>
                      )}
                    </div>
                    {daysLeft !== null && (
                      <p className="
                        text-[10px] text-[#6B7280]
                        dark:text-gray-400 mt-0.5
                      ">
                        {daysLeft > 0
                          ? `${daysLeft} days left`
                          : daysLeft === 0
                          ? "Due today"
                          : "Overdue"
                        }
                      </p>
                    )}
                  </div>

                  <div className="
                    flex items-center gap-1 shrink-0
                  ">
                    <button
                      onClick={() => {
                        setEditingGoalId(goal.id)
                        setEditAmount(
                          String(goal.current_amount)
                        )
                      }}
                      className="
                        w-8 h-8 rounded-xl
                        flex items-center justify-center
                        text-[#6B7280]
                        hover:bg-[#E6F7F6]
                        hover:text-[#00B9A7]
                        transition-all duration-200
                      "
                      aria-label="Edit goal amount"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="
                        w-8 h-8 rounded-xl
                        flex items-center justify-center
                        text-[#6B7280]
                        hover:bg-[#FFF0F0]
                        hover:text-[#FF5B5B]
                        transition-all duration-200
                      "
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="
                  flex justify-between items-center
                  mb-2
                ">
                  <span className="
                    text-xs text-[#6B7280]
                    dark:text-gray-400
                  ">
                    {mounted
                      ? formatAmount(
                          goal.current_amount,
                          goal.currency
                        )
                      : "—"}
                  </span>
                  <div className="
                    flex items-center gap-2
                  ">
                    <span className="
                      text-xs font-bold
                      text-[#1A1A2E] dark:text-white
                    ">
                      {Math.round(pct)}%
                    </span>
                    <span className="
                      text-xs text-[#6B7280]
                      dark:text-gray-400
                    ">
                      of {mounted
                        ? formatAmount(
                            goal.target_amount,
                            goal.currency
                          )
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="
                  w-full bg-gray-100
                  dark:bg-gray-700
                  rounded-full h-2
                  overflow-hidden mb-3
                ">
                  <div
                    className="
                      h-2 rounded-full
                      transition-all duration-700
                    "
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                {/* Edit amount */}
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) =>
                        setEditAmount(e.target.value)
                      }
                      placeholder="Current amount"
                      className="
                        flex-1 h-9 rounded-xl
                        border border-gray-200
                        dark:border-gray-700
                        dark:bg-gray-800
                        dark:text-white
                        px-3 text-sm
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#00B9A7]/30
                        focus:border-[#00B9A7]
                      "
                    />
                    <button
                      onClick={() =>
                        handleUpdateAmount(goal.id)
                      }
                      className="
                        h-9 px-3 rounded-xl
                        bg-[#00B9A7] text-white
                        text-xs font-semibold
                        hover:bg-[#0099A0]
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoalId(null)
                        setEditAmount("")
                      }}
                      className="
                        h-9 px-3 rounded-xl
                        border border-gray-200
                        dark:border-gray-700
                        text-xs text-[#6B7280]
                        hover:bg-gray-50
                        dark:hover:bg-gray-800
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingGoalId(goal.id)
                      setEditAmount(
                        String(goal.current_amount)
                      )
                    }}
                    className="
                      text-xs font-semibold
                      text-[#00B9A7]
                      hover:text-[#0099A0]
                      transition-colors
                    "
                  >
                    + Update progress
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="
          fixed bottom-20 right-4
          w-14 h-14 rounded-full
          bg-[#00B9A7] text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          active:scale-95
          transition-all duration-300
          lg:hidden z-50
        "
        aria-label="Add goal"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Goal Modal */}
      {isAddOpen && (
        <>
          <div
            className="
              fixed inset-0 bg-black/50
              backdrop-blur-sm z-[60]
              animate-fadeIn
            "
            onClick={() => setIsAddOpen(false)}
          />
          <div className="
            fixed inset-0 z-[70]
            flex items-center justify-center
            px-4
          ">
            <div className="
              w-full max-w-md
              bg-white dark:bg-gray-900
              rounded-3xl shadow-2xl p-6
              max-h-[90vh] overflow-y-auto
              animate-scaleIn
            ">
              <h2 className="
                text-base font-bold
                text-[#1A1A2E] dark:text-white mb-4
              ">
                Create New Goal
              </h2>

              <div className="space-y-4">
                {/* Icon picker */}
                <div>
                  <label className="
                    text-xs font-semibold
                    text-[#6B7280] uppercase
                    tracking-wide block mb-2
                  ">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() =>
                          setForm((f) => ({ ...f, icon }))
                        }
                        className={`
                          w-9 h-9 rounded-xl text-lg
                          flex items-center justify-center
                          transition-all duration-150
                          ${form.icon === icon
                            ? "bg-[#E6F7F6] ring-2 ring-[#00B9A7]"
                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                          }
                        `}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="
                    text-xs font-semibold
                    text-[#6B7280] uppercase
                    tracking-wide block mb-2
                  ">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {GOAL_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setForm((f) => ({ ...f, color }))
                        }
                        className={`
                          w-8 h-8 rounded-full
                          transition-all duration-150
                          ${form.color === color
                            ? "ring-2 ring-offset-2 ring-[#1A1A2E] scale-110"
                            : "hover:scale-105"
                          }
                        `}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="
                    text-xs font-semibold
                    text-[#6B7280] uppercase
                    tracking-wide block mb-1.5
                  ">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Emergency Fund"
                    className="
                      w-full h-11 rounded-xl
                      border border-gray-200
                      dark:border-gray-700
                      dark:bg-gray-800 dark:text-white
                      px-4 text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#00B9A7]/30
                      focus:border-[#00B9A7]
                      transition-all
                    "
                  />
                </div>

                {/* Target amount */}
                <div>
                  <label className="
                    text-xs font-semibold
                    text-[#6B7280] uppercase
                    tracking-wide block mb-1.5
                  ">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        target_amount: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="
                      w-full h-11 rounded-xl
                      border border-gray-200
                      dark:border-gray-700
                      dark:bg-gray-800 dark:text-white
                      px-4 text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#00B9A7]/30
                      focus:border-[#00B9A7]
                      transition-all
                    "
                  />
                </div>

                {/* Current amount */}
                <div>
                  <label className="
                    text-xs font-semibold
                    text-[#6B7280] uppercase
                    tracking-wide block mb-1.5
                  ">
                    Current Amount (optional)
                  </label>
                  <input
                    type="number"
                    value={form.current_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        current_amount: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="
                      w-full h-11 rounded-xl
                      border border-gray-200
                      dark:border-gray-700
                      dark:bg-gray-800 dark:text-white
                      px-4 text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#00B9A7]/30
                      focus:border-[#00B9A7]
                      transition-all
                    "
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="
                    text-xs font-semibold
                    text-[#6B7280] uppercase
                    tracking-wide block mb-1.5
                  ">
                    Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        deadline: e.target.value,
                      }))
                    }
                    aria-label="Goal deadline"
                    className="
                      w-full h-11 rounded-xl
                      border border-gray-200
                      dark:border-gray-700
                      dark:bg-gray-800 dark:text-white
                      px-4 text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#00B9A7]/30
                      focus:border-[#00B9A7]
                      transition-all
                    "
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="
                      flex-1 h-11 rounded-full
                      border border-gray-200
                      dark:border-gray-700
                      text-sm font-semibold
                      text-[#6B7280]
                      hover:bg-gray-50
                      dark:hover:bg-gray-800
                      active:scale-95
                      transition-all duration-200
                    "
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={
                      isSubmitting ||
                      !form.name ||
                      !form.target_amount
                    }
                    className="
                      flex-1 h-11 rounded-full
                      bg-[#00B9A7] text-white
                      text-sm font-semibold
                      hover:bg-[#0099A0]
                      active:scale-95
                      transition-all duration-200
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    {isSubmitting ? "Creating..." : "Create Goal"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
