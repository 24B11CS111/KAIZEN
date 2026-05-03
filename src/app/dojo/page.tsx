import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SenseiVerifying } from "@/components/SenseiVerifying";
import { LockedScreen } from "@/components/LockedScreen";
import { DojoDashboard } from "@/components/DojoDashboard";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchUserProgress, hasCompletedToday, resetStaleStreak, isStreakBroken } from "@/lib/dailyTracking";

export const dynamic = "force-dynamic";

export default async function DojoPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dojo");

  const admin = createSupabaseAdminClient();
  await admin.rpc("touch_expiry", { uid: user.id } as any);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

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
  if (profile.subscription_status === "rejected") {
    return <LockedScreen reason="rejected" />;
  }
  if (profile.subscription_status === "banned") {
    return <LockedScreen reason="rejected" />;
  }
  if (profile.subscription_status === "pending") {
    return <SenseiVerifying name={profile.full_name} />;
  }
  if (profile.subscription_status === "expired") {
    return <LockedScreen reason="expired" />;
  }
  if (profile.subscription_status === "active") {
    const supabase = createSupabaseServerClient();

    // Run stale-streak reset, then read progress + streak in parallel.
    const reset = await resetStaleStreak(supabase as any).catch(() => ({
      was_reset: false, current_streak: 0, longest_streak: 0
    }));

    const [rows, { data: streak }] = await Promise.all([
      fetchUserProgress(supabase as any, profile.id).catch(() => []),
      supabase.from("streaks").select("*").eq("user_id", profile.id).maybeSingle()
    ]);

    const progress = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      day_number: r.day,
      completed: r.completed,
      completed_at: r.completed_at
    }));

    const sealedToday = hasCompletedToday(rows);
    const streakBroken = reset.was_reset || isStreakBroken(streak as any);

    const justActivated =
      profile.start_date &&
      Date.now() - new Date(profile.start_date).getTime() < 60_000;

    return (
      <DojoDashboard
        profile={profile}
        progress={progress}
        streak={
          streak ?? {
            user_id: profile.id,
            current_streak: 0,
            longest_streak: 0,
            last_completed_date: null,
            updated_at: ""
          }
        }
        showGate={Boolean(justActivated)}
        sealedToday={sealedToday}
        streakBroken={streakBroken}
      />
    );
  }
  return <SenseiVerifying name={profile.full_name} />;
}
