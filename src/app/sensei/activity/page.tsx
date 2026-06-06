import { requireAdminPage } from "@/lib/admin";
import { SenseiLiveRadar } from "@/components/admin/SenseiLiveRadar";
import { SenseiAdminActivityFeed } from "@/components/admin/SenseiAdminActivityFeed";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  // Fetch recent activity
  const { data } = await supabase
    .from("activity_log")
    .select("id, type, user_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const rawActivity = data || [];

  const activityFeed = rawActivity.map((row: any) => {
    const type = row.type || "activity";
    let label = type.replace(/_/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase());
    let detail = "Platform activity recorded";
    
    if (type.includes("day")) label = "Roadmap Progress";
    if (type.includes("workout")) label = "Workout Completed";
    if (type.includes("signup")) label = "New Signup";

    const metadata = (row.metadata || {}) as any;
    if (metadata.day) detail = `Day ${metadata.day} / ${metadata.xp || 0} XP`;
    else if (metadata.pathname) detail = String(metadata.pathname);

    return {
      id: String(row.id),
      type,
      label,
      detail,
      user_id: row.user_id,
      created_at: row.created_at
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 flex flex-col h-[calc(100svh-6rem)]">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Live Radar</h1>
        <p className="text-white/50 text-sm mt-1">Real-time platform telemetry and active user sessions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col">
          <ErrorBoundary name="Live Radar">
            <SenseiLiveRadar />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <ErrorBoundary name="Activity Feed">
            <SenseiAdminActivityFeed initialFeed={activityFeed} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
