"use client";
import { memo, useCallback, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Lock, Flame, Trophy, Sparkles, FlameKindling } from "lucide-react";
import Link from "next/link";
import { GateOpening } from "./GateOpening";
import { MissionCard } from "./MissionCard";
import { daysRemaining } from "@/lib/utils";
import { cseDays } from "@/data/cse-days";
import { mapDailyTrackingError } from "@/lib/dailyTracking";
import { getMilestone, motivationLine, isMilestoneJustReached } from "@/lib/milestones";
import type { Profile, ProgressLog, Streak } from "@/types/database";

interface Props {
  profile: Profile;
  progress: ProgressLog[];
  streak: Streak;
  showGate: boolean;
  sealedToday?: boolean;
  streakBroken?: boolean;
}

const TOTAL_DAYS = 30;
const FREE_LIMIT = 3;

export function DojoDashboard({ profile, progress, streak, showGate, sealedToday = false, streakBroken = false }: Props) {
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

  const isPaid = (profile.plan_amount ?? 0) > 0;
  const planMaxDay = isPaid ? TOTAL_DAYS : FREE_LIMIT;

  const remaining = daysRemaining(profile.expiry_date);
  const completedCount = completed.size;
  const pct = Math.round((completedCount / TOTAL_DAYS) * 100);
  const noProgress = completedCount === 0;
  const milestone = getMilestone(completedCount);
  const milestoneJust = isMilestoneJustReached(completedCount);

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
  const dayData = useMemo(() => cseDays.find((d) => d.day === displayDay), [displayDay]);
  const allDone = completedCount >= TOTAL_DAYS;
  const planLocked = currentDay > planMaxDay && !allDone;
  const cycleLocked = currentDay > cycleDay && !planLocked && !allDone;
  const cardLocked = (planLocked || cycleLocked) && !allDone;

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
          setStreakBrokenLocal(false);
          if (json.current_streak !== undefined) {
            setStreakState({
              current: json.current_streak,
              longest: json.longest_streak
            });
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

      <main className="container-app pt-6 pb-bottom-nav">
        <header className="pt-2 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            Welcome back
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold mt-0.5 truncate">{firstName}</h1>
        </header>

        {streakBrokenLocal && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card p-3 mb-3 border-blood-500/40 flex items-center gap-3"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40 shrink-0">
              <FlameKindling className="h-4 w-4 text-blood-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Streak broken</div>
              <div className="text-xs text-white/60 mt-0.5">
                Restart discipline. Best streak: {streakState.longest} {streakState.longest === 1 ? "day" : "days"}.
              </div>
            </div>
          </motion.div>
        )}

        <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <StatCard label="Day" value={String(displayDay)} sub={"of " + TOTAL_DAYS} />
          <StatCard
            label="Streak"
            value={String(streakState.current)}
            sub={streakState.current === 1 ? "day" : "days"}
            icon={<Flame className="h-3.5 w-3.5 text-blood-500" />}
          />
          <StatCard label="Progress" value={pct + "%"} sub={completedCount + " sealed"} />
        </section>

        <div className="mt-4 px-1">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: pct + "%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-blood-500"
              style={{ boxShadow: "0 0 12px rgba(208,0,0,0.6)" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
            <span>{Math.max(0, remaining)} days remain</span>
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Best {streakState.longest}
            </span>
          </div>
        </div>

        {milestone.tier > 0 && (
          <motion.div
            key={milestone.tier}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blood-500/40 bg-blood-500/10 px-2.5 py-1 text-[11px] font-medium text-white/85"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-blood-500"
              style={{ boxShadow: "0 0 6px rgba(208,0,0,0.7)" }}
            />
            {milestone.label}
            {milestoneJust && (
              <span className="ml-1 text-white/55 font-normal">- {milestone.message}</span>
            )}
          </motion.div>
        )}

        {noProgress && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="card p-4 mt-4 border-blood-500/30 flex items-center gap-3"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40 shrink-0">
              <Sparkles className="h-4 w-4 text-blood-500" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Start your journey</div>
              <div className="text-xs text-white/60 mt-0.5">Complete Day 1 to begin your streak.</div>
            </div>
          </motion.div>
        )}

        {!isPaid && !noProgress && (
          <div className="mt-4 card p-3 border-blood-500/30 text-xs text-white/80 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-blood-500 shrink-0" />
            <span className="flex-1">Free preview - first {FREE_LIMIT} days unlocked.</span>
            <Link href="/enroll" className="text-blood-500 font-semibold whitespace-nowrap">Upgrade</Link>
          </div>
        )}

        <MissionCard
          day={displayDay}
          branch={profile.branch}
          data={dayData}
          locked={cardLocked}
          lockReason={planLocked ? "plan" : "cycle"}
          upgradeHref="/enroll"
        />

        {!allDone && !cardLocked && !completed.has(displayDay) && !sealedTodayLocal && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            onClick={() => completeDay(displayDay)}
            disabled={pending}
            className="btn-primary w-full mt-4 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {pending ? (
              "Sealing..."
            ) : (
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
            className="card mt-4 p-4 flex items-center gap-3 border-blood-500/40"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40">
              <Check className="h-4 w-4 text-blood-500" />
            </span>
            <div>
              <div className="text-sm font-semibold">Day sealed for today.</div>
              <div className="text-xs text-white/55">Return tomorrow to unlock Day {displayDay}.</div>
            </div>
          </motion.div>
        )}

        {!allDone && !cardLocked && completed.has(displayDay) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="card mt-4 p-4 flex items-center gap-3 border-blood-500/40"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40">
              <Check className="h-4 w-4 text-blood-500" />
            </span>
            <div>
              <div className="text-sm font-semibold">Day {displayDay} sealed.</div>
              <div className="text-xs text-white/55">{motivationLine(completedCount)}</div>
            </div>
          </motion.div>
        )}

        {allDone && (
          <div className="card mt-4 p-4 flex items-center gap-3 border-blood-500/40">
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
          <div className="mt-3 card p-3 border-blood-500/40 text-xs text-blood-500">{errMsg}</div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">30-Day Path</h2>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
              Drip - Month 1
            </span>
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
                  className={"aspect-square rounded-md border grid place-items-center text-[11px] font-medium transition-shadow " + cls}
                  title={tip}
                  style={done ? { boxShadow: "0 0 8px -2px rgba(208,0,0,0.55)" } : undefined}
                >
                  {planLockedCell || cycleLockedCell ? (
                    <Lock className="h-3 w-3" />
                  ) : done ? (
                    <Check className="h-3.5 w-3.5 text-blood-500" />
                  ) : (
                    <span>{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </motion.div>
  );
}

const StatCard = memo(function StatCard({
  label, value, sub, icon
}: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/55 inline-flex items-center gap-1 justify-center">
        {icon} {label}
      </div>
      <div className="text-xl sm:text-2xl font-semibold mt-1 leading-none">{value}</div>
      {sub && <div className="text-[10px] text-white/45 mt-1">{sub}</div>}
    </div>
  );
});
