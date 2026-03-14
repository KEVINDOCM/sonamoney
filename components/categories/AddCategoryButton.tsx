"use client";

import { Button } from "@/components/ui/Button";
import { useNewCategory } from "@/hooks/useNewCategory";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function AddCategoryButton() {
  const newCategory = useNewCategory();
  const { t, mounted } = useTranslation();

  return (
    <Button onClick={newCategory.onOpen} className="w-full lg:w-auto">
      {mounted ? t("categories.add") : "Add Category"}
    </Button>
  );
}

