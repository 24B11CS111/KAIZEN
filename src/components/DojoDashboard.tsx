"use client";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Lock, Sparkles, Trophy, FlameKindling } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GateOpening } from "./GateOpening";
import { MissionCard } from "./MissionCard";
import { HeroStatusPanel } from "./HeroStatusPanel";
import { AnalyticsRings } from "./AnalyticsRings";
import { AIGuidancePanel } from "./AIGuidancePanel";
import { YouVsYou } from "./YouVsYou";
import { AchievementGrid, buildAchievements } from "./AchievementGrid";
import { CompletionBurst } from "./CompletionBurst";
import { EngagementMount } from "./EngagementMount";
import type { EngagementInput } from "@/lib/engagement";
import { WorkoutMissionCard } from "./WorkoutMissionCard";
import { generateWorkout, workoutInputFromProfile } from "@/lib/workout";
import { DailyMissionBoard } from "./DailyMissionBoard";
import { assembleDailyMission } from "@/lib/missions";
import type { PlanDay } from "@/lib/ai-plan/types";
import { PersonalizedWelcome } from "./PersonalizedWelcome";
import { useRealtimeTracking } from "@/lib/useRealtimeTracking";
import { daysRemaining } from "@/lib/utils";
import { getCurriculumForBranch, type BranchDay } from "@/data/days";
import { mapDailyTrackingError } from "@/lib/dailyTracking";
import { computeXpState, aiStatusMessage, TOTAL_DAYS } from "@/lib/ranking";
import { getMilestone } from "@/lib/milestones";
import type { Profile, ProgressLog, Streak } from "@/types/database";

interface Props {
  profile: Profile;
  progress: ProgressLog[];
  streak: Streak;
  showGate: boolean;
  sealedToday?: boolean;
  streakBroken?: boolean;
  /**
   * Optional AI-generated 30-day plan, pre-mapped to the BranchDay shape.
   * When present, it overrides the static branch curriculum.
   */
  aiCurriculum?: BranchDay[] | null;
  /** Human-readable label for the AI plan track (e.g. "DSA + Placements"). */
  aiTrackLabel?: string | null;
  /** Raw PlanDay[] from ai_plans.generated_plan (for unified mission board). */
  aiPlanDays?: PlanDay[] | null;
  /** Full calendar days since the last sealed day (0 = today, -1 = never). */
  missedDays?: number;
}

const FREE_LIMIT = 3;

