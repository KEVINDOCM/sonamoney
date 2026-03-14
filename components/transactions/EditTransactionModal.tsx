"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CURRENCY_CONFIG, SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/utils/currency";
import type { Transaction, Category } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import TypeToggle from "@/components/ui/TypeToggle";
import CurrencySelector from "@/components/ui/CurrencySelector";

const transactionSchema = z.object({
    date: z.string().min(1, "Date is required"),
    type: z.enum(["income", "expense"]),
    categoryId: z.string().uuid("Please select a valid category"),
    payee: z.string().min(1, "Payee is required"),
    amount: z.string()
        .transform((val) => Number(val.replace(/\./g, "").replace(/,/g, "")))
        .refine((val) => !isNaN(val) && val > 0, { message: "Amount must be a valid number" }),
    notes: z.string().optional(),
});

type TransactionFormValues = z.input<typeof transactionSchema>;

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    categories: Category[];
    onSubmit: (data: {
        id: string;
        date: string;
        type: "income" | "expense";
        categoryId: string;
        amount: number;
        notes: string | null;
        currency?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    isLoading: boolean;
}

export const EditTransactionModal = ({ isOpen, onClose, transaction, categories, onSubmit, isLoading }: EditTransactionModalProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<string>("IDR");

    const { t, mounted } = useTranslation();

    const {
        watch,
        setValue,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TransactionFormValues>({
        defaultValues: {
            date: "",
            type: "expense",
            categoryId: "",
            payee: "",
            amount: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (isOpen && transaction) {
            const notes = transaction.notes || "";
            const payeeMatch = notes.match(/^Payee:\s*(.*)/i);
            const payee = payeeMatch ? payeeMatch[1].split('\n')[0].trim() : "";
            const actualNotes = notes.replace(/^Payee:.*\n?/i, "").replace(/^Notes:\s*/i, "").trim();

            // Set currency from transaction or default to IDR
            setSelectedCurrency(transaction.currency ?? "IDR");

            reset({
                date: transaction.date,
                type: transaction.type,
                categoryId: transaction.category_id,
                payee: payee,
                amount: String(transaction.amount),
                notes: actualNotes,
            });
        }
    }, [isOpen, transaction, reset]);

    const typeValue = watch("type");

    const onFormSubmit = async (values: TransactionFormValues) => {
        if (!transaction) return;

        const parsed = transactionSchema.safeParse(values);
        if (!parsed.success) {
            return;
        }

        const validatedData = parsed.data;

        const notesParts = [
            `Payee: ${validatedData.payee}`,
            validatedData.notes?.trim() ? `Notes: ${validatedData.notes.trim()}` : null,
        ].filter((part): part is string => Boolean(part));

        const combinedNotes = notesParts.length > 0 ? notesParts.join("\n") : null;

        await onSubmit({
            id: transaction.id,
            categoryId: validatedData.categoryId,
            amount: validatedData.amount,
            type: validatedData.type,
            date: validatedData.date,
            notes: combinedNotes,
            currency: selectedCurrency,
        });
    };

    return (
        <Modal title={mounted ? t("transactions.edit") : "Edit Transaction"} isOpen={isOpen} onClose={onClose}>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit(onFormSubmit)}>
                <Input
                    label="Date"
                    type="date"
                    error={errors.date?.message}
                    {...register("date")}
                />

                <TypeToggle
                    value={typeValue}
                    onChange={(value) => setValue("type", value)}
                    incomeLabel={mounted ? t("transactions.income") : "Income"}
                    expenseLabel={mounted ? t("transactions.expense") : "Expense"}
                />

                <div className="flex flex-col gap-1 relative">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</p>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-10 text-left text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 flex justify-between items-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <span>
                                {watch("categoryId")
                                    ? categories.find(c => c.id === watch("categoryId"))?.name || "Select category"
                                    : "Select category"}
                            </span>
                            <svg className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-900 border-t border-gray-50"
                                            onClick={() => {
                                                setValue("categoryId", category.id);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {errors.categoryId && (
                        <p className="text-xs text-rose-500 mt-1">{errors.categoryId.message}</p>
                    )}
                </div>

                <Input
                    label="Payee"
                    placeholder="e.g., Starbucks or Monthly Rent"
                    error={errors.payee?.message}
                    {...register("payee")}
                />

                <Input
                    label="Amount"
                    type="text"
                    placeholder="50.000"
                    error={errors.amount?.message}
                    {...register("amount")}
                />

                <CurrencySelector
                    value={selectedCurrency}
                    onChange={(currency) => setSelectedCurrency(currency)}
                />

                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes (optional)</p>
                    <textarea
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20 transition-all duration-200"
                        rows={3}
                        {...register("notes")}
                    />
                </div>

                <div className="sticky bottom-0 bg-white pt-3 pb-4 mt-2 -mx-4 px-4 flex flex-col-reverse lg:flex-row lg:justify-end gap-2 lg:gap-3 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full lg:w-auto"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full lg:w-auto"
                    >
                        Save changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
