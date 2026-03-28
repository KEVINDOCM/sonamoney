"use client";

import { FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  formState: {
    name: string;
    type: string;
    budgetLimit: string;
  };
  onInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  labels: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    type: string;
    expense: string;
    income: string;
    budgetLimit: string;
    budgetLimitPlaceholder: string;
    cancel: string;
    save: string;
  };
}

export function EditCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  formState,
  onInputChange,
  labels,
}: EditCategoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={labels.title}
      description={labels.description}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          label={labels.name}
          name="name"
          placeholder={labels.namePlaceholder}
          value={formState.name}
          onChange={onInputChange}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="type">
            {labels.type}
          </label>
          <select
            id="type"
            name="type"
            value={formState.type}
            onChange={onInputChange}
            className="w-full h-11 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all duration-200"
          >
            <option value="expense">{labels.expense}</option>
            <option value="income">{labels.income}</option>
          </select>
        </div>

        <Input
          label={labels.budgetLimit}
          name="budgetLimit"
          type="number"
          placeholder={labels.budgetLimitPlaceholder}
          value={formState.budgetLimit}
          onChange={onInputChange}
        />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            className="
              w-full sm:w-auto h-11 px-6
              rounded-full border border-gray-200
              dark:border-gray-700
              text-sm font-semibold text-[#6B7280]
              hover:bg-gray-50 dark:hover:bg-gray-800
              active:scale-95 transition-all duration-200
            "
            onClick={onClose}
          >
            {labels.cancel}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full sm:w-auto h-11 px-6
              rounded-full bg-[#00B9A7] text-white
              text-sm font-semibold
              hover:bg-[#0099A0]
              disabled:opacity-50
              active:scale-95 transition-all duration-200
            "
          >
            {labels.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
