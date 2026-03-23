"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CURRENCY_CONFIG, SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/utils/currency";
import type { Category, Account } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import TypeToggle from "@/components/ui/TypeToggle";
import CurrencySelector from "@/components/ui/CurrencySelector";
import { ReceiptScanner } from "@/components/transactions/ReceiptScanner";
import { Camera } from "lucide-react";

// Client-side helper to compute next recurring date
function computeNextDateClient(
  fromDate: string,
  interval: number,
  unit: string
): string {
  const d = new Date(fromDate);
  if (unit === "month") d.setMonth(d.getMonth() + interval);
  else if (unit === "week") d.setDate(d.getDate() + interval * 7);
  else if (unit === "day") d.setDate(d.getDate() + interval);
  return d.toISOString().slice(0, 10);
}

const CREATE_NEW_CATEGORY_VALUE = "__create_new_category__";

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
type TransactionOutputValues = z.infer<typeof transactionSchema>;

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  onSubmit: (data: {
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
    currency?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export const NewTransactionModal = ({ isOpen, onClose, categories, accounts, onSubmit, isLoading }: NewTransactionModalProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const { t, mounted } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<number>(1);
  const [recurringUnit, setRecurringUnit] = useState<string>("month");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("IDR");
  const [taxRate, setTaxRate] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Get currency from selected account (for display purposes)
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const transactionCurrency = selectedCurrency;

  const {
    watch,
    setValue,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      categoryId: "",
      payee: "",
      amount: "",
      notes: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        categoryId: "",
        payee: "",
        amount: "",
        notes: "",
      });
      setIsRecurring(false);
      setRecurringInterval(1);
      setRecurringUnit("month");
      setSelectedAccountId(null);
      setSelectedCurrency("IDR");
      setTaxRate("");
      setCommissionRate("");
    }
  }, [isOpen, reset]);

  const typeValue = watch("type");

  if (!isMounted) {
    return null;
  }

  const onFormSubmit = async (values: TransactionFormValues) => {
    if (categories.length === 0) {
      setError("categoryId", { type: "manual", message: "Please create a category first" });
      return;
    }

    const parsed = transactionSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }

    const validatedData = parsed.data;

    const categoryId = validatedData.categoryId;
    if (!categoryId) {
      setError("categoryId", { type: "manual", message: "Category is required" });
      return;
    }

    const notesParts = [
      `Payee: ${validatedData.payee}`,
      validatedData.notes?.trim() ? `Notes: ${validatedData.notes.trim()}` : null,
    ].filter((part): part is string => Boolean(part));

    const combinedNotes = notesParts.length > 0 ? notesParts.join("\n") : null;

    // Compute next date if recurring
    const nextDate = isRecurring
      ? computeNextDateClient(validatedData.date, recurringInterval, recurringUnit)
      : null;

    await onSubmit({
      categoryId,
      amount: validatedData.amount,
      type: validatedData.type,
      date: validatedData.date,
      notes: combinedNotes,
      is_recurring: isRecurring,
      recurring_interval: isRecurring ? recurringInterval : null,
      recurring_unit: isRecurring ? recurringUnit : null,
      recurring_next_date: nextDate,
      account_id: selectedAccountId,
      tax_rate: taxRate ? Number(taxRate) : null,
      commission_rate: commissionRate ? Number(commissionRate) : null,
      currency: selectedCurrency,
    });
  };

  function handleScanComplete(data: {
    merchant: string | null
    date: string | null
    total: number | null
    currency: string | null
    items: Array<{ name: string; amount: number }>
    category: string | null
    notes: string | null
  }) {
    if (data.merchant) {
      setValue("payee", data.merchant)
    }
    if (data.date) {
      setValue("date", data.date)
    }
    if (data.total) {
      setValue("amount", String(data.total))
    }
    if (data.notes) {
      setValue("notes", data.notes)
    }
    if (data.category && categories.length > 0) {
      const matched = categories.find(
        (c) =>
          c.name.toLowerCase().includes(data.category!.toLowerCase()) ||
          data.category!.toLowerCase().includes(c.name.toLowerCase())
      )
      if (matched) {
        setValue("categoryId", matched.id)
      }
    }
    if (data.currency) {
      setSelectedCurrency(data.currency)
    }
    setShowScanner(false)
  }

  return (
    <Modal title={mounted ? t("transactions.add") : "Add Transaction"} isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(onFormSubmit)}
      >
        {showScanner ? (
          <ReceiptScanner
            onScanComplete={handleScanComplete}
            onClose={() => setShowScanner(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            aria-label="Scan receipt to auto-fill transaction details"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#00B9A7] hover:bg-[#E6F7F6] transition-[border-color,background-color] duration-200 text-sm font-medium text-gray-500 hover:text-[#00B9A7]"
          >
            <Camera className="w-4 h-4" />
            Scan Receipt
          </button>
        )}

        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register("date", { required: "Date is required" })}
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
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-controls="category-dropdown"
              className="w-full h-10 text-left text-base lg:text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-[border-color,box-shadow] duration-200 flex justify-between items-center bg-white"
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
                <div id="category-dropdown" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-500"
                    onClick={() => {
                      setValue("categoryId", "");
                      setIsDropdownOpen(false);
                    }}
                  >
                    Select category
                  </button>
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
          {...register("payee", { required: "Payee is required" })}
        />

        <Input
          label="Amount"
          type="text"
          placeholder={mounted ? t("transactions.amountPlaceholder") : "e.g., 50.000 or 50000"}
          error={errors.amount?.message}
          {...register("amount")}
        />

        <CurrencySelector
          value={selectedCurrency}
          onChange={(currency) => setSelectedCurrency(currency)}
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="transaction-notes"
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            Notes (optional)
          </label>
          <textarea
            id="transaction-notes"
            className="w-full text-base lg:text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20 transition-[border-color,box-shadow] duration-200"
            rows={3}
            {...register("notes")}
          />
          {errors.notes && (
            <p className="text-xs text-rose-500 mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Account <span className="text-gray-300">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setSelectedAccountId(
                      selectedAccountId === acc.id ? null : acc.id
                    );
                    // Auto-set currency based on account, but allow user to override
                    const accountCurrency = acc.currency ?? "IDR";
                    setSelectedCurrency(accountCurrency);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors duration-200 ${
                    selectedAccountId === acc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{acc.icon ?? "💰"}</span>
                  <span className="text-xs font-medium text-gray-700">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tax and Commission Fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="tax-rate" className="text-xs font-medium text-gray-500 mb-1.5 block">
              Tax % <span className="text-gray-300">(optional)</span>
            </label>
            <input
              id="tax-rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="e.g. 11"
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="commission-rate" className="text-xs font-medium text-gray-500 mb-1.5 block">
              Commission % <span className="text-gray-300">(optional)</span>
            </label>
            <input
              id="commission-rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="e.g. 5"
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Amount Preview */}
        {(taxRate || commissionRate) && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs space-y-1" aria-live="polite" aria-atomic="true">
            <div className="flex justify-between text-gray-500">
              <span>Original amount</span>
              <span>{formatCurrency(Number(watch("amount").replace(/\./g, "").replace(/,/g, "")) || 0, transactionCurrency)}</span>
            </div>
            {taxRate && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({taxRate}%)</span>
                <span>+{formatCurrency((Number(watch("amount").replace(/\./g, "").replace(/,/g, "")) || 0) * Number(taxRate) / 100, transactionCurrency)}</span>
              </div>
            )}
            {commissionRate && (
              <div className="flex justify-between text-gray-500">
                <span>Commission ({commissionRate}%)</span>
                <span>-{formatCurrency((Number(watch("amount").replace(/\./g, "").replace(/,/g, "")) || 0) * Number(commissionRate) / 100, transactionCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1 mt-1">
              <span>Net amount</span>
              <span>{formatCurrency(
                (Number(watch("amount").replace(/\./g, "").replace(/,/g, "")) || 0) +
                (taxRate ? (Number(watch("amount").replace(/\./g, "").replace(/,/g, "")) || 0) * Number(taxRate) / 100 : 0) -
                (commissionRate ? (Number(watch("amount").replace(/\./g, "").replace(/,/g, "")) || 0) * Number(commissionRate) / 100 : 0),
                transactionCurrency
              )}</span>
            </div>
          </div>
        )}

        {/* Recurring Transaction Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Recurring transaction</p>
            <p className="text-xs text-gray-400">Repeats on a schedule</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            aria-checked={isRecurring}
            role="switch"
            className={`relative inline-flex h-6 w-11 items-center rounded-full motion-safe:transition-[background-color] motion-safe:duration-300 motion-reduce:transition-none ${
              isRecurring ? "bg-blue-600" : "bg-gray-200"
            }`}
            title={isRecurring ? "Disable recurring" : "Enable recurring"}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm motion-safe:transition-transform motion-safe:duration-300 motion-reduce:transition-none ${
              isRecurring ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        {/* Interval Selector - only when recurring */}
        {isRecurring && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Every</span>
            <input
              type="number"
              min={1}
              max={365}
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(Number(e.target.value))}
              className="w-16 h-9 border border-gray-200 rounded-lg px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              title="Recurring interval"
              aria-label={mounted ? t("transactions.recurringInterval") : "Recurring interval"}
            />
            <select
              value={recurringUnit}
              onChange={(e) => setRecurringUnit(e.target.value)}
              className="h-9 border border-gray-200 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              title="Recurring unit"
              aria-label={mounted ? t("transactions.recurringUnit") : "Recurring unit"}
            >
              <option value="day">Day(s)</option>
              <option value="week">Week(s)</option>
              <option value="month">Month(s)</option>
            </select>
          </div>
        )}

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
            Save transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
};