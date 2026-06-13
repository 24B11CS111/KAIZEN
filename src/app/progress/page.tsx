import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, Flame, Check, Sparkles, ArrowRight,
  Trophy, Calendar, TrendingUp, Lock
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 30;

export default async function ProgressPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/progress");

  const { data: summary } = await supabase
    .from("user_progress")
    .select("current_day, completed_days, streak, longest_streak")
    .eq("user_id", user.id)
    .maybeSingle();

  const s: any = summary;
  const completedDays   = new Set<number>((s?.completed_days ?? []) as number[]);
  const completedCount  = completedDays.size;
  const pct             = Math.round((completedCount / TOTAL_DAYS) * 100);
  const currentStreak   = (s?.streak ?? 0) as number;
  const longestStreak   = (s?.longest_streak ?? 0) as number;
  const currentDay      = (s?.current_day ?? 1) as number;
  const dayNumbers      = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
  const remaining       = TOTAL_DAYS - completedCount;

  return (
    <main className="min-h-[100svh] bg-obsidian">
      {/* Top ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 z-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% -10%, rgba(255,255,255,0.03), transparent 70%)"
        }}
      />

      <div className="relative z-10 container-app max-w-md pt-8 pb-bottom-nav">

        {/* Header */}
        <header className="flex items-center gap-3 mb-8">
          <span className="grid place-items-center h-11 w-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shrink-0">
            <BarChart3 className="h-5 w-5 text-[var(--text-muted)]" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.20em] text-white/45">Progress</p>
            <h1 className="text-[22px] font-semibold leading-tight mt-0.5">Your journey</h1>
          </div>
        </header>

        {/* Zero-state CTA */}
        {completedCount === 0 && (
          <div className="mb-5 card p-5 flex items-center gap-4">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shrink-0">
              <Sparkles className="h-5 w-5 text-[var(--text-muted)]" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Start your journey</div>
              <div className="text-xs text-white/55 mt-0.5">Complete Day 1 to begin your streak.</div>
            </div>
            <Link
              href="/dojo"
              className="btn-tap shrink-0 inline-flex items-center gap-1 rounded-lg bg-blood-500 text-white text-xs font-semibold px-3 py-2 shadow-[0_0_16px_-4px_rgba(208,0,0,0.6)]"
            >
              Go <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Completion */}
          <div className="card p-5 col-span-2">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.20em] text-white/45">Completed</p>
                <p className="mt-1 text-4xl font-semibold leading-none tabular-nums">
                  {completedCount}
                  <span className="text-white/35 text-xl ml-1">/ {TOTAL_DAYS}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-semibold text-white/70">{pct}%</span>
                {remaining > 0 && (
                  <p className="text-[11px] text-white/35 mt-0.5">{remaining} days left</p>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: pct + "%",
                  background: pct >= 100
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : "linear-gradient(90deg, #7a0000, #D00000)"
                }}
              />
            </div>
          </div>

          {/* Streak */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-blood-500" />
              <span className="text-[10px] uppercase tracking-[0.20em] text-white/45">Streak</span>
            </div>
            <p className="text-3xl font-semibold tabular-nums leading-none">
              {currentStreak}
            </p>
            <p className="text-[11px] text-white/40 mt-1">
              {currentStreak === 1 ? "day" : "days"} active
            </p>
          </div>

          {/* Best streak */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] uppercase tracking-[0.20em] text-white/45">Best</span>
            </div>
            <p className="text-3xl font-semibold tabular-nums leading-none">
              {longestStreak}
            </p>
            <p className="text-[11px] text-white/40 mt-1">
              {longestStreak === 1 ? "day" : "days"} record
            </p>
          </div>
        </div>

        {/* 30-day grid */}
        <div className="card p-5 mt-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/40" />
              <span className="text-[10px] uppercase tracking-[0.20em] text-white/45">30-day map</span>
            </div>
            {completedCount > 0 && (
              <Link
                href="/dojo"
                className="text-[11px] text-blood-500 font-medium inline-flex items-center gap-1"
              >
                Continue <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {dayNumbers.map((day) => {
              const done    = completedDays.has(day);
              const current = day === currentDay && !done;
              const locked  = day > currentDay && !done;

              return (
                <div
                  key={day}
                  className={
                    "aspect-square rounded-xl border flex items-center justify-center transition-all " +
                    (done
                      ? "bg-blood-500/15 border-blood-500/40"
                      : current
                      ? "border-[var(--border-light)] bg-white/5 shadow-[0_0_12px_-4px_rgba(255,255,255,0.1)]"
                      : "border-[var(--border)] bg-transparent")
                  }
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5 text-blood-500" />
                  ) : locked ? (
                    <span className="text-[9px] text-white/20 font-medium">{day}</span>
                  ) : (
                    <span className={
                      "text-[10px] font-semibold " +
                      (current ? "text-blood-500" : "text-white/35")
                    }>
                      {day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-[10px] text-white/35">
            <span className="flex items-center gap-1.5">
              <Check className="h-2.5 w-2.5 text-blood-500" />
              Done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded border border-blood-500/60 bg-blood-500/[0.08]" />
              Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded border border-white/[0.06]" />
              Upcoming
            </span>
          </div>
        </div>

        {/* Motivational footer */}
        {completedCount > 0 && completedCount < TOTAL_DAYS && (
          <div className="mt-4 card p-4 flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-blood-500 shrink-0" />
            <p className="text-[12px] text-white/50 leading-relaxed">
              {pct >= 75
                ? "Almost there. The final stretch is where legends are made."
                : pct >= 50
                ? "Past the halfway point. Momentum is everything."
                : "Every day you show up, the path gets clearer."}
            </p>
          </div>
        )}

        {pct >= 100 && (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.05] p-5 text-center">
            <Trophy className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">30 days complete.</p>
            <p className="text-xs text-white/55 mt-1">You finished what most never start.</p>
          </div>
        )}
      </div>
    </main>
  );
}
