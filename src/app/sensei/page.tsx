import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  SenseiVerificationDashboard,
  type SenseiChartPoint,
  type SenseiActivityEntry,
  type SenseiDashboardAnalytics,
  type SenseiDashboardStats,
  type SenseiPaymentHistoryEntry,
  type SenseiUsageMetric,
  type SenseiUserRecord
} from "@/components/SenseiVerificationDashboard";
import { SenseiCommandCenter } from "@/components/admin/SenseiCommandCenter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminEmail";

export const dynamic = "force-dynamic";

type GenericRow = Record<string, any>;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeHistory(entries: GenericRow[] | null | undefined): SenseiPaymentHistoryEntry[] {
  return (entries ?? []).map((entry) => ({
    id: String(entry.id),
    utr_number: entry.utr_number ?? "—",
    plan_amount: Number(entry.plan_amount ?? 0),
    status: entry.status ?? "pending",
    created_at: entry.created_at ?? null,
    reviewed_at: entry.reviewed_at ?? null,
    rejection_reason: entry.rejection_reason ?? null
  }));
}

async function loadSenseiData() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/sensei");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin,email")
    .eq("id", user.id)
    .maybeSingle();

  const adminProfile: any = me;
  if (!adminProfile || adminProfile.is_admin !== true || !isAdminEmail(user.email)) {
    redirect("/dojo");
  }

  try {
    await (supabase as any).rpc("touch_all_expired_subscriptions");
  } catch {}

  const [
    profilesRes,
    streaksRes,
    dailyLogsRes,
    paymentsRes,
    onboardingRes,
    aiPlansRes,
    activityRes,
    onlineSessionsRes
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,email,avatar_url,full_name,whatsapp,created_at,last_active_at,path_type,branch,occupation,field_of_study,daily_time_min,skill_level,main_goal,main_goal_other,subscription_status,expiry_date,plan_amount,age,gender,workout_location,fitness_level,is_suspended"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("streaks")
      .select("user_id,current_streak,longest_streak,last_completed_date,updated_at"),
    supabase
      .from("daily_logs")
      .select("id,user_id,day,completed,completed_at,created_at,workout_completed,discipline_completed,study_completed")
      .order("created_at", { ascending: false }),
    supabase
      .from("utr_logs")
      .select("id,user_id,utr_number,plan_amount,status,created_at,reviewed_at,rejection_reason")
      .order("created_at", { ascending: false }),
    supabase
      .from("onboarding_data")
      .select(
        "user_id,full_name,age,gender,occupation,field_of_study,daily_time_min,skill_level,main_goal,main_goal_other,raw,created_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_plans")
      .select("user_id,track_id,track_label,version,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("id,user_id,type,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("online_sessions")
      .select("user_id,pathname,last_seen_at,online_at")
      .order("last_seen_at", { ascending: false })
      .limit(100)
  ]);

  const profiles = ((profilesRes.data as GenericRow[] | null) ?? []).filter((profile) => profile.email !== "hrixofficial@gmail.com");
  const streaks = (streaksRes.data as GenericRow[] | null) ?? [];
  const dailyLogs = (dailyLogsRes.data as GenericRow[] | null) ?? [];
  const payments = (paymentsRes.data as GenericRow[] | null) ?? [];
  const onboardingEntries = (onboardingRes.data as GenericRow[] | null) ?? [];
  const aiPlans = (aiPlansRes.data as GenericRow[] | null) ?? [];
  const activityRows = (activityRes.data as GenericRow[] | null) ?? [];
  const onlineSessions = (onlineSessionsRes.data as GenericRow[] | null) ?? [];

  const streakMap = new Map<string, GenericRow>();
  for (const row of streaks) streakMap.set(String(row.user_id), row);

  const logsByUser = new Map<string, GenericRow[]>();
  for (const log of dailyLogs) {
    const key = String(log.user_id);
    const bucket = logsByUser.get(key) ?? [];
    bucket.push(log);
    logsByUser.set(key, bucket);
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

  for (const [userId, logs] of logsByUser.entries()) {
    const completed = logs.filter((log) => log.completed === true);
    const uniqueDays = Array.from(
      new Set(completed.map((log) => Number(log.day ?? 0)).filter((value) => value > 0))
    );
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

  const paymentsByUser = new Map<string, GenericRow[]>();
  for (const payment of payments) {
    const key = String(payment.user_id);
    const bucket = paymentsByUser.get(key) ?? [];
    bucket.push(payment);
    paymentsByUser.set(key, bucket);
  }

  const onboardingMap = new Map<string, GenericRow>();
  for (const entry of onboardingEntries) {
    const key = String(entry.user_id);
    if (!onboardingMap.has(key)) onboardingMap.set(key, entry);
  }

  const aiPlanMap = new Map<string, GenericRow>();
  for (const plan of aiPlans) {
    const key = String(plan.user_id);
    if (!aiPlanMap.has(key)) aiPlanMap.set(key, plan);
  }

  const directoryUsers: SenseiUserRecord[] = profiles.map((profile) => {
    const userId = String(profile.id);
    const paymentHistory = normalizeHistory(paymentsByUser.get(userId));
    const latestPayment = paymentHistory[0] ?? null;
    const onboarding = onboardingMap.get(userId);
    const streak = streakMap.get(userId);
    const progress = progressMap.get(userId) ?? {
      completedDays: 0,
      currentRoadmapDay: 1,
      latestActivityAt: null,
      progressPercent: 0
    };
    const latestPlan = aiPlanMap.get(userId);

    return {
      user_id: userId,
      avatar_url: (profile.avatar_url ?? null) as string | null,
      full_name: (profile.full_name ?? onboarding?.full_name ?? null) as string | null,
      email: (profile.email ?? null) as string | null,
      whatsapp: (profile.whatsapp ?? null) as string | null,
      joined_at: (profile.created_at ?? null) as string | null,
      last_active_at: (profile.last_active_at ?? null) as string | null,
      path_type: (profile.path_type ?? null) as string | null,
      branch: (profile.branch ?? null) as string | null,
      occupation: (profile.occupation ?? onboarding?.occupation ?? null) as string | null,
      field_of_study: (profile.field_of_study ?? onboarding?.field_of_study ?? null) as string | null,
      daily_time_min: Number(profile.daily_time_min ?? onboarding?.daily_time_min ?? 0) || null,
      skill_level: (profile.skill_level ?? onboarding?.skill_level ?? null) as string | null,
      main_goal: (profile.main_goal ?? onboarding?.main_goal ?? null) as string | null,
      main_goal_other: (profile.main_goal_other ?? onboarding?.main_goal_other ?? null) as string | null,
      workout_location: (profile.workout_location ?? null) as string | null,
      fitness_level: (profile.fitness_level ?? null) as string | null,
      age: (profile.age ?? onboarding?.age ?? null) as number | null,
      gender: (profile.gender ?? onboarding?.gender ?? null) as string | null,
      is_suspended: Boolean(profile.is_suspended),
      current_streak: Number(streak?.current_streak ?? 0),
      longest_streak: Number(streak?.longest_streak ?? 0),
      last_completed_date: (streak?.last_completed_date ?? null) as string | null,
      completed_days: progress.completedDays,
      current_roadmap_day: progress.currentRoadmapDay,
      progress_percent: progress.progressPercent,
      latest_activity_at: progress.latestActivityAt,
      subscription_status: (profile.subscription_status ?? "pending") as string | null,
      expiry_date: (profile.expiry_date ?? null) as string | null,
      plan_amount: Number(profile.plan_amount ?? latestPayment?.plan_amount ?? 0) || null,
      latest_payment_status: latestPayment?.status ?? null,
      latest_utr_id: latestPayment?.id ?? null,
      latest_utr_number: latestPayment?.utr_number ?? null,
      latest_payment_created_at: latestPayment?.created_at ?? null,
      latest_rejection_reason: latestPayment?.rejection_reason ?? null,
      payment_history: paymentHistory,
      ai_track_label: (latestPlan?.track_label ?? null) as string | null,
      ai_track_id: (latestPlan?.track_id ?? null) as string | null,
      onboarding_raw: onboarding?.raw ?? null,
      reviewable: latestPayment?.status === "pending"
    };
  });

  const pendingUsers = directoryUsers.filter((row) => row.reviewable);

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthUsers = directoryUsers.filter((user) => {
    const created = safeDate(user.joined_at);
    return created && created >= currentMonth;
  }).length;
  const previousMonthUsers = directoryUsers.filter((user) => {
    const created = safeDate(user.joined_at);
    return created && created >= previousMonth && created < currentMonth;
  }).length;
  const monthlyGrowth =
    previousMonthUsers === 0
      ? currentMonthUsers > 0
        ? 100
        : 0
      : ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;

  const approvedPayments = payments.filter((row) => row.status === "approved");
  const totalRevenue = approvedPayments.reduce((sum, row) => sum + Number(row.plan_amount ?? 0), 0);
  const activeSubscribers = directoryUsers.filter((user) => user.subscription_status === "active").length;
  const suspendedUsers = directoryUsers.filter((user) => user.is_suspended || user.subscription_status === "banned").length;
  const expiringSoon = directoryUsers.filter((user) => {
    if (user.subscription_status !== "active") return false;
    const expiry = safeDate(user.expiry_date);
    return !!expiry && expiry >= now && expiry <= sevenDaysFromNow;
  }).length;

  const activeLast7DaysUsers = new Set(
    dailyLogs
      .filter((log) => {
        const activity = safeDate(log.completed_at ?? log.created_at);
        return log.completed === true && activity && activity >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      })
      .map((log) => String(log.user_id))
  );
  const consistencyRate =
    directoryUsers.length === 0 ? 0 : (activeLast7DaysUsers.size / directoryUsers.length) * 100;

  const stats: SenseiDashboardStats = {
    pendingApprovals: pendingUsers.length,
    activeSubscribers,
    totalRevenue,
    expiringSoon,
    totalUsers: directoryUsers.length,
    monthlyGrowth,
    consistencyRate,
    suspendedUsers
  };

  const monthSeries: Date[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return date;
  });

  const usersGrowth: SenseiChartPoint[] = monthSeries.map((month) => {
    const boundary = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      label: formatMonthLabel(month),
      value: directoryUsers.filter((user) => {
        const created = safeDate(user.joined_at);
        return created && created <= boundary;
      }).length
    };
  });

  const revenueByMonth = new Map<string, number>();
  for (const payment of approvedPayments) {
    const date = safeDate(payment.created_at);
    if (!date) continue;
    const key = monthKey(date);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(payment.plan_amount ?? 0));
  }
  const monthlyRevenue: SenseiChartPoint[] = monthSeries.map((month) => ({
    label: formatMonthLabel(month),
    value: revenueByMonth.get(monthKey(month)) ?? 0
  }));

  const subscriptionGrowth: SenseiChartPoint[] = monthSeries.map((month) => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    return {
      label: formatMonthLabel(month),
      value: approvedPayments.filter((payment) => {
        const date = safeDate(payment.reviewed_at ?? payment.created_at);
        return date && date >= start && date < end;
      }).length
    };
  });

  const dailyActiveUsers: SenseiChartPoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const label = day.toLocaleDateString("en-IN", { weekday: "short" });
    const ids = new Set(
      dailyLogs
        .filter((log) => {
          const activity = safeDate(log.completed_at ?? log.created_at);
          return (
            log.completed === true &&
            activity &&
            activity.getFullYear() === day.getFullYear() &&
            activity.getMonth() === day.getMonth() &&
            activity.getDate() === day.getDate()
          );
        })
        .map((log) => String(log.user_id))
    );
    return { label, value: ids.size };
  });

  const liveActiveUsers: SenseiChartPoint[] = Array.from({ length: 6 }, (_, index) => {
    const cutoff = new Date(now.getTime() - (5 - index) * 5 * 60 * 1000);
    return {
      label: index === 5 ? "Now" : `-${(5 - index) * 5}m`,
      value: onlineSessions.filter((session) => {
        const seen = safeDate(session.last_seen_at ?? session.online_at);
        return seen && seen >= cutoff;
      }).length
    };
  });

  const retentionTrend: SenseiChartPoint[] = dailyActiveUsers.map((point) => ({
    label: point.label,
    value: directoryUsers.length === 0 ? 0 : Math.round((point.value / directoryUsers.length) * 100)
  }));

  const workoutCompletion: SenseiChartPoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const label = day.toLocaleDateString("en-IN", { weekday: "short" });
    return {
      label,
      value: dailyLogs.filter((log) => {
        const activity = safeDate(log.completed_at ?? log.created_at);
        return log.workout_completed === true &&
          activity &&
          activity.getFullYear() === day.getFullYear() &&
          activity.getMonth() === day.getMonth() &&
          activity.getDate() === day.getDate();
      }).length
    };
  });

  const streakConsistency: SenseiChartPoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const label = day.toLocaleDateString("en-IN", { weekday: "short" });
    return {
      label,
      value: dailyLogs.filter((log) => {
        const activity = safeDate(log.completed_at ?? log.created_at);
        return log.completed === true &&
          activity &&
          activity.getFullYear() === day.getFullYear() &&
          activity.getMonth() === day.getMonth() &&
          activity.getDate() === day.getDate();
      }).length
    };
  });

  const dailyEngagement: SenseiChartPoint[] = dailyActiveUsers.map((point) => ({
    label: point.label,
    value: point.value
  }));

  const branchCounts = new Map<string, number>();
  for (const userRecord of directoryUsers) {
    const key = userRecord.branch?.trim() || userRecord.path_type?.trim() || "Unassigned";
    branchCounts.set(key, (branchCounts.get(key) ?? 0) + 1);
  }
  const branchDistribution: SenseiChartPoint[] = Array.from(branchCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const planDistribution: SenseiChartPoint[] = [
    { label: "Free", value: directoryUsers.filter((userRecord) => !userRecord.plan_amount).length },
    { label: "Rs 49", value: directoryUsers.filter((userRecord) => userRecord.plan_amount === 49).length },
    { label: "Rs 99", value: directoryUsers.filter((userRecord) => userRecord.plan_amount === 99).length }
  ];

  const approvedUsers = new Set(approvedPayments.map((payment) => String(payment.user_id)));
  const paidUsers = new Set(payments.map((payment) => String(payment.user_id)));
  const workoutCompletionUsers = new Set(
    dailyLogs.filter((log) => log.completed === true).map((log) => String(log.user_id))
  );

  const analytics: SenseiDashboardAnalytics = {
    usersGrowth,
    liveActiveUsers,
    monthlyRevenue,
    dailyActiveUsers,
    subscriptionGrowth,
    retentionTrend,
    workoutCompletion,
    branchDistribution,
    planDistribution,
    streakConsistency,
    dailyEngagement,
    conversionRate: directoryUsers.length === 0 ? 0 : (approvedUsers.size / directoryUsers.length) * 100,
    retentionRate: directoryUsers.length === 0 ? 0 : (activeLast7DaysUsers.size / directoryUsers.length) * 100,
    workoutCompletionRate:
      paidUsers.size === 0 ? 0 : (workoutCompletionUsers.size / paidUsers.size) * 100
  };

  const activityFeed: SenseiActivityEntry[] = [
    ...activityRows.map((row) => ({
      id: String(row.id),
      type: String(row.type ?? "activity"),
      label: toActivityLabel(String(row.type ?? "activity")),
      detail: activityDetail(row),
      user_id: (row.user_id ?? null) as string | null,
      created_at: (row.created_at ?? null) as string | null
    })),
    ...payments.slice(0, 10).map((row) => ({
      id: `utr-${row.id}`,
      type: "payment",
      label: row.status === "pending" ? "Payment submitted" : `Payment ${row.status}`,
      detail: `UTR ${row.utr_number ?? "—"} / Rs ${Number(row.plan_amount ?? 0)}`,
      user_id: (row.user_id ?? null) as string | null,
      created_at: (row.reviewed_at ?? row.created_at ?? null) as string | null
    }))
  ]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 30);

  const routeCounts = new Map<string, number>();
  for (const session of onlineSessions) {
    const key = String(session.pathname ?? "/");
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1);
  }
  routeCounts.set("/dojo", (routeCounts.get("/dojo") ?? 0) + dailyLogs.length);
  routeCounts.set("workouts", workoutCompletion.reduce((sum, item) => sum + item.value, 0));
  routeCounts.set("roadmap", dailyLogs.filter((log) => log.completed === true).length);
  const maxUsage = Math.max(...Array.from(routeCounts.values()), 1);
  const usageMetrics: SenseiUsageMetric[] = Array.from(routeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([label, value]) => ({
      label,
      value,
      intensity: value / maxUsage
    }));

  return { pendingUsers, directoryUsers, stats, analytics, activityFeed, usageMetrics };
}

