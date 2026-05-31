import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  SenseiVerificationDashboard,
  type SenseiDashboardStats,
  type SenseiPendingRow
} from "@/components/SenseiVerificationDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthBypassed } from "@/lib/devBypass";

export const dynamic = "force-dynamic";

type GenericRow = Record<string, any>;

function normalizeHistory(entries: GenericRow[] | null | undefined) {
  return (entries ?? []).map((entry) => ({
    id: entry.id,
    utr_number: entry.utr_number ?? "—",
    plan_amount: Number(entry.plan_amount ?? 0),
    status: entry.status ?? "pending",
    created_at: entry.created_at ?? null,
    reviewed_at: entry.reviewed_at ?? null,
    rejection_reason: entry.rejection_reason ?? null
  }));
}

async function loadStats(supabase: ReturnType<typeof createSupabaseServerClient>): Promise<SenseiDashboardStats> {
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    { count: pendingApprovals },
    { count: activeSubscribers },
    { count: expiringSoon },
    { count: totalUsers },
    approvedRevenueRes
  ] = await Promise.all([
    supabase.from("utr_logs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "active")
      .gte("expiry_date", now.toISOString()),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "active")
      .gte("expiry_date", now.toISOString())
      .lte("expiry_date", soon.toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("utr_logs").select("plan_amount").eq("status", "approved")
  ]);

  const totalRevenue = ((approvedRevenueRes.data as GenericRow[] | null) ?? []).reduce(
    (sum, row) => sum + Number(row.plan_amount ?? 0),
    0
  );

  return {
    pendingApprovals: pendingApprovals ?? 0,
    activeSubscribers: activeSubscribers ?? 0,
    totalRevenue,
    expiringSoon: expiringSoon ?? 0,
    totalUsers: totalUsers ?? 0
  };
}

