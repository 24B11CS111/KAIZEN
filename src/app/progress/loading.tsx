import { Skeleton } from "@/components/Skeleton";

export default function ProgressLoading() {
  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex justify-between items-baseline">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="card p-5 mt-4 flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-2.5 w-28" />
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
