import { Skeleton } from "@/components/Skeleton";

export default function DojoLoading() {
  return (
    <main className="container-app pt-6 pb-bottom-nav">
      {/* Header */}
      <div className="pt-2 pb-4 space-y-2">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-7 w-40" />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-3 space-y-2">
            <Skeleton className="h-2.5 w-12 mx-auto" />
            <Skeleton className="h-7 w-10 mx-auto" />
            <Skeleton className="h-2 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 px-1 space-y-2">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-28" />
        </div>
      </div>

      {/* Mission card */}
      <div className="card p-5 mt-5 space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-5 w-44" />
          </div>
          <Skeleton className="h-2.5 w-14" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
        ))}
      </div>

      {/* CTA */}
      <Skeleton className="mt-4 h-11 w-full rounded-md" />

      {/* 30-day grid */}
      <div className="mt-8 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
