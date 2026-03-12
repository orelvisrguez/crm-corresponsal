import { Skeleton } from "@/components/ui/skeleton"

export function CasosSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Skeleton className="h-10 flex-1 w-full md:w-auto" />
          <Skeleton className="h-10 w-full md:w-32" />
          <Skeleton className="h-10 w-full md:w-32" />
          <Skeleton className="h-10 w-full md:w-32" />
          <Skeleton className="h-10 w-full md:w-32" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-10 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