function toActivityLabel(type: string) {
  if (type.includes("day")) return "Roadmap progress";
  if (type.includes("workout")) return "Workout completed";
  if (type.includes("payment")) return "Payment activity";
  if (type.includes("signup")) return "New signup";
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function activityDetail(row: GenericRow) {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  if (metadata.day) return `Day ${metadata.day} / ${metadata.xp ?? 0} XP`;
  if (metadata.pathname) return String(metadata.pathname);
  return "Platform activity recorded";
}

export default async function SenseiPage() {
  try {
    const { pendingUsers, directoryUsers, stats, analytics, activityFeed, usageMetrics } = await loadSenseiData();

    return (
      <main className="min-h-[100svh] bg-obsidian">
        <Navbar />
        <section className="container-app pt-24 pb-bottom-nav">
          <div className="mx-auto max-w-7xl">
            <header className="mb-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blood-500/25 bg-blood-500/[0.08] shadow-[0_0_24px_-12px_rgba(208,0,0,0.6)]">
                  <ShieldCheck className="h-5 w-5 text-blood-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Sensei Control Center</p>
                  <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Investor-grade warrior command</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
                    Review pending UTR submissions, inspect full learner context, approve premium access,
                    and monitor growth analytics from one disciplined control surface.
                  </p>
                </div>
              </div>
            </header>

            <SenseiCommandCenter
              pendingUsers={pendingUsers}
              directoryUsers={directoryUsers}
              stats={stats}
              analytics={analytics}
              activityFeed={activityFeed}
              usageMetrics={usageMetrics}
            />
          </div>
        </section>
        <Footer />
      </main>
    );
  } catch (error: any) {
    // If NEXT_REDIRECT is thrown, we must rethrow it so Next.js can redirect
    if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    
    return (
      <main className="min-h-[100svh] bg-obsidian text-white flex flex-col items-center justify-center p-6">
        <Navbar />
        <div className="max-w-2xl w-full rounded-3xl border border-blood-500/30 bg-blood-500/5 p-8 text-center mt-24">
          <ShieldCheck className="h-12 w-12 text-blood-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Command Center Initialization Failed</h1>
          <p className="text-white/60 mb-6">
            A critical failure occurred while booting the Sensei dashboard. Safe fallback activated.
          </p>
          <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-left overflow-auto text-sm text-red-400 font-mono">
            {error instanceof Error ? error.stack || error.message : String(error)}
          </div>
        </div>
        <Footer />
      </main>
    );
  }
}
