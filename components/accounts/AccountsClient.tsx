"use client";

import { useState, useEffect } from "react";
import type { Account, AccountType, TransferWithAccounts } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { createAccount, updateAccount, deleteAccount, setDefaultAccount } from "@/lib/actions/accounts";
import { createTransfer, deleteTransfer } from "@/lib/actions/transfers";
import { formatCurrency, CURRENCY_CONFIG, SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { Plus, ArrowLeftRight, ArrowDown, X, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import CurrencySelector from "@/components/ui/CurrencySelector";
import { useUserData } from "@/lib/contexts/UserDataContext";
import { AccountCardList } from "./AccountCardList";
import { TransferHistoryList } from "./TransferHistoryList";
import { DeleteAccountModal } from "./DeleteAccountModal";

const ACCOUNT_TYPES = [
  { value: "reguler", label: "Reguler", icon: "📂" },
  { value: "tabungan", label: "Tabungan", icon: "🏦" },
  { value: "utang", label: "Utang", icon: "📑" },
];

const ACCOUNT_EMOJIS = [
  "💵", "💳", "🏦", "💰", "👛", "🏧", "💴", "💶", "💷", "🪙"
];

export interface AccountsClientProps {
  accounts: Account[];
  transfers: TransferWithAccounts[];
}

export function AccountsClient({ accounts, transfers }: AccountsClientProps) {
  const { accounts: contextAccounts, refetchAccounts } = useUserData();
  const [localAccounts, setLocalAccounts] = useState<Account[]>(contextAccounts);
  const [localTransfers, setLocalTransfers] = useState<TransferWithAccounts[]>(transfers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Transfer state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferNotes, setTransferNotes] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Add form state
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("reguler");
  const [icon, setIcon] = useState("💵");
  const [currency, setCurrency] = useState<string>("USD");

  const { toast, toasts, removeToast } = useToast();
  const { t, mounted } = useTranslation();
  const { baseCurrency, convert, rates } = useCurrency();

  // Sync localAccounts when context accounts change (e.g., after refetch)
  useEffect(() => {
    console.log('[AccountsClient] contextAccounts changed:', contextAccounts);
    console.log('[AccountsClient] contextAccounts.length:', contextAccounts?.length);
    setLocalAccounts(contextAccounts);
  }, [contextAccounts]);

  // Sync localTransfers when transfers prop changes
  useEffect(() => {
    setLocalTransfers(transfers);
  }, [transfers]);

  const handleAdd = async () => {
    if (!name.trim()) {
      setActionError(t("accounts.nameRequired"));
      return;
    }

    setIsSubmitting(true);
    setActionError("");

    const result = await createAccount({
      name: name.trim(),
      type,
      icon,
      currency,
    });

    setIsSubmitting(false);

    if (result.error) {
      setActionError(result.error);
      toast.error(result.error);
      return;
    }

    // The account was created - refetch to get the new account with server-generated ID
    toast.success(t("accounts.accountAdded"));
    setIsAddOpen(false);
    setName("");
    setType("reguler");
    setIcon("💵");

    // Refetch accounts to update context and local state
    console.log('[AccountsClient] Starting refetchAccounts...');
    await refetchAccounts();
    console.log('[AccountsClient] refetchAccounts completed');
  };

  const handleEdit = async () => {
    if (!editingAccount || !name.trim()) {
      setActionError("Account name is required");
      return;
    }

    setIsSubmitting(true);
    setActionError("");

    const result = await updateAccount(editingAccount.id, {
      name: name.trim(),
      type,
      icon,
    });

    setIsSubmitting(false);

    if (result.error) {
      setActionError(result.error);
      toast.error(result.error);
      return;
    }

    // Update local state
    setLocalAccounts((current) =>
      current.map((acc) =>
        acc.id === editingAccount.id
          ? { ...acc, name: name.trim(), type, icon }
          : acc
      )
    );

    toast.success(t("accounts.accountUpdated"));
    setIsEditOpen(false);
    setEditingAccount(null);
    setName("");
    setType("reguler");
    setIcon("💵");
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;

    setIsSubmitting(true);

    const result = await deleteAccount(deletingAccount.id);

    setIsSubmitting(false);

    if (result.error) {
      setActionError(result.error);
      toast.error(result.error);
      return;
    }

    setLocalAccounts((current) =>
      current.filter((acc) => acc.id !== deletingAccount.id)
    );

    toast.success(t("accounts.accountDeleted"));
    setIsDeleteOpen(false);
    setDeletingAccount(null);
  };

  const handleOpenEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setIcon(account.icon ?? "💵");
    setCurrency(account.currency ?? "USD");
    setActionError("");
    setIsEditOpen(true);
  };

  const handleOpenAddModal = () => {
    setName("");
    setType("reguler");
    setIcon("💵");
    setCurrency("USD");
    setActionError("");
    setIsAddOpen(true);
  };

  const handleOpenDeleteModal = (account: Account) => {
    setDeletingAccount(account);
    setIsDeleteOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultAccount(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("accounts.setDefaultSuccess") || "Default account updated");
      // Update local state to reflect the change
      setLocalAccounts((current) =>
        current.map((acc) => ({
          ...acc,
          is_default: acc.id === id,
        }))
      );
    }
  };

  // Transfer handlers
  async function handleTransfer() {
    if (!transferFrom || !transferTo || !transferAmount) return;
    setIsTransferring(true);
    const fromAcc = localAccounts.find(
      (a) => a.id === transferFrom
    )
    const toAcc = localAccounts.find(
      (a) => a.id === transferTo
    )
    const result = await createTransfer({
      from_account_id: transferFrom,
      to_account_id: transferTo,
      amount: Number(transferAmount),
      from_currency: fromAcc?.currency ?? "IDR",
      to_currency: toAcc?.currency ?? "IDR",
      exchange_rate: 1,
      converted_amount: Number(transferAmount),
      date: transferDate,
      notes: transferNotes || undefined,
    });
    setIsTransferring(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("accounts.transferCompleted"));
      setIsTransferOpen(false);
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount("");
      setTransferNotes("");
      // Optimistic: update local account balances
      setLocalAccounts(prev => prev.map(acc => {
        if (acc.id === transferFrom) {
          return { ...acc, balance: acc.balance - Number(transferAmount) };
        }
        if (acc.id === transferTo) {
          return { ...acc, balance: acc.balance + Number(transferAmount) };
        }
        return acc;
      }));
    }
  }

  async function handleDeleteTransfer(id: string) {
    const result = await deleteTransfer(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("accounts.transferDeleted"));
      // Remove from local state and refresh balances
      const transfer = localTransfers.find(t => t.id === id);
      if (transfer) {
        setLocalAccounts(prev => prev.map(acc => {
          if (acc.id === transfer.from_account_id) {
            return { ...acc, balance: acc.balance + transfer.amount };
          }
          if (acc.id === transfer.to_account_id) {
            return { ...acc, balance: acc.balance - transfer.amount };
          }
          return acc;
        }));
        setLocalTransfers(prev => prev.filter(t => t.id !== id));
      }
    }
  }

  return (
    <div className="page-container">
      <div className="px-4 pt-4 pb-0 md:px-0 md:pt-0 mb-4">
        <h1 className="page-title">
          {mounted ? t("nav.accounts") : "Accounts"}
        </h1>
        <p className="section-subtitle mt-0.5">
          {mounted ? t("accounts.description") : "Manage your financial accounts"}
        </p>
      </div>

      <div className="px-4 md:px-0">
        {/* DEBUG: Log what's being passed to AccountCardList */}
        {(() => { console.log('[AccountsClient] Rendering AccountCardList with localAccounts:', localAccounts); return null; })()}
        <AccountCardList
          accounts={localAccounts}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onSetDefault={handleSetDefault}
          mounted={mounted}
          t={t}
          baseCurrency={baseCurrency}
          convert={convert}
        />
      </div>

      <div className="
        flex flex-col sm:flex-row
        gap-3 mt-4 px-4 md:px-0
      ">
        <Button
          onClick={() => setIsTransferOpen(true)}
          variant="secondary"
          leftIcon={<ArrowLeftRight className="h-4 w-4" />}
        >
          {mounted ? t("accounts.transfer") : "Transfer"}
        </Button>
        <button
          onClick={handleOpenAddModal}
          className="
            flex-1 border-2 border-dashed
            border-slate-200 dark:border-slate-700
            rounded-xl p-4
            flex items-center justify-center gap-2
            text-sm text-slate-500 dark:text-slate-400
            hover:border-teal-500 dark:hover:border-teal-500
            hover:text-teal-600 dark:hover:text-teal-400
            transition-all duration-200
            active:scale-[0.98]
          "
        >
          <Plus className="h-4 w-4" /> {mounted ? t("accounts.addAccount") : "Add account"}
        </button>
      </div>

      <div className="px-4 md:px-0">
        <TransferHistoryList
          transfers={localTransfers}
          accounts={localAccounts}
          onDelete={handleDeleteTransfer}
          mounted={mounted}
          t={t}
        />
      </div>

      {/* Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white">{mounted ? t("accounts.transferTitle") : "Transfer"}</h2>
              <button onClick={() => setIsTransferOpen(false)} title={mounted ? t("common.close") : "Close modal"}
                className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* From Account */}
            <div className="mb-4">
              <label htmlFor="transfer-from" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{mounted ? t("accounts.from") : "From"}</label>
              <select
                id="transfer-from"
                value={transferFrom}
                onChange={e => setTransferFrom(e.target.value)}
                className="w-full h-11 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all"
              >
                <option value="">{mounted ? t("accounts.selectAccount") : "Select account"}</option>
                {localAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon} {acc.name} —{" "}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: acc.currency,
                      maximumFractionDigits: 0,
                    }).format(acc.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow Icon centered */}
            <div className="flex justify-center mb-4">
              <div className="h-8 w-8 rounded-full bg-[#E6F7F6] dark:bg-[#00B9A7]/20 flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-[#00B9A7]" />
              </div>
            </div>

            {/* To Account */}
            <div className="mb-4">
              <label htmlFor="transfer-to" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{mounted ? t("accounts.to") : "To"}</label>
              <select
                id="transfer-to"
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                className="w-full h-11 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all"
              >
                <option value="">{mounted ? t("accounts.selectAccount") : "Select account"}</option>
                {localAccounts
                  .filter(acc => acc.id !== transferFrom)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon} {acc.name} —{" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: acc.currency,
                        maximumFractionDigits: 0,
                      }).format(acc.balance)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{mounted ? t("accounts.amount") : "Amount"}</label>
              <input
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="0"
                className="w-full h-11 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all"
              />
              {/* Insufficient balance warning */}
              {(() => {
                const fromAcc = localAccounts.find(
                  (a) => a.id === transferFrom
                )
                const amount = Number(transferAmount)
                const isInsufficient =
                  fromAcc !== undefined && amount > 0 &&
                  amount > fromAcc.balance

                if (!isInsufficient) return null

                return (
                  <p className="
                    text-xs text-[#FF5B5B]
                    flex items-center gap-1 mt-1
                  ">
                    ⚠️ Insufficient balance.
                    Available:{" "}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: fromAcc?.currency ?? "IDR",
                      maximumFractionDigits: 0,
                    }).format(fromAcc?.balance ?? 0)}
                  </p>
                )
              })()}
              {/* Cross-currency info */}
              {(() => {
                const fromAcc = localAccounts.find(
                  (a) => a.id === transferFrom
                )
                const toAcc = localAccounts.find(
                  (a) => a.id === transferTo
                )
                const isCross =
                  fromAcc !== undefined && toAcc !== undefined &&
                  fromAcc.currency !== toAcc.currency

                if (!isCross || !transferAmount) return null

                return (
                  <div className="
                    bg-[#E6F7F6] dark:bg-[#00B9A7]/10
                    rounded-xl p-3
                    flex items-center gap-2
                  ">
                    <span className="text-sm">💱</span>
                    <p className="text-xs text-[#00B9A7] font-medium">
                      Cross-currency transfer:{" "}
                      {fromAcc?.currency} → {toAcc?.currency}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label htmlFor="transfer-date" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{mounted ? t("accounts.date") : "Date"}</label>
              <input
                id="transfer-date"
                type="date"
                value={transferDate}
                onChange={e => setTransferDate(e.target.value)}
                className="w-full h-11 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all"
              />
            </div>

            {/* Notes (optional) */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                {mounted ? t("accounts.notes") : "Notes"} <span className="text-gray-300 dark:text-gray-600">({mounted ? t("common.optional") : "optional"})</span>
              </label>
              <input
                type="text"
                value={transferNotes}
                onChange={e => setTransferNotes(e.target.value)}
                placeholder={mounted ? t("accounts.notesPlaceholder") : "e.g. Monthly savings"}
                className="w-full h-11 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsTransferOpen(false)}
                className="flex-1 h-11 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-[#6B7280] hover:bg-gray-50 active:scale-95 transition-all duration-200"
              >
                {mounted ? t("common.cancel") : "Cancel"}
              </button>
              <button
                onClick={handleTransfer}
                disabled={
                  isTransferring ||
                  !transferFrom ||
                  !transferTo ||
                  !transferAmount ||
                  (() => {
                    const fromAcc = localAccounts.find(
                      (a) => a.id === transferFrom
                    )
                    const amount = Number(transferAmount)
                    return (
                      fromAcc !== undefined &&
                      amount > 0 &&
                      amount > fromAcc.balance
                    )
                  })()
                }
                className="flex-1 h-11 bg-[#00B9A7] hover:bg-[#0099A0] disabled:opacity-50 text-white text-sm font-semibold rounded-full active:scale-95 transition-all duration-200"
              >
                {isTransferring ? (mounted ? t("accounts.processing") : "Processing...") : (mounted ? t("accounts.transfer") : "Transfer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        title={mounted ? t("accounts.add") : "Add account"}
        description={mounted ? t("accounts.addDescription") : "Create a new financial account."}
        onClose={() => setIsAddOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Input
            label={mounted ? t("accounts.name") : "Name"}
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder={mounted ? t("accounts.namePlaceholder") : "e.g. Bank BCA"}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{mounted ? t("accounts.type") : "Type"}</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map((accountType) => (
                <button
                  key={accountType.value}
                  onClick={() => setType(accountType.value as AccountType)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors duration-200 ${
                    type === accountType.value
                      ? "border-gold-500 bg-gold-50 dark:bg-[#00B9A7]/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="text-xl">{accountType.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {accountType.value === "reguler" ? (mounted ? t("accounts.typeRegular") : "Reguler") :
                     accountType.value === "tabungan" ? (mounted ? t("accounts.typeSavings") : "Tabungan") :
                     (mounted ? t("accounts.typeDebt") : "Utang")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{mounted ? t("accounts.icon") : "Icon"}</label>
            <div className="grid grid-cols-5 gap-2">
              {ACCOUNT_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-colors duration-200 ${
                    icon === e
                      ? "bg-gold-50 dark:bg-[#00B9A7]/20 border border-gold-200 dark:border-[#00B9A7]/30"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{mounted ? t("common.currency") : "Currency"}</label>
            <CurrencySelector
              value={currency}
              onChange={(c) => setCurrency(c)}
              currencies={["USD", "IDR"]}
              label=""
            />
          </div>

          {actionError && (
            <p className="text-sm text-rose-500">{actionError}</p>
          )}

          <div className="flex flex-col-reverse lg:flex-row lg:justify-end gap-2 lg:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="
                w-full lg:w-auto h-11 px-6
                rounded-full border border-gray-200
                dark:border-gray-700
                text-sm font-semibold
                text-[#6B7280] dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800
                active:scale-95
                transition-all duration-200
              "
            >
              {mounted ? t("common.cancel") : "Cancel"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAdd}
              className="
                w-full lg:w-auto h-11 px-6
                rounded-full bg-[#00B9A7] text-white
                text-sm font-semibold
                hover:bg-[#0099A0]
                active:scale-95
                transition-all duration-200
                disabled:opacity-50
              "
            >
              {mounted ? t("common.save") : "Add account"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        title={mounted ? t("accounts.edit") : "Edit account"}
        description={mounted ? t("accounts.editDescription") : "Update account details."}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Input
            label={mounted ? t("accounts.name") : "Name"}
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder={mounted ? t("accounts.namePlaceholder") : "e.g. Bank BCA"}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{mounted ? t("accounts.type") : "Type"}</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map((accountType) => (
                <button
                  key={accountType.value}
                  onClick={() => setType(accountType.value as AccountType)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors duration-200 ${
                    type === accountType.value
                      ? "border-[#00B9A7] bg-[#E6F7F6] dark:bg-[#00B9A7]/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-[#00B9A7]/50"
                  }`}
                >
                  <span className="text-xl">{accountType.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {accountType.value === "reguler" ? (mounted ? t("accounts.typeRegular") : "Reguler") :
                     accountType.value === "tabungan" ? (mounted ? t("accounts.typeSavings") : "Tabungan") :
                     (mounted ? t("accounts.typeDebt") : "Utang")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{mounted ? t("accounts.icon") : "Icon"}</label>
            <div className="grid grid-cols-5 gap-2">
              {ACCOUNT_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-colors duration-200 ${
                    icon === e
                      ? "bg-[#E6F7F6] dark:bg-[#00B9A7]/20 border border-[#00B9A7]/30 dark:border-[#00B9A7]/30"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{mounted ? t("common.currency") : "Currency"}</label>
            <CurrencySelector
              value={currency}
              onChange={(c) => setCurrency(c)}
              currencies={["USD", "IDR"]}
              label=""
            />
          </div>

          {actionError && (
            <p className="text-sm text-rose-500">{actionError}</p>
          )}

          <div className="flex flex-col-reverse lg:flex-row lg:justify-end gap-2 lg:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="
                w-full lg:w-auto h-11 px-6
                rounded-full border border-gray-200
                dark:border-gray-700
                text-sm font-semibold
                text-[#6B7280] dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800
                active:scale-95
                transition-all duration-200
              "
            >
              {mounted ? t("common.cancel") : "Cancel"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleEdit}
              className="
                w-full lg:w-auto h-11 px-6
                rounded-full bg-[#00B9A7] text-white
                text-sm font-semibold
                hover:bg-[#0099A0]
                active:scale-95
                transition-all duration-200
                disabled:opacity-50
              "
            >
              {mounted ? t("common.save") : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>

      <DeleteAccountModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        accountName={deletingAccount?.name ?? ""}
        mounted={mounted}
        t={t}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
