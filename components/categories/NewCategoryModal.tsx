"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useNewCategory } from "@/hooks/useNewCategory";
import { useToast } from "@/components/ui/ToastProvider";
import { createCategory } from "@/lib/actions/categories";
import type { CategoryType } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import TypeToggle from "@/components/ui/TypeToggle";

const COLOR_OPTIONS: string[] = [
  "#3b82f6",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
];

const DEFAULT_COLOR = COLOR_OPTIONS[0];
const DEFAULT_TYPE: CategoryType = "expense";

export function NewCategoryModal() {
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen, onClose } = useNewCategory();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(DEFAULT_TYPE);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [nameError, setNameError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetForm = () => {
    setName("");
    setType(DEFAULT_TYPE);
    setColor(DEFAULT_COLOR);
    setNameError("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t("categories.nameRequired"));
      return;
    }

    setNameError("");
    setIsSubmitting(true);

    const result = await createCategory({ name: trimmedName, type, color });

    if (!result.success) {
      showError(result.error ?? t("common.error"));
      setIsSubmitting(false);
      return;
    }

    showSuccess(t("categories.addedSuccess"));
    resetForm();
    // Do not close modal after saving
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isMounted ? t("categories.add") : "Add category"}
      description={isMounted ? t("categories.addDescription") : "Create a new income or expense category."}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="category-name"
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {isMounted ? t("categories.name") : "Category Name"}
          </label>
          <input
            id="category-name"
            type="text"
            placeholder={isMounted ? t("categories.namePlaceholder") : "e.g. Groceries"}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError("");
            }}
            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-base lg:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          {nameError && (
            <p className="text-xs text-rose-500 mt-1">{nameError}</p>
          )}
        </div>

        <TypeToggle
          value={type}
          onChange={(value) => setType(value)}
          incomeLabel={isMounted ? t("categories.income") : "Income"}
          expenseLabel={isMounted ? t("categories.expense") : "Expense"}
        />



        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-3 pb-4 mt-2 -mx-4 px-4 flex flex-col-reverse lg:flex-row lg:justify-end gap-2 lg:gap-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full lg:w-auto"
          >
            {isMounted ? t("common.cancel") : "Cancel"}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full lg:w-auto"
          >
            {isMounted ? t("common.save") : "Save Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

