import { SkeletonTable } from "@/components/ui/Skeleton"

export default function TransactionsLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-52 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <SkeletonTable rows={8} />
    </div>
  )
}
