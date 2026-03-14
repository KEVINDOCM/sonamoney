import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton"

export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonTable rows={3} />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  )
}
