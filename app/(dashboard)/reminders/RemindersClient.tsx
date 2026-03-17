"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";

interface UpcomingBill {
  id: string;
  transaction_id: string;
  amount: number;
  type: "income" | "expense";
  category_name: string;
  category_color: string;
  notes: string | null;
  next_date: string;
  days_remaining: number;
}

interface RemindersClientProps {
  initialBills: UpcomingBill[];
}

export function RemindersClient({ initialBills }: RemindersClientProps) {
  const [bills] = useState<UpcomingBill[]>(initialBills);
  const { t, mounted } = useTranslation();
  const { toast } = useToast();

  if (!mounted) {
    return null;
  }

  const getDaysText = (days: number) => {
    if (days === 0) return t("reminders.today") || "Today";
    if (days === 1) return t("reminders.tomorrow") || "Tomorrow";
    if (days < 0) return t("reminders.overdue") || "Overdue";
    return `${days} ${t("reminders.days") || "days"}`;
  };

  const getDaysColor = (days: number) => {
    if (days <= 0) return "text-red-600 bg-red-50";
    if (days <= 3) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  };

  const totalDue = bills
    .filter((b) => b.type === "expense" && b.days_remaining <= 7)
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#6366F1] via-[#5856EB] to-[#4F46E5] px-4 pt-6 pb-8 md:rounded-3xl md:mx-4 md:mt-4">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-extrabold text-white">
              {t("reminders.title") || "Bill Reminders"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {t("reminders.description") || "Never miss a payment deadline"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#6B7280] dark:text-gray-400 text-xs">
                {t("reminders.dueThisWeek") || "Due This Week"}
              </p>
              <p className="text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(totalDue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#6B7280] dark:text-gray-400 text-xs">
                {t("reminders.upcoming") || "Upcoming Bills"}
              </p>
              <p className="text-2xl font-bold text-[#6366F1]">
                {bills.filter((b) => b.days_remaining <= 7).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="px-4 mt-6 space-y-3">
        {bills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#E0E7FF] dark:bg-[#6366F1]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#6366F1]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-white mb-2">
              {t("reminders.allCaughtUp") || "All caught up!"}
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">
              {t("reminders.noUpcoming") || "No bills due in the next 30 days"}
            </p>
          </motion.div>
        ) : (
          bills.map((bill, index) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: bill.category_color }}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E] dark:text-white">
                      {bill.category_name}
                    </p>
                    {bill.notes && (
                      <p className="text-xs text-[#6B7280] dark:text-gray-400">
                        {bill.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#FF5B5B]">
                    -
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(bill.amount)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getDaysColor(
                      bill.days_remaining
                    )}`}
                  >
                    {bill.days_remaining <= 0 ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {getDaysText(bill.days_remaining)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-[#6B7280] dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {t("reminders.dueDate") || "Due"}:{" "}
                  {new Date(bill.next_date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* CTA */}
      <div className="px-4 mt-6">
        <Link href="/recurring">
          <Button
            variant="secondary"
            className="w-full"
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
          >
            {t("reminders.manageRecurring") || "Manage Recurring Bills"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
