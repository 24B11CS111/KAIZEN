import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SenseiVerifying } from "@/components/SenseiVerifying";
import { LockedScreen } from "@/components/LockedScreen";
import { DojoDashboard } from "@/components/DojoDashboard";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient
} from "@/lib/supabase/server";
import {
  resetStaleStreak,
  daysSinceLastCompletion,
  type UserProgressSummary
} from "@/lib/dailyTracking";
import {
  isAuthBypassed,
  mockProfile,
  mockProgress,
  mockStreak
} from "@/lib/devBypass";
import { planToBranchDays } from "@/lib/ai-plan/adapter";
import type { PlanDay } from "@/lib/ai-plan/types";
import { generatePlan, planInputFromProfile } from "@/lib/ai-plan";

import { getUserSubscriptionStatus } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/** Promise wrapper that turns rejection into `{ data: null }`. */
function safe<T>(p: PromiseLike<{ data: T | null }>): Promise<{ data: T | null }> {
  return Promise.resolve(p).then(
    (r) => r,
    (e) => { console.warn("[dojo] query failed:", e?.message ?? e); return { data: null }; }
  );
}

export default async function DojoPage() {
  if (isAuthBypassed()) {
    return (
      <main>
        <Navbar />
        <DojoDashboard
          profile={mockProfile as any}
          progress={mockProgress as any}
          streak={mockStreak as any}
          showGate={false}
          sealedToday={false}
          streakBroken={false}
        />
        <Footer />
      </main>
    );
  }

  let user: any = null;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    console.error("[dojo] auth.getUser threw:", e);
  }
  if (!user) redirect("/auth/login?next=/dojo");

  // touch_expiry is best-effort — never let it block the page.
  try {
    const admin = createSupabaseAdminClient();
    await admin.rpc("touch_expiry", { uid: user.id } as any);
  } catch (e) {
    console.warn("[dojo] touch_expiry failed:", e);
  }

  let profile: any = null;
  try {
    const supabase = createSupabaseServerClient();
    const res = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = res.data;
  } catch (e) {
    console.error("[dojo] profile fetch threw:", e);
  }
  if (!profile) redirect("/");

  return (
    <main>
      <Navbar />
      <DojoStateRouter profile={profile} />
      <Footer />
    </main>
  );
}

async function DojoStateRouter({ profile }: { profile: any }) {
  if (profile.subscription_status === "rejected") return <LockedScreen reason="rejected" />;
  if (profile.subscription_status === "banned")   return <LockedScreen reason="rejected" />;
  if (profile.subscription_status === "pending") {
    return <SenseiVerifying name={profile.full_name} initialStatus={profile.subscription_status} />;
  }
  
  const subStatus = await getUserSubscriptionStatus();
  if (subStatus.isExpired) {
    redirect("/upgrade");
  }

  // Active user (trial, core, elite, or old active)
  if (profile.subscription_status === "active" || !subStatus.isExpired) {
    const supabase = createSupabaseServerClient();

    // Reset stale streak best-effort.
    let reset = { was_reset: false, current_streak: 0, longest_streak: 0 };
    try {
      reset = await resetStaleStreak(supabase as any);
    } catch {
      /* best-effort */
    }

    // Three parallel reads, each individually fault-tolerant. A missing
    // migration / table / column won't blank the dashboard — we'll just
    // render with defaults and the user can complete onboarding flows.
    const [
      summaryRes,
      planRes,
      logRes
    ] = await Promise.all([
      safe(supabase
        .from("user_progress")
        .select("user_id, current_day, completed_days, streak, longest_streak, last_completed_date, updated_at")
        .eq("user_id", profile.id)
        .maybeSingle()),
      safe(supabase
        .from("ai_plans")
        .select("generated_plan, track_id, track_label, version")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()),
      safe(supabase
        .from("daily_logs")
        .select("id, day, completed, notes, completed_at")
        .eq("user_id", profile.id)
        .order("day", { ascending: true }))
    ]);

    const summaryRow = summaryRes.data as any;
    let   planRow    = planRes.data as any;
    const logRows    = (logRes.data as any[]) ?? [];

    // KILL "DEMO BLEED": if the user has no AI plan yet, generate one
    // server-side and insert it now so the dashboard renders a real
    // personalized plan instead of falling back to the static branch
    // curriculum. Best-effort — if the insert fails (table missing,
    // RLS, etc.) we still render with the inline `plan` so the user
    // doesn't see generic data.
    if (!planRow || !Array.isArray(planRow.generated_plan)) {
      try {
        const planInput = planInputFromProfile(profile);
        const fresh = generatePlan(planInput);
        const admin = createSupabaseAdminClient();
        await admin.from("ai_plans").insert({
          user_id:        profile.id,
          generated_plan: fresh.days,
          source:         fresh.source,
          track_id:       fresh.track_id,
          track_label:    fresh.track_label,
          version:        1
        } as any);
        planRow = {
          generated_plan: fresh.days,
          track_id:       fresh.track_id,
          track_label:    fresh.track_label,
          version:        1
        };
      } catch (e) {
        console.warn("[dojo] auto-plan-generation failed:", e);
      }
    }

    // Brand-new user (no user_progress row AND no daily_logs): force
    // hard zeros so no fake streak / completion can ever appear.
    // Streak history is only honored when a real summary row exists.
    const hasAnyLog = (logRes.data as any[] | null)?.length
      ? ((logRes.data as any[]).length > 0)
      : false;
    const summary: UserProgressSummary = summaryRow ?? {
      user_id: profile.id,
      current_day: 1,
      completed_days: [],
      streak: hasAnyLog ? reset.current_streak : 0,
      longest_streak: hasAnyLog ? reset.longest_streak : 0,
      last_completed_date: null,
      updated_at: new Date().toISOString()
    };

    const rawPlanDays: PlanDay[] | null =
      Array.isArray(planRow?.generated_plan)
        ? (planRow.generated_plan as PlanDay[])
        : null;
    const aiCurriculum = rawPlanDays ? planToBranchDays(rawPlanDays) : null;
    const aiTrackLabel: string | null = planRow?.track_label ?? null;

    const progress = logRows.map((r: any) => ({
      id:           r.id,
      user_id:      profile.id,
      day_number:   r.day,
      completed:    r.completed,
      completed_at: r.completed_at
    }));

    const today = new Date().toISOString().slice(0, 10);
    const sealedToday = progress.some(
      (p: any) => p.completed && (p.completed_at ?? "").slice(0, 10) === today
    );

    const missedDays = daysSinceLastCompletion(summary.last_completed_date);

    const streakBroken =
      reset.was_reset ||
      (missedDays > 1 && (summary.longest_streak ?? 0) > 0);

    const justActivated =
      profile.start_date &&
      Date.now() - new Date(profile.start_date).getTime() < 60_000;

    return (
      <DojoDashboard
        profile={profile}
        progress={progress}
        streak={{
          user_id:             summary.user_id,
          current_streak:      summary.streak,
          longest_streak:      summary.longest_streak,
          last_completed_date: summary.last_completed_date,
          updated_at:          summary.updated_at
        }}
        showGate={Boolean(justActivated)}
        sealedToday={sealedToday}
        streakBroken={streakBroken}
        aiCurriculum={aiCurriculum}
        aiPlanDays={rawPlanDays}
        aiTrackLabel={aiTrackLabel}
        missedDays={missedDays}
        tier={subStatus.tier}
      />
    );
  }
  return <SenseiVerifying name={profile.full_name} initialStatus={profile.subscription_status} />;
}
