"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

interface DeleteTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
    onConfirm: (id: string) => Promise<{ success: boolean; error?: string }>;
    isLoading: boolean;
}

export const DeleteTransactionModal = ({ isOpen, onClose, transactionId, onConfirm, isLoading }: DeleteTransactionModalProps) => {
    const { t, mounted } = useTranslation();

    const onClickConfirm = async () => {
        if (!transactionId) return;
        await onConfirm(transactionId);
    };

    return (
        <ConfirmDeleteModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onClickConfirm}
            isLoading={isLoading}
            title={mounted ? t("transactions.delete") : "Delete Transaction"}
            description={mounted ? t("common.confirmDelete") : "This action cannot be undone. Are you sure?"}
            confirmLabel={mounted ? t("common.delete") : "Delete"}
            cancelLabel={mounted ? t("common.cancel") : "Cancel"}
        />
    );
};
