import { Card } from "@/components/ui/Card";
import { fetchCategories } from "@/lib/actions/categories";
import { CategoriesClient } from "@/components/categories/CategoriesClient";
import { NewCategoryModal } from "@/components/categories/NewCategoryModal";

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="space-y-6">
      <Card>
        <CategoriesClient initialCategories={categories} />
      </Card>
      <NewCategoryModal />
    </div>
  );
}

