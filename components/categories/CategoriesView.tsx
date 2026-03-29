"use client";

import { useState, useTransition, FormEvent, useEffect } from "react";
import type { Category, CategoryType } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories";
import { useNewCategory } from "@/hooks/useNewCategory";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useUserData } from "@/lib/contexts/UserDataContext";
import { CategoryTable } from "./CategoryTable";
import { EditCategoryModal } from "./EditCategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";

export interface CategoriesClientProps {
  initialCategories: Category[];
}

interface CategoryFormState {
  id?: string;
  name: string;
  type: CategoryType;
  color: string;
  budgetLimit: string;
}

export function CategoriesView({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isSubmitting, startTransition] = useTransition();
  const { toast, toasts, removeToast } = useToast();
  const newCategory = useNewCategory();
  const { t, mounted } = useTranslation();
  const { refetchCategories, categories: contextCategories } = useUserData();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>({
    name: "",
    type: "expense",
    color: "",
    budgetLimit: "",
  });

  // Sync with UserDataContext when it finishes loading
  useEffect(() => {
    if (contextCategories.length > 0) {
      setCategories(contextCategories);
    }
  }, [contextCategories]);

  const handleOpenAddModal = () => {
    setIsEditOpen(false); // Close edit if open
    setEditingCategory(null);
    setFormState({
      name: "",
      type: "expense",
      color: "",
      budgetLimit: "",
    });
    newCategory.onOpen();
  };

  const handleOpenEditModal = (category: Category) => {
    newCategory.onClose(); // Close add if open
    setEditingCategory(category);
    setFormState({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      budgetLimit: category.budget_limit !== null ? String(category.budget_limit) : "",
    });
    setIsEditOpen(true);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = formState;
    const budgetLimitNumber =
      payload.budgetLimit.trim() !== "" ? Number(payload.budgetLimit) : null;

    startTransition(() => {
      if (payload.id) {
        void (async () => {
          const result = await updateCategory({
            id: payload.id!,
            name: payload.name,
            type: payload.type,
            color: payload.color,
            budget_limit: budgetLimitNumber ?? undefined,
          });

          if (!result.success) {
            toast.error(result.error ?? t("common.error"));
            return;
          }

          setCategories((current) =>
            current.map((category) =>
              category.id === payload.id
                ? {
                  ...category,
                  name: payload.name,
                  type: payload.type,
                  color: payload.color,
                  budget_limit: budgetLimitNumber,
                }
                : category
            )
          );

          toast.success(t("categories.updatedSuccess"));
          setIsEditOpen(false);
          await refetchCategories();
        })();
      } else {
        void (async () => {
          const result = await createCategory({
            name: payload.name,
            type: payload.type,
            color: payload.color,
            budget_limit: budgetLimitNumber === null ? undefined : budgetLimitNumber,
          });

          if (!result.success) {
            toast.error(result.error ?? t("common.error"));
            return;
          }

          toast.success(t("categories.addedSuccess"));
          newCategory.onClose();
          await refetchCategories();
        })();
      }
    });
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;

    const categoryToDelete = deletingCategory;

    startTransition(() => {
      void (async () => {
        const result = await deleteCategory(categoryToDelete.id);

        if (!result.success) {
          toast.error(result.error ?? t("common.error"));
          return;
        }

        setCategories((current) =>
          current.filter((category) => category.id !== categoryToDelete.id)
        );

        toast.success(t("categories.deletedSuccess"));
        setIsDeleteOpen(false);
        await refetchCategories();
      })();
    });
  };

  const isLoading = isSubmitting;

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#0F172A] min-h-screen pb-6 relative">
      <div className="
        px-4 pt-4 pb-0 md:px-0 md:pt-0
        flex flex-col gap-2
        lg:flex-row lg:items-center
        lg:justify-between mb-4
      ">
        <div>
          <h1 className="
            text-xl font-extrabold
            text-[#1A1A2E] dark:text-white
          ">
            {mounted ? t("nav.categories") : "Categories"}
          </h1>
          <p className="
            text-xs text-[#6B7280]
            dark:text-gray-400 mt-0.5
          ">
            {mounted ? t("categories.description") : ""}
          </p>
        </div>

        {/* Desktop add button */}
        <div className="hidden lg:block">
          <button
            onClick={handleOpenAddModal}
            className="btn-primary text-sm
              inline-flex items-center gap-2
            "
          >
            <span>+</span>
            {mounted ? t("categories.add") : "Add Category"}
          </button>
        </div>
      </div>

      <div className="px-4 md:px-0">
        <CategoryTable
          categories={categories}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onAddClick={newCategory.onOpen}
          headers={{
            name: mounted ? t("categories.name") : "Name",
            type: mounted ? t("categories.type") : "Type",
            budget: mounted ? t("categories.budgetLimit") : "Budget limit",
            icon: mounted ? t("categories.icon") : "Icon",
            actions: mounted ? t("common.manage") : "Actions",
          }}
          labels={{
            income: mounted ? t("categories.income") : "Income",
            expense: mounted ? t("categories.expense") : "Expense",
            noCategories: mounted ? t("categories.noCategories") : "No categories found",
            noCategoriesDesc: mounted ? t("categories.noCategoriesDesc") : "No categories found. Create a category to get started.",
            add: mounted ? t("categories.add") : "Add category",
            edit: mounted ? t("common.edit") : "Edit",
            delete: mounted ? t("common.delete") : "Delete",
          }}
        />
      </div>

      <EditCategoryModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        formState={{
          name: formState.name,
          type: formState.type,
          budgetLimit: formState.budgetLimit,
        }}
        onInputChange={handleInputChange}
        labels={{
          title: mounted ? t("categories.edit") : "Edit category",
          description: mounted ? t("categories.description") : "Set up how this category should be tracked.",
          name: mounted ? t("categories.name") : "Name",
          namePlaceholder: mounted ? t("categories.namePlaceholder") : "e.g. Food & Drinks",
          type: mounted ? t("categories.type") : "Type",
          expense: mounted ? t("categories.expense") : "Expense",
          income: mounted ? t("categories.income") : "Income",
          budgetLimit: mounted ? t("categories.budgetLimit") : "Budget limit (optional)",
          budgetLimitPlaceholder: mounted ? t("common.optional") : "optional",
          cancel: mounted ? t("common.cancel") : "Cancel",
          save: mounted ? t("common.save") : "Save changes",
        }}
      />

      <DeleteCategoryModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCategory}
        isLoading={isLoading}
        categoryName={deletingCategory?.name ?? ""}
        labels={{
          delete: mounted ? t("common.delete") : "Delete",
          cancel: mounted ? t("common.cancel") : "Cancel",
          confirmDelete: mounted ? t("categories.confirmDelete") : "This action cannot be undone.",
        }}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* FAB — Mobile only */}
      <button
        onClick={handleOpenAddModal}
        className="
          fixed bottom-20 right-4
          w-14 h-14 rounded-full
          bg-[#00B9A7] text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          active:scale-95
          transition-all duration-300
          lg:hidden z-50
          hover:bg-[#0099A0]
        "
        aria-label={
          mounted ? t("categories.add") : "Add category"
        }
      >
        <span className="text-2xl font-light">+</span>
      </button>
    </div>
  );
}