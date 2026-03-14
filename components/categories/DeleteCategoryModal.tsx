"use client";

import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  categoryName: string;
  labels: {
    delete: string;
    cancel: string;
    confirmDelete: string;
  };
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  categoryName,
  labels,
}: DeleteCategoryModalProps) {
  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={categoryName ? `${labels.delete} ${categoryName}?` : labels.delete}
      description={labels.confirmDelete}
      confirmLabel={labels.delete}
      cancelLabel={labels.cancel}
    />
  );
}
