"use client";

import { Modal } from "@/components/ui/Modal";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: ConfirmDeleteModalProps) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          {description}
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <button
            className="
              w-full sm:w-auto h-11 px-6
              rounded-full border border-gray-200
              dark:border-gray-700
              text-sm font-semibold text-[#6B7280]
              hover:bg-gray-50 dark:hover:bg-gray-800
              active:scale-95 transition-all duration-200
            "
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className="
              w-full sm:w-auto h-11 px-6
              rounded-full bg-[#FF5B5B] text-white
              text-sm font-semibold
              hover:bg-[#E04444]
              active:scale-95 transition-all duration-200
              disabled:opacity-50
            "
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
