"use client";

import { Modal } from "@/components/ui/Modal";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  accountName: string;
  mounted: boolean;
  t: (key: string) => string;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  accountName,
  mounted,
  t,
}: DeleteAccountModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={accountName ? `${mounted ? t("common.delete") : "Delete"} ${accountName}?` : mounted ? t("accounts.delete") : "Delete account?"}
      description={mounted ? t("accounts.confirmDelete") : "This action cannot be undone. Transactions linked to this account will not be deleted."}
      onClose={onClose}
    >
      <div className="flex flex-col-reverse lg:flex-row lg:justify-end gap-2 lg:gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
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
          disabled={isLoading}
          onClick={onConfirm}
          className="
            w-full lg:w-auto h-11 px-6
            rounded-full bg-[#FF5B5B] text-white
            text-sm font-semibold
            hover:bg-[#E04444]
            active:scale-95
            transition-all duration-200
            disabled:opacity-50
          "
        >
          {mounted ? t("common.delete") : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
