import { Skeleton } from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>

      <div className="card p-5 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-5 h-11 w-full rounded-md" />
    </main>
  );
}
