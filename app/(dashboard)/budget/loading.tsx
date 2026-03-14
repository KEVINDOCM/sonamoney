import { SkeletonCard, SkeletonBudgetCard } from "@/components/ui/Skeleton"

export default function BudgetLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <div className="h-7 w-20 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBudgetCard key={i} />
        ))}
      </div>
    </div>
  )
}
