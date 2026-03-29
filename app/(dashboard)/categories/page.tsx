import * as React from "react";
import { fetchCategories } from "@/lib/actions/categories";
import { CategoriesView } from "@/components/categories/CategoriesView";
import { NewCategoryModal } from "@/components/categories/NewCategoryModal";

function CategoriesSkeleton() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="px-4 md:px-0 mb-4">
        <div className="skeleton h-7 w-32 rounded-xl mb-2"/>
        <div className="skeleton h-4 w-48 rounded-lg"/>
      </div>

      {/* Mobile card skeleton */}
      <div className="px-4 md:px-0 space-y-2 lg:hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl h-16 skeleton"/>
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden lg:block rounded-2xl overflow-hidden skeleton h-[400px]"/>
    </div>
  );
}

export default async function CategoriesPage() {
  return (
    <React.Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent />
    </React.Suspense>
  );
}

async function CategoriesContent() {
  const categories = await fetchCategories();
  return (
    <div className="page-container">
      <CategoriesView initialCategories={categories} />
      <NewCategoryModal />
    </div>
  );
}