export default async function SenseiPage() {
  const supabase = createSupabaseServerClient();
  const bypass = isAuthBypassed();

  if (!bypass) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login?next=/sensei");

    const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    const p: any = me;
    if (!p || p.is_admin !== true) {
      redirect("/dojo");
    }
  }

  try {
    await (supabase as any).rpc("touch_all_expired_subscriptions");
  } catch {}

  const pendingRes = await supabase
    .from("utr_logs")
    .select(
      "id,user_id,utr_number,plan_amount,created_at,status,rejection_reason,profiles!inner(full_name,email,whatsapp,subscription_status,expiry_date,created_at,path_type,branch,occupation,field_of_study,daily_time_min,skill_level,main_goal,main_goal_other)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingBase = ((pendingRes.data as GenericRow[] | null) ?? []).map((row) => ({
    utr_id: row.id as string,
    user_id: row.user_id as string,
    profile: (row.profiles ?? {}) as GenericRow,
    utr_number: row.utr_number as string,
    plan_amount: Number(row.plan_amount ?? 0),
    created_at: row.created_at as string,
    payment_status: (row.status ?? "pending") as string,
    rejection_reason: (row.rejection_reason ?? null) as string | null
  }));

  const userIds = Array.from(new Set(pendingBase.map((row) => row.user_id)));

  const emptyStats = await loadStats(supabase);
  if (userIds.length === 0) {
    return (
      <main className="min-h-[100svh] bg-obsidian">
        <Navbar />
        <section className="container-app pt-24 pb-bottom-nav">
          <div className="mx-auto max-w-7xl">
            <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blood-500/25 bg-blood-500/[0.08] shadow-[0_0_24px_-12px_rgba(208,0,0,0.6)]">
                  <ShieldCheck className="h-5 w-5 text-blood-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Sensei Verification System</p>
                  <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Council chamber</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                    Review pending UTR submissions, activate 30-day subscriptions, reject fake proofs,
                    and manage access with full control.
                  </p>
                </div>
              </div>
            </header>

            <SenseiVerificationDashboard initialPending={[]} stats={emptyStats} />
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const [streaksRes, dailyLogsRes, historyRes, onboardingRes, aiPlansRes, stats] = await Promise.all([
    supabase
      .from("streaks")
      .select("user_id,current_streak,longest_streak,last_completed_date,updated_at")
      .in("user_id", userIds),
    supabase
      .from("daily_logs")
      .select("user_id,day,completed,completed_at,created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("utr_logs")
      .select("id,user_id,utr_number,plan_amount,status,created_at,reviewed_at,rejection_reason")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("onboarding_data")
      .select("user_id,full_name,age,gender,occupation,field_of_study,daily_time_min,skill_level,main_goal,main_goal_other,raw,created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_plans")
      .select("user_id,track_id,track_label,version,created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    loadStats(supabase)
  ]);

  const streakMap = new Map<string, GenericRow>();
  for (const row of ((streaksRes.data as GenericRow[] | null) ?? [])) {
    streakMap.set(row.user_id as string, row);
  }

  const progressMap = new Map<
    string,
    {
      completedDays: number;
      currentRoadmapDay: number;
      latestActivityAt: string | null;
      progressPercent: number;
    }
  >();

  const logsByUser = new Map<string, GenericRow[]>();
  for (const row of ((dailyLogsRes.data as GenericRow[] | null) ?? [])) {
    const key = row.user_id as string;
    const bucket = logsByUser.get(key) ?? [];
    bucket.push(row);
    logsByUser.set(key, bucket);
  }

  for (const [userId, logs] of logsByUser.entries()) {
    const completed = logs.filter((log) => log.completed === true);
    const uniqueDays = Array.from(new Set(completed.map((log) => Number(log.day ?? 0)).filter(Boolean)));
    const latestActivityAt =
      completed
        .map((log) => (log.completed_at ?? log.created_at ?? null) as string | null)
        .find(Boolean) ?? null;
    const completedDays = uniqueDays.length;
    progressMap.set(userId, {
      completedDays,
      currentRoadmapDay: Math.min(30, completedDays + 1),
      latestActivityAt,
      progressPercent: Math.min(100, Math.round((completedDays / 30) * 100))
    });
  }

  const paymentHistoryMap = new Map<string, ReturnType<typeof normalizeHistory>>();
  for (const row of ((historyRes.data as GenericRow[] | null) ?? [])) {
    const key = row.user_id as string;
    const bucket = paymentHistoryMap.get(key) ?? [];
    bucket.push({
      id: row.id,
      utr_number: row.utr_number ?? "—",
      plan_amount: Number(row.plan_amount ?? 0),
      status: row.status ?? "pending",
      created_at: row.created_at ?? null,
      reviewed_at: row.reviewed_at ?? null,
      rejection_reason: row.rejection_reason ?? null
    });
    paymentHistoryMap.set(key, bucket);
  }

  const onboardingMap = new Map<string, GenericRow>();
  for (const row of ((onboardingRes.data as GenericRow[] | null) ?? [])) {
    const key = row.user_id as string;
    if (!onboardingMap.has(key)) onboardingMap.set(key, row);
  }

  const aiPlanMap = new Map<string, GenericRow>();
  for (const row of ((aiPlansRes.data as GenericRow[] | null) ?? [])) {
    const key = row.user_id as string;
    if (!aiPlanMap.has(key)) aiPlanMap.set(key, row);
  }

  const rows: SenseiPendingRow[] = pendingBase.map((row) => {
    const profile = row.profile;
    const streak = streakMap.get(row.user_id);
    const progress = progressMap.get(row.user_id) ?? {
      completedDays: 0,
      currentRoadmapDay: 1,
      latestActivityAt: null,
      progressPercent: 0
    };
    const onboarding = onboardingMap.get(row.user_id);
    const latestPlan = aiPlanMap.get(row.user_id);

    return {
      utr_id: row.utr_id,
      user_id: row.user_id,
      full_name: (profile.full_name ?? onboarding?.full_name ?? null) as string | null,
      email: (profile.email ?? null) as string | null,
      whatsapp: (profile.whatsapp ?? null) as string | null,
      utr_number: row.utr_number,
      plan_amount: row.plan_amount,
      created_at: row.created_at,
      payment_status: row.payment_status,
      rejection_reason: row.rejection_reason,
      subscription_status: (profile.subscription_status ?? row.payment_status ?? "pending") as string | null,
      expiry_date: (profile.expiry_date ?? null) as string | null,
      joined_at: (profile.created_at ?? null) as string | null,
      path_type: (profile.path_type ?? null) as string | null,
      branch: (profile.branch ?? null) as string | null,
      occupation: (profile.occupation ?? onboarding?.occupation ?? null) as string | null,
      field_of_study: (profile.field_of_study ?? onboarding?.field_of_study ?? null) as string | null,
      daily_time_min: Number(profile.daily_time_min ?? onboarding?.daily_time_min ?? 0) || null,
      skill_level: (profile.skill_level ?? onboarding?.skill_level ?? null) as string | null,
      main_goal: (profile.main_goal ?? onboarding?.main_goal ?? null) as string | null,
      main_goal_other: (profile.main_goal_other ?? onboarding?.main_goal_other ?? null) as string | null,
      age: (onboarding?.age ?? null) as number | null,
      gender: (onboarding?.gender ?? null) as string | null,
      current_streak: Number(streak?.current_streak ?? 0),
      longest_streak: Number(streak?.longest_streak ?? 0),
      last_completed_date: (streak?.last_completed_date ?? null) as string | null,
      completed_days: progress.completedDays,
      current_roadmap_day: progress.currentRoadmapDay,
      progress_percent: progress.progressPercent,
      latest_activity_at: progress.latestActivityAt,
      payment_history: normalizeHistory(paymentHistoryMap.get(row.user_id)),
      ai_track_label: (latestPlan?.track_label ?? null) as string | null,
      ai_track_id: (latestPlan?.track_id ?? null) as string | null,
      onboarding_raw: (onboarding?.raw ?? null) as unknown
    };
  });

  return (
    <main className="min-h-[100svh] bg-obsidian">
      <Navbar />
      <section className="container-app pt-24 pb-bottom-nav">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blood-500/25 bg-blood-500/[0.08] shadow-[0_0_24px_-12px_rgba(208,0,0,0.6)]">
                <ShieldCheck className="h-5 w-5 text-blood-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Sensei Verification System</p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Council chamber</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
                  Review pending UTR submissions, inspect learner context, activate 30-day subscriptions,
                  and manage premium access with full control.
                </p>
              </div>
            </div>
          </header>

          <SenseiVerificationDashboard initialPending={rows} stats={stats} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
