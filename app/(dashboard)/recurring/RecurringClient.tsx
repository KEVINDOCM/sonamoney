"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { RecurringTransaction, updateRecurringTransaction } from "@/lib/actions/recurring";
import {
  logRecurringTransaction,
  skipRecurringOccurrence,
  stopRecurring,
} from "@/lib/actions/transactions";
import {
  Repeat,
  Play,
  SkipForward,
  StopCircle,
  Edit3,
  Calendar,
  ArrowRightLeft,
} from "lucide-react";

interface RecurringClientProps {
  initialRecurring: RecurringTransaction[];
}

export function RecurringClient({ initialRecurring }: RecurringClientProps) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(initialRecurring);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { t, mounted } = useTranslation();
  const { toast } = useToast();

  const handleLog = useCallback(
    async (id: string) => {
      setIsLoading(id);
      const result = await logRecurringTransaction(id);
      setIsLoading(null);

      if (result.success) {
        toast.success(t("transactions.loggedSuccess"));
        // Refresh to get updated data
        window.location.reload();
      } else {
        toast.error(result.error || t("common.error"));
      }
    },
    [recurring, toast, t]
  );

  const handleSkip = useCallback(
    async (id: string) => {
      setIsLoading(id);
      const result = await skipRecurringOccurrence(id);
      setIsLoading(null);

      if (result.success) {
        toast.success("Occurrence skipped");
        // Refresh to get updated next date
        window.location.reload();
      } else {
        toast.error(result.error || t("common.error"));
      }
    },
    [toast, t]
  );

  const handleStop = useCallback(
    async (id: string) => {
      setIsLoading(id);
      const result = await stopRecurring(id);
      setIsLoading(null);

      if (result.success) {
        toast.success("Recurring stopped");
        setRecurring(recurring.filter((r) => r.id !== id));
      } else {
        toast.error(result.error || t("common.error"));
      }
    },
    [recurring, toast, t]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<RecurringTransaction>) => {
      const result = await updateRecurringTransaction(id, {
        amount: updates.amount ?? undefined,
        category_id: updates.category_id ?? undefined,
        notes: updates.notes ?? undefined,
        recurring_interval: updates.recurring_interval ?? undefined,
        recurring_unit: updates.recurring_unit ?? undefined,
      });

      if (result.success) {
        toast.success(t("transactions.updateSuccess"));
        setEditingId(null);
        setRecurring(
          recurring.map((r) => (r.id === id ? { ...r, ...updates } : r))
        );
      } else {
        toast.error(result.error || t("common.error"));
      }
    },
    [recurring, toast, t]
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#00B9A7] via-[#00A896] to-[#0099A0] px-4 pt-6 pb-8 md:rounded-3xl md:mx-4 md:mt-4">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-extrabold text-white">
              {t("recurring.title") || "Recurring Transactions"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {t("recurring.description") || "Manage your recurring bills and income"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[#6B7280] dark:text-gray-400 text-xs">{t("recurring.total") || "Total"}</p>
            <p className="text-xl font-bold text-[#1A1A2E] dark:text-white">
              {recurring.length}
            </p>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-gray-700">
            <p className="text-[#6B7280] dark:text-gray-400 text-xs">{t("recurring.income") || "Income"}</p>
            <p className="text-xl font-bold text-[#00C48C]">
              {recurring.filter((r) => r.type === "income").length}
            </p>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-gray-700">
            <p className="text-[#6B7280] dark:text-gray-400 text-xs">{t("recurring.expenses") || "Expenses"}</p>
            <p className="text-xl font-bold text-[#FF5B5B]">
              {recurring.filter((r) => r.type === "expense").length}
            </p>
          </div>
        </div>
      </div>

      {/* Recurring List */}
      <div className="px-4 mt-6 space-y-3">
        {recurring.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#E6F7F6] dark:bg-[#00B9A7]/20 flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-8 h-8 text-[#00B9A7]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-white mb-2">
              {t("recurring.empty.title") || "No recurring transactions"}
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">
              {t("recurring.empty.description") || "Set up recurring bills or income to automate your tracking"}
            </p>
          </motion.div>
        ) : (
          recurring.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: item.categories?.color || "#6b7280" }}
                  >
                    {item.categories?.icon ? (
                      <span className="text-lg">{item.categories.icon}</span>
                    ) : (
                      <Repeat className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E] dark:text-white">
                      {item.categories?.name || "Unknown Category"}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400">
                      {item.recurring_interval} {item.recurring_unit}
                      {item.recurring_interval !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      item.type === "income" ? "text-[#00C48C]" : "text-[#FF5B5B]"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(item.amount)}
                  </p>
                  {item.recurring_next_date && (
                    <p className="text-xs text-[#6B7280] dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Next: {new Date(item.recurring_next_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                  {item.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={() => handleLog(item.id)}
                  isLoading={isLoading === item.id}
                  className="flex-1"
                >
                  {t("recurring.logNow") || "Log Now"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<SkipForward className="w-4 h-4" />}
                  onClick={() => handleSkip(item.id)}
                  isLoading={isLoading === `skip-${item.id}`}
                  className="flex-1"
                >
                  {t("recurring.skip") || "Skip"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<StopCircle className="w-4 h-4 text-[#FF5B5B]" />}
                  onClick={() => handleStop(item.id)}
                  isLoading={isLoading === `stop-${item.id}`}
                >
                  {t("recurring.stop") || "Stop"}
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
