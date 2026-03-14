import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-56 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonChart />
    </div>
  )
}
