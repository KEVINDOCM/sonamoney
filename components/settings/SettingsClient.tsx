"use client";

import { useState } from "react";
import { User, Lock, Trash2, Mail } from "lucide-react";
import { updateDisplayName, sendPasswordReset, deleteAccount } from "@/lib/actions/settings";
import { useDarkMode } from "@/lib/hooks/useDarkMode";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useCurrency } from "@/lib/hooks/useCurrency";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { AppearanceSection } from "./AppearanceSection";
import { LanguageSection } from "./LanguageSection";
import { CurrencySection } from "./CurrencySection";

interface SettingsClientProps {
  email: string;
  displayName: string;
}

export function SettingsClient({ email, displayName: initialDisplayName }: SettingsClientProps) {
  const { isDark, toggle, mounted: darkModeMounted } = useDarkMode();
  const { t, lang, setLanguage, mounted: i18nMounted } = useTranslation();
  const { toasts, toast, removeToast } = useToast();
  const { baseCurrency, setBaseCurrency, rates, loading: ratesLoading, mounted: currencyMounted } = useCurrency();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [hasResetSuccess, setHasResetSuccess] = useState(false);

  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function handleUpdateDisplayName(): Promise<void> {
    if (!displayName.trim()) return;
    setIsUpdatingDisplayName(true);
    const result = await updateDisplayName(displayName.trim());
    setIsUpdatingDisplayName(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("settings.displayNameUpdated"));
    }
  }

  async function handleSendReset(): Promise<void> {
    setIsSendingReset(true);
    setHasResetSuccess(false);
    const result = await sendPasswordReset(email);
    setIsSendingReset(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("settings.resetEmailSent"));
      setHasResetSuccess(true);
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    if (deleteConfirmationInput !== "DELETE") return;
    setIsDeletingAccount(true);
    const result = await deleteAccount();
    setIsDeletingAccount(false);
    if (result.error) {
      toast.error(result.error ?? t("common.error"));
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <AppearanceSection
        isDark={isDark}
        onToggle={toggle}
        title={i18nMounted ? t("settings.appearance") : "Appearance"}
        description={isDark
          ? (i18nMounted ? t("settings.darkModeOn") : "Dark mode is on")
          : (i18nMounted ? t("settings.lightModeOn") : "Light mode is on")
        }
      />

      <LanguageSection
        currentLanguage={lang}
        onLanguageChange={setLanguage}
        title={i18nMounted ? t("settings.language") : "Language"}
        description={i18nMounted ? t("settings.languageDesc") : "Select your preferred language"}
      />

      <CurrencySection
        currentCurrency={baseCurrency}
        onCurrencyChange={setBaseCurrency}
        title={currencyMounted ? t("common.baseCurrency") : "Base Currency"}
        description={currencyMounted ? t("common.baseCurrencyDesc") : "All totals will be converted to this currency"}
        ratesLoading={ratesLoading}
        rates={rates}
      />

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#E6F7F6] dark:bg-[#00B9A7]/20 flex items-center justify-center">
            <User className="h-5 w-5 text-[#00B9A7] dark:text-[#00B9A7]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {i18nMounted ? t("settings.profile") : "Profile"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {i18nMounted ? t("settings.profileDesc") : "Update your display name"}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            {i18nMounted ? t("settings.email") : "Email"}
          </label>
          <input
            type="email"
            value={email}
            disabled
            placeholder={i18nMounted ? t("settings.email") : "Email"}
            className="w-full h-10 border border-gray-200 dark:border-gray-700 rounded-lg px-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {i18nMounted ? t("settings.emailCannotChange") : "Email cannot be changed"}
          </p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            {i18nMounted ? t("settings.displayName") : "Display Name"}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={i18nMounted ? t("settings.displayNamePlaceholder") : "Your name"}
            className="w-full h-10 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7]"
          />
        </div>

        <button
          onClick={handleUpdateDisplayName}
          disabled={isUpdatingDisplayName}
          className="px-5 py-2 bg-[#00B9A7] hover:bg-[#0099A0] disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors duration-200"
        >
          {isUpdatingDisplayName 
            ? (i18nMounted ? t("settings.saving") : "Saving...") 
            : (i18nMounted ? t("settings.saveChanges") : "Save changes")}
        </button>
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {i18nMounted ? t("settings.password") : "Password"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {i18nMounted ? t("settings.passwordDesc") : "Reset your account password"}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {i18nMounted ? t("settings.passwordResetDesc") : "We'll send a password reset link to your email."}
        </p>

        {hasResetSuccess && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
            <div className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 flex items-center justify-center">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {i18nMounted ? t("settings.emailSent") : "Reset email sent"}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {i18nMounted ? t("settings.resetEmailSent") : `Check your inbox at ${email} and follow the link to reset your password.`}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSendReset}
          disabled={isSendingReset || hasResetSuccess}
          className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          <Mail className="h-4 w-4" />
          {isSendingReset 
            ? (i18nMounted ? t("settings.sending") : "Sending...") 
            : hasResetSuccess 
              ? (i18nMounted ? t("settings.emailSent") : "Email sent") 
              : (i18nMounted ? t("settings.sendResetEmail") : "Send reset email")}
        </button>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {i18nMounted ? t("settings.dangerZone") : "Danger Zone"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {i18nMounted ? t("settings.dangerZoneDesc") : "Irreversible actions"}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {i18nMounted ? t("settings.deleteAccountDesc") : "This will permanently delete all your transactions, categories, and budgets."}
        </p>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          {i18nMounted ? t("settings.deleteAccount") : "Delete account"}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmationInput("");
        }}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingAccount}
        title={i18nMounted ? t("settings.deleteAccountTitle") : "Delete Account"}
        description={`${i18nMounted ? t("settings.deleteAccountDesc") : "This will permanently delete all your data."} ${i18nMounted ? t("settings.deleteConfirmHint") : "Type DELETE to confirm."}`}
        confirmLabel={isDeletingAccount ? (i18nMounted ? t("settings.deleting") : "Deleting...") : (i18nMounted ? t("settings.deleteAccountTitle") : "Delete Account")}
        cancelLabel={i18nMounted ? t("common.cancel") : "Cancel"}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
