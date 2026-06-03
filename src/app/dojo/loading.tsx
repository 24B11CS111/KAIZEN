import { Skeleton } from "@/components/Skeleton";

export default function DojoLoading() {
  return (
    <main className="container-app pt-6 pb-bottom-nav">
      {/* Personalized Welcome Header */}
      <div className="pt-2 pb-5 space-y-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Hero Status Panel Skeleton */}
      <div className="card p-5 mb-5 flex gap-4">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      {/* Analytics Rings Replacement */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Skeleton className="card h-24" />
        <Skeleton className="card h-24" />
      </div>

      {/* Mission card / Grid Skeleton */}
      <div className="card p-5 mt-2 space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-56" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* CTA */}
      <Skeleton className="mt-5 h-[46px] w-full rounded-lg" />

      {/* 30-day grid */}
      <div className="mt-8 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
