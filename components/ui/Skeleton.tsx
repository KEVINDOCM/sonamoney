export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ""}`} />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 lg:p-6 ${className ?? ""}`}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-40" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
            <div className="flex gap-3 items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex gap-4 items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 lg:p-6 ${className ?? ""}`}>
      <Skeleton className="h-5 w-40 mb-1" />
      <Skeleton className="h-3 w-28 mb-4" />
      <Skeleton className="w-full h-48 lg:h-64 rounded-lg" />
    </div>
  )
}

export function SkeletonBudgetCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}
