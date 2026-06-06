import { createSupabaseServerClient } from "@/lib/supabase/server";
export interface SenseiPaymentHistoryEntry {
  id: string;
  utr_number: string;
  plan_amount: number;
  status: string;
  created_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export interface SenseiUserRecord {
  user_id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  joined_at: string | null;
  last_active_at?: string | null;
  path_type: string | null;
  branch: string | null;
  occupation: string | null;
  field_of_study: string | null;
  daily_time_min: number | null;
  skill_level: string | null;
  main_goal: string | null;
  main_goal_other: string | null;
  workout_location: string | null;
  fitness_level: string | null;
  age: number | null;
  gender: string | null;
  is_suspended?: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  completed_days: number;
  current_roadmap_day: number;
  progress_percent: number;
  latest_activity_at: string | null;
  subscription_status: string | null;
  expiry_date: string | null;
  plan_amount: number | null;
  latest_payment_status: string | null;
  latest_utr_id: string | null;
  latest_utr_number: string | null;
  latest_payment_created_at: string | null;
  latest_rejection_reason: string | null;
  payment_history: SenseiPaymentHistoryEntry[];
  ai_track_label: string | null;
  ai_track_id: string | null;
  onboarding_raw: unknown;
  reviewable: boolean;
}

type GenericRow = Record<string, any>;

export async function getSenseiDirectoryUsers(): Promise<SenseiUserRecord[]> {
  const supabase = createSupabaseServerClient();
  
  const [profilesRes, streaksRes, paymentsRes, onboardingRes, aiPlansRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,avatar_url,full_name,whatsapp,created_at,last_active_at,path_type,branch,occupation,field_of_study,daily_time_min,skill_level,main_goal,main_goal_other,subscription_status,expiry_date,plan_amount,age,gender,workout_location,fitness_level,is_suspended")
      .order("created_at", { ascending: false }),
    supabase.from("streaks").select("user_id,current_streak,longest_streak,last_completed_date,updated_at"),
    supabase.from("utr_logs").select("id,user_id,utr_number,plan_amount,status,created_at,reviewed_at,rejection_reason").order("created_at", { ascending: false }),
    supabase.from("onboarding_data").select("user_id,full_name,age,gender,occupation,field_of_study,daily_time_min,skill_level,main_goal,main_goal_other,raw,created_at").order("created_at", { ascending: false }),
    supabase.from("ai_plans").select("user_id,track_id,track_label,version,created_at").order("created_at", { ascending: false }),
  ]);

  const profiles = ((profilesRes.data as GenericRow[] | null) ?? []).filter((profile) => profile.email !== "hrixofficial@gmail.com");
  const streaks = (streaksRes.data as GenericRow[] | null) ?? [];
  const payments = (paymentsRes.data as GenericRow[] | null) ?? [];
  const onboardingEntries = (onboardingRes.data as GenericRow[] | null) ?? [];
  const aiPlans = (aiPlansRes.data as GenericRow[] | null) ?? [];

  const streakMap = new Map<string, GenericRow>();
  for (const row of streaks) streakMap.set(String(row.user_id), row);

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

  return profiles.map((profile) => {
    const userId = String(profile.id);
    const userPayments = paymentsByUser.get(userId) ?? [];
    const latestPayment = userPayments[0] ?? null;
    const onboarding = onboardingMap.get(userId);
    const streak = streakMap.get(userId);
    const latestPlan = aiPlanMap.get(userId);

    const paymentHistory = userPayments.map((entry) => ({
      id: String(entry.id),
      utr_number: entry.utr_number ?? "—",
      plan_amount: Number(entry.plan_amount ?? 0),
      status: entry.status ?? "pending",
      created_at: entry.created_at ?? null,
      reviewed_at: entry.reviewed_at ?? null,
      rejection_reason: entry.rejection_reason ?? null
    }));

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
      completed_days: 0, // Migrated to progressMap logic separately for analytics
      current_roadmap_day: 1,
      progress_percent: 0,
      latest_activity_at: null,
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
}
