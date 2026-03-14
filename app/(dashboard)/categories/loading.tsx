import { SkeletonTable } from "@/components/ui/Skeleton"

export default function CategoriesLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-44 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  )
}
