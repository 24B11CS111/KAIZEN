import { requireAdminPage } from "@/lib/admin";
import { SenseiLiveRadar } from "@/components/admin/SenseiLiveRadar";
import { SenseiAdminActivityFeed } from "@/components/admin/SenseiAdminActivityFeed";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSenseiFetch } from "@/lib/senseiLog";
import { SenseiPage } from "@/components/admin/SenseiPage";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  let activityFeed: {
    id: string;
    type: string;
    label: string;
    detail: string;
    user_id: string | null;
    created_at: string | null;
  }[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from("activity_log")
      .select("id, type, user_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      logSenseiFetch("activity/activity_log", error);
      fetchError = "Historical activity could not be loaded.";
    } else {
      const rawActivity = data || [];

      activityFeed = rawActivity.map((row: Record<string, unknown>) => {
        const type = String(row.type || "activity");
        let label = type.replace(/_/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase());
        let detail = "Platform activity recorded";

        if (type.includes("day")) label = "Roadmap Progress";
        if (type.includes("workout")) label = "Workout Completed";
        if (type.includes("signup")) label = "New Signup";

        const metadata = (row.metadata || {}) as Record<string, unknown>;
        if (metadata.day) detail = `Day ${metadata.day} / ${metadata.xp || 0} XP`;
        else if (metadata.pathname) detail = String(metadata.pathname);

        return {
          id: String(row.id),
          type,
          label,
          detail,
          user_id: row.user_id ? String(row.user_id) : null,
          created_at: row.created_at ? String(row.created_at) : null
        };
      });
    }
  } catch (err) {
    logSenseiFetch("activity", err);
    fetchError = "Historical activity could not be loaded.";
  }

  return (
    <SenseiPage
      title="Live Radar"
      description="Real-time platform telemetry and active user sessions."
      fullHeight
    >
      {fetchError && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-200/80 mb-4">
          {fetchError} Live realtime feeds will still attempt to connect.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_420px] flex-1 min-h-0 h-full">
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <ErrorBoundary name="Live Radar">
            <SenseiLiveRadar />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <ErrorBoundary name="Activity Feed">
            <SenseiAdminActivityFeed initialFeed={activityFeed} />
          </ErrorBoundary>
        </div>
      </div>
    </SenseiPage>
  );
}
