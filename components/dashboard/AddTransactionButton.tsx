"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { NewTransactionModal } from "@/components/transactions/NewTransactionModal";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { createTransaction } from "@/lib/actions/transactions";
import { useToast } from "@/lib/hooks/useToast";
import { useUserData } from "@/lib/contexts/UserDataContext";

export function AddTransactionButton() {
  const { categories, accounts } = useUserData();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

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
    account_id?: string | null;
    tax_rate?: number | null;
    commission_rate?: number | null;
  }) => {
    setIsLoading(true);
    const result = await createTransaction({
      category_id: data.categoryId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      notes: data.notes ?? undefined,
      is_recurring: data.is_recurring,
      recurring_interval: data.recurring_interval ?? undefined,
      recurring_unit: data.recurring_unit ?? undefined,
      recurring_next_date: data.recurring_next_date ?? undefined,
      account_id: data.account_id ?? undefined,
      tax_rate: data.tax_rate ?? undefined,
      commission_rate: data.commission_rate ?? undefined,
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
      <Button onClick={() => setIsOpen(true)} className="w-full lg:w-auto">
        {t("transactions.add")}
      </Button>
      <NewTransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        categories={categories}
        accounts={accounts}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}

