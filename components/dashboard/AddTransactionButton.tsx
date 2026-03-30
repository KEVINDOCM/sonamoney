"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { NewTransactionModal } from "@/components/transactions/NewTransactionModal";
import { TransactionLimitModal } from "@/components/guest/TransactionLimitModal";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { createTransactionApi } from "@/lib/api/transactions";
import { useToast } from "@/lib/hooks/useToast";
import { useUserData } from "@/lib/contexts/UserDataContext";
import { useTransactionLimit } from "@/lib/guest/hooks/useTransactionLimit";
import { useGuestTransactions } from "@/lib/guest/hooks/useGuestTransactions";
import { dispatchTransactionUpdate } from "@/lib/guest/hooks/useTransactionLimit";

export function AddTransactionButton() {
  const { categories, isGuest } = useUserData();
  const [isOpen, setIsOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Guest mode hooks
  const { hasReachedLimit } = useTransactionLimit();
  const { addTransaction: addGuestTransaction } = useGuestTransactions();

  const handleClick = () => {
    if (isGuest && hasReachedLimit) {
      setIsLimitModalOpen(true);
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async (data: {
    date: string;
    type: "income" | "expense";
    categoryId: string;
    amount: number;
    notes: string | null;
    is_recurring: boolean;
    recurring_interval: number | null;
    recurring_unit: string | null;
    recurring_next_date: string | null;
    tax_rate?: number | null;
    commission_rate?: number | null;
    currency?: string;
  }) => {
    // If guest mode, save to localStorage
    if (isGuest) {
      if (hasReachedLimit) {
        setIsLimitModalOpen(true);
        return { success: false, error: "Transaction limit reached" };
      }
      
      setIsLoading(true);
      try {
        addGuestTransaction({
          category_id: data.categoryId,
          amount: data.amount,
          type: data.type,
          date: data.date,
          notes: data.notes,
          is_recurring: data.is_recurring,
          recurring_interval: data.recurring_interval,
          recurring_unit: data.recurring_unit as 'day' | 'week' | 'month' | null,
          recurring_next_date: data.recurring_next_date,
          currency: data.currency || 'IDR',
        });
        
        // Dispatch event to update limit counter
        dispatchTransactionUpdate();
        
        toast.success(t("transactions.addedSuccess"));
        setIsOpen(false);
        // Refresh the page to show new transaction
        window.location.reload();
        return { success: true };
      } catch {
        toast.error(t("common.error") || "Failed to add transaction");
        return { success: false, error: "Failed to add transaction" };
      } finally {
        setIsLoading(false);
      }
    }

    // Authenticated mode - use API
    setIsLoading(true);
    const result = await createTransactionApi({
      category_id: data.categoryId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      notes: data.notes ?? undefined,
      is_recurring: data.is_recurring,
      recurring_interval: data.recurring_interval ?? undefined,
      recurring_unit: data.recurring_unit ?? undefined,
      recurring_next_date: data.recurring_next_date ?? undefined,
    });
    setIsLoading(false);

    if (result.success) {
      toast.success(t("transactions.addedSuccess"));
      setIsOpen(false);
      // Refresh the page to show new transaction
      window.location.reload();
    } else {
      toast.error(result.error ?? t("common.error"));
    }

    return result;
  };

  return (
    <>
      <Button onClick={handleClick} className="w-full lg:w-auto">
        {t("transactions.add")}
      </Button>
      <NewTransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      <TransactionLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        transactionCount={10}
      />
    </>
  );
}