export function DojoDashboard({
  profile, progress, streak, showGate,
  sealedToday = false, streakBroken = false,
  aiCurriculum = null, aiTrackLabel = null,
  aiPlanDays = null,
  missedDays = -1
}: Props) {
  const [gateDone, setGateDone] = useState(!showGate);
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(progress.filter((p) => p.completed).map((p) => p.day_number))
  );
  const [streakState, setStreakState] = useState({
    current: streak?.current_streak ?? 0,
    longest: streak?.longest_streak ?? 0
  });
  const [pending, startTransition] = useTransition();
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [sealedTodayLocal, setSealedTodayLocal] = useState<boolean>(sealedToday);
  const [streakBrokenLocal, setStreakBrokenLocal] = useState<boolean>(streakBroken);
  const [showBurst, setShowBurst] = useState(false);
  const [approvalBanner, setApprovalBanner] = useState(false);
  const currentStreak = streakState.current;
  const longestStreak = streakState.longest;

  const isPaid = (profile.plan_amount ?? 0) > 0;
  const planMaxDay = isPaid ? TOTAL_DAYS : FREE_LIMIT;

  const remaining = daysRemaining(profile.expiry_date);
  const completedCount = completed.size;
  const pct = Math.round((completedCount / TOTAL_DAYS) * 100);
  const noProgress = completedCount === 0;

  const cycleDay = useMemo(() => {
    if (!profile.start_date) return 1;
    const ms = Date.now() - new Date(profile.start_date).getTime();
    return Math.min(TOTAL_DAYS, Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1));
  }, [profile.start_date]);

  const currentDay = useMemo(() => {
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      if (!completed.has(d)) return d;
    }
    return TOTAL_DAYS;
  }, [completed]);

  const unlockedCeiling = Math.min(cycleDay, planMaxDay);
  const displayDay = Math.min(currentDay, planMaxDay);
  // Prefer the user's AI-generated 30-day plan when one exists; otherwise
  // fall back to the static branch curriculum so nothing breaks for users
  // who haven't gone through the new onboarding yet.
  const curriculum = useMemo(
    () => (aiCurriculum && aiCurriculum.length > 0
      ? aiCurriculum
      : getCurriculumForBranch(profile.branch)),
    [aiCurriculum, profile.branch]
  );
  const dayData = useMemo(() => curriculum.find((d) => d.day === displayDay), [curriculum, displayDay]);
  const allDone = completedCount >= TOTAL_DAYS;
  const planLocked = currentDay > planMaxDay && !allDone;
  const cycleLocked = currentDay > cycleDay && !planLocked && !allDone;
  const cardLocked = (planLocked || cycleLocked) && !allDone;

  // Gamification
  const xp = useMemo(() => computeXpState(completedCount, currentStreak), [completedCount, currentStreak]);
  const todayProgressPct = sealedTodayLocal || completed.has(displayDay) ? 100 : 0;
  const aiMsg = useMemo(
    () => aiStatusMessage({
      completedCount, streak: currentStreak,
      sealedToday: sealedTodayLocal, streakBroken: streakBrokenLocal,
      missedDays
    }),
    [completedCount, currentStreak, sealedTodayLocal, streakBrokenLocal, missedDays]
  );
  const milestone = getMilestone(completedCount);
  const achievements = useMemo(
    () => buildAchievements({
      completed: completedCount,
      longestStreak,
      currentStreak
    }),
    [completedCount, longestStreak, currentStreak]
  );

  // Realtime - bump key whenever any of this user's data changes server-side
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  useRealtimeTracking({
    userId: profile.id,
    onChange: () => { setRefreshKey((k) => k + 1); router.refresh(); }
  });

  const completeDay = useCallback(
    (day: number) => {
      if (completed.has(day) || day > unlockedCeiling || sealedTodayLocal) return;
      setErrMsg(null);
      startTransition(async () => {
        try {
          const res = await fetch("/api/progress/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "complete_failed");
          setCompleted((prev) => new Set(prev).add(day));
          setSealedTodayLocal(true);
          setShowBurst(true);
          setTimeout(() => setShowBurst(false), 750);
          setStreakBrokenLocal(false);
          if (json.current_streak !== undefined) {
            setStreakState({ current: json.current_streak, longest: json.longest_streak });
          }
        } catch (e: any) {
          console.error(e);
          const raw = (e?.message ?? "").toLowerCase();
          setErrMsg(mapDailyTrackingError(e?.message ?? ""));
          if (raw.includes("daily limit")) setSealedTodayLocal(true);
        }
      });
    },
    [completed, unlockedCeiling, sealedTodayLocal]
  );

  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : "Warrior";

  // Workout mission for today — kept for legacy WorkoutMissionCard surface.
  const workoutMission = useMemo(
    () => generateWorkout(workoutInputFromProfile(profile, displayDay)),
    [profile, displayDay]
  );

  // Unified DailyMission — pulls study/practice/build from the user's
  // personalized AI plan day, workout from the workout module, recovery
  // from a deterministic per-day rotation, and discipline from the plan.
  const planDayObject: PlanDay | null = useMemo(() => {
    if (!aiPlanDays || aiPlanDays.length === 0) return null;
    return aiPlanDays.find((d) => d.day === displayDay) ?? null;
  }, [aiPlanDays, displayDay]);

  const dailyMission = useMemo(
    () => (planDayObject
      ? assembleDailyMission({
          profile,
          planDay: planDayObject,
          trackLabel: aiTrackLabel,
          dayNumber: displayDay
        })
      : null),
    [profile, planDayObject, aiTrackLabel, displayDay]
  );

  // Engagement input — derived from the same data already in props, so
  // no extra fetches. Refreshes whenever local progress/streak changes.
  const engagementInput: EngagementInput = useMemo(
    () => ({
      full_name:            profile.full_name ?? null,
      expiry_date:          profile.expiry_date ?? null,
      subscription_status:  profile.subscription_status ?? null,
      streak:               currentStreak,
      longest_streak:       longestStreak,
      current_day:          currentDay,
      completed_count:      completedCount,
      sealed_today:         sealedTodayLocal,
      missed_days:          missedDays
    }),
    [
      profile.full_name, profile.expiry_date, profile.subscription_status,
      currentStreak, longestStreak, currentDay,
      completedCount, sealedTodayLocal, missedDays
    ]
  );

  useEffect(() => {
    try {
      const flag = window.sessionStorage.getItem("kaizen_verification_status");
      if (flag === "approved") {
        setApprovalBanner(true);
        window.sessionStorage.removeItem("kaizen_verification_status");
      }
    } catch {}
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <AnimatePresence>
        {!gateDone && <GateOpening onComplete={() => setGateDone(true)} />}
      </AnimatePresence>

      {/* Sub-screen burst fires from the dashboard center on day completion */}
      <div className="fixed inset-0 pointer-events-none z-50 grid place-items-center">
        <CompletionBurst show={showBurst} />
      </div>

      <main className="container-app pt-4 sm:pt-6 pb-bottom-nav space-y-5">
        <PersonalizedWelcome
          firstName={firstName}
          currentDay={displayDay}
          goal={(profile as any).main_goal ?? null}
          branch={profile.branch ?? null}
          streak={currentStreak}
          longestStreak={longestStreak}
          sealedToday={sealedTodayLocal}
          missedDays={missedDays}
        />

        <EngagementMount input={engagementInput} />

        <HeroStatusPanel
          firstName={firstName}
          xp={xp}
          currentStreak={currentStreak}
          todayProgressPct={todayProgressPct}
          aiMessage={aiMsg}
        />

        {approvalBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Access granted</div>
            <div className="mt-1 text-sm font-semibold text-white">
              Sensei has accepted your discipline path.
            </div>
          </motion.div>
        )}

        {remaining > 0 && remaining <= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-300">Expiry reminder</div>
            <div className="mt-1 text-sm font-semibold text-white">
              Your subscription expires in {remaining} day{remaining === 1 ? "" : "s"}.
            </div>
          </motion.div>
        )}

        {streakBrokenLocal && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-xl border border-blood-500/45 bg-gradient-to-br from-blood-500/[0.08] via-blood-500/[0.04] to-transparent p-4 sm:p-5"
            style={{ boxShadow: "0 0 36px -12px rgba(208,0,0,0.55)" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(120% 80% at 10% 0%, rgba(208,0,0,0.18), transparent 60%)"
              }}
            />
            <div className="relative flex items-start gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/20 border border-blood-500/55 shrink-0 animate-pulse">
                <FlameKindling className="h-5 w-5 text-blood-500" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">
                  Discipline broken
                </div>
                <p className="mt-1.5 text-[14px] sm:text-[15px] text-white leading-snug font-semibold">
                  You missed a day.
                </p>
                <p className="mt-1 text-[12.5px] text-white/70 leading-relaxed">
                  Discipline weakens when consistency breaks. Return and continue your ascent.
                </p>
                <div className="mt-3 text-[11px] text-white/45">
                  Best streak: {longestStreak} {longestStreak === 1 ? "day" : "days"} — your floor, not your ceiling.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnalyticsRings
          completedDays={completedCount}
          totalDays={TOTAL_DAYS}
          cycleDay={cycleDay}
          longestStreak={longestStreak}
          studyHoursEstimate={completedCount * 1.5}
        />

        <div className="flex items-center justify-between text-[11px] text-white/45 px-1">
          <span>{Math.max(0, remaining)} days remain in cycle</span>
          {milestone.tier > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blood-500" style={{ boxShadow: "0 0 6px rgba(208,0,0,0.7)" }} />
              {milestone.label}
            </span>
          )}
        </div>

        {noProgress && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="card p-4 border-blood-500/30 flex items-center gap-3"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40 shrink-0">
              <Sparkles className="h-4 w-4 text-blood-500" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Every master was once untrained</div>
              <div className="text-xs text-white/60 mt-0.5">Begin Day 1. The path opens with the first step.</div>
            </div>
          </motion.div>
        )}
        {!isPaid && !noProgress && (
          <div className="card p-3 border-blood-500/30 text-xs text-white/80 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-blood-500 shrink-0" />
            <span className="flex-1">Free preview - first {FREE_LIMIT} days unlocked.</span>
            <Link href="/enroll" className="text-blood-500 font-semibold whitespace-nowrap">Upgrade</Link>
          </div>
        )}

        {/* Locked days keep the existing upgrade overlay. Unlocked days
            use the new unified 6-category board (Study · Practice · Build
            · Workout · Discipline · Recovery). When no AI plan exists
            yet (rare — auto-generation runs server-side) we fall back to
            the legacy MissionCard so the dashboard never goes blank. */}
        {cardLocked || !dailyMission ? (
          <>
            <MissionCard
              day={displayDay}
              branch={aiTrackLabel ?? profile.branch}
              data={dayData as any}
              locked={cardLocked}
              lockReason={planLocked ? "plan" : "cycle"}
              upgradeHref="/enroll"
            />
            {!cardLocked && <WorkoutMissionCard mission={workoutMission} />}
          </>
        ) : (
          <DailyMissionBoard mission={dailyMission} />
        )}

        {!allDone && !cardLocked && !completed.has(displayDay) && !sealedTodayLocal && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            onClick={() => completeDay(displayDay)}
            disabled={pending}
            className="btn-primary w-full disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {pending ? "Sealing..." : (
              <>
                Complete Day {displayDay}
                <ArrowRight className="h-4 w-4 cta-nudge" />
              </>
            )}
          </motion.button>
        )}
        {!allDone && !cardLocked && !completed.has(displayDay) && sealedTodayLocal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="card p-4 flex items-center gap-3 border-blood-500/40"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40">
              <Check className="h-4 w-4 text-blood-500" />
            </span>
            <div>
              <div className="text-sm font-semibold">Day completed. Continue your ascent.</div>
              <div className="text-xs text-white/55">Return tomorrow to unlock Day {displayDay}.</div>
            </div>
          </motion.div>
        )}
        {!allDone && !cardLocked && completed.has(displayDay) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="card p-4 flex items-center gap-3 border-blood-500/40"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40">
              <Check className="h-4 w-4 text-blood-500" />
            </span>
            <div>
              <div className="text-sm font-semibold">Day {displayDay} sealed.</div>
              <div className="text-xs text-white/55">The fire steadies.</div>
            </div>
          </motion.div>
        )}
        {allDone && (
          <div className="card p-4 flex items-center gap-3 border-blood-500/40">
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40">
              <Trophy className="h-4 w-4 text-blood-500" />
            </span>
            <div>
              <div className="text-sm font-semibold">30 days complete.</div>
              <div className="text-xs text-white/55">You finished the path. Discipline wins.</div>
            </div>
          </div>
        )}
        {errMsg && (
          <div className="card p-3 border-blood-500/40 text-xs text-blood-500">{errMsg}</div>
        )}

        <AIGuidancePanel
          recommendation={dayData?.concept ? dayData.concept : "Take ten quiet minutes before you begin."}
          focusArea={dayData?.title || (profile.branch ?? "Discipline")}
          estimatedMinutes={45}
        />

        <YouVsYou refreshKey={refreshKey} />
        <AchievementGrid items={achievements} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">30-Day Path</h2>
            {(aiTrackLabel || profile.branch) && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                {aiTrackLabel ?? profile.branch} · Month 1
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
              const done = completed.has(day);
              const planLockedCell = day > planMaxDay && !done;
              const cycleLockedCell = day > cycleDay && !planLockedCell && !done;
              const isToday = day === displayDay && !done && !planLockedCell && !cycleLockedCell;
              const cls = done
                ? "bg-blood-500/20 border-blood-500/55 text-white"
                : planLockedCell
                ? "bg-black/40 border-white/8 text-white/25 blur-[1.2px]"
                : cycleLockedCell
                ? "bg-white/[0.02] border-white/8 text-white/30"
                : isToday
                ? "border-blood-500/70 text-white animate-pulse"
                : "border-white/15 text-white/70";
              const tip = done
                ? "Day " + day + " - sealed"
                : planLockedCell
                ? "Upgrade to unlock"
                : cycleLockedCell
                ? "Locked"
                : "Day " + day;
              return (
                <div
                  key={day}
                  className={
                    "h-8 rounded-md border grid place-items-center text-[10px] font-medium tap-card transition-colors " +
                    cls
                  }
                  title={tip}
                >
                  {done ? <Check className="h-3 w-3" /> : day}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </motion.div>
  );
}

export default memo(DojoDashboard);
