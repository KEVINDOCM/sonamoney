import { Card } from "@/components/ui/Card";

export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gray-200 animate-pulse" />
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-3 w-12 bg-gray-200 rounded mb-1 animate-pulse" />
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
