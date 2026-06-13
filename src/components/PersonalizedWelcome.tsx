"use client";

/**
 * KAIZEN.SYS — PersonalizedWelcome
 *
 * Drops at the very top of the dashboard. Uses 100% real user data:
 *   - profile.full_name  (display name)
 *   - current day        (from user_progress summary OR derived)
 *   - main_goal          (from onboarding)
 *   - current streak     (from streaks)
 *   - sealed_today       (today's completion state)
 *
 * Three variants, dynamic based on state:
 *   1. First day — "Welcome back, {name}. Day 1 begins now."
 *   2. Active streak — "Welcome back, {name}. Day {n} · {streak}-day fire."
 *   3. Returning from break — "Welcome back, {name}. Day {n} — reseal the line."
 *
 * Premium minimal — no new tokens, no overdesign.
 */

import { motion } from "framer-motion";
import { Sparkles, Flame, FlameKindling, Sun } from "lucide-react";
import { friendlyGoalLabel } from "@/lib/missions";

interface Props {
  firstName:     string;
  currentDay:    number;          // 1..30
  goal:          string | null;
  streak:        number;
  longestStreak: number;
  sealedToday:   boolean;
  missedDays:    number;          // 0 = sealed today, -1 = never, >=1 = missed
  branch:        string | null;
}

export function PersonalizedWelcome({
  firstName, currentDay, goal, streak,
  longestStreak, sealedToday, missedDays, branch
}: Props) {
  const variant = pickVariant({ currentDay, streak, longestStreak, sealedToday, missedDays });
  const v = COPY[variant](firstName, currentDay, streak);
  const Icon = v.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden card p-4 sm:p-5"
    >
      {/* subtle radial accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
            "radial-gradient(110% 70% at 100% 0%, rgba(255,255,255,0.03), transparent 60%)"
        }}
      />
      <div className="relative flex items-start gap-3">
        <span
          className={
            "grid place-items-center h-10 w-10 rounded-md shrink-0 border " +
            v.iconWrap
          }
        >
          <Icon className={"h-5 w-5 " + v.iconColor} />
        </span>

        <div className="min-w-0 flex-1">
          {/* eyebrow */}
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-semibold">
            {v.eyebrow}
          </div>
          {/* headline */}
          <p className="mt-1 text-[15px] sm:text-[16px] font-semibold leading-tight text-white">
            {v.headline}
          </p>
          {/* meta row — real data only */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/55">
            {goal && (
              <span>
                Goal · <span className="text-white/80">{friendlyGoalLabel(goal)}</span>
              </span>
            )}
            {branch && (
              <span>
                Branch · <span className="text-white/80">{branch}</span>
              </span>
            )}
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-[var(--text)] font-semibold">
                <Flame className="h-3 w-3 text-blood-500" /> {streak}-day streak
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- variant logic + copy ---------- */

type Variant = "first_day" | "active" | "returning" | "sealed_today";

function pickVariant(args: {
  currentDay: number; streak: number; longestStreak: number;
  sealedToday: boolean; missedDays: number;
}): Variant {
  if (args.sealedToday)                                       return "sealed_today";
  if (args.currentDay === 1 && args.longestStreak === 0)      return "first_day";
  if (args.missedDays >= 2)                                   return "returning";
  return "active";
}

const COPY: Record<
  Variant,
  (name: string, day: number, streak: number) => {
    eyebrow: string;
    headline: string;
    icon: React.ComponentType<{ className?: string }>;
    iconWrap: string;
    iconColor: string;
  }
> = {
  first_day: (name) => ({
    eyebrow:   "The path opens",
    headline:  "Welcome, " + name + ". Your discipline journey begins now.",
    icon:      Sparkles,
    iconWrap:  "bg-[var(--bg-elevated)] border-[var(--border)]",
    iconColor: "text-white"
  }),
  active: (name, day, streak) => ({
    eyebrow:   "Today's mission",
    headline:  streak >= 1
      ? "Welcome back, " + name + ". Day " + day + " · " + streak + "-day fire."
      : "Welcome back, " + name + ". Day " + day + " awaits.",
    icon:      Flame,
    iconWrap:  "bg-[var(--bg-elevated)] border-[var(--border)]",
    iconColor: "text-white"
  }),
  returning: (name, day) => ({
    eyebrow:   "Reset the line",
    headline:  "Welcome back, " + name + ". Day " + day + " — reseal the line.",
    icon:      FlameKindling,
    iconWrap:  "bg-[var(--bg-elevated)] border-[var(--border)]",
    iconColor: "text-white"
  }),
  sealed_today: (name, day) => ({
    eyebrow:   "Sealed today",
    headline:  "Well done, " + name + ". Day " + day + " is in the books.",
    icon:      Sun,
    iconWrap:  "bg-[var(--bg-elevated)] border-[var(--border)]",
    iconColor: "text-white"
  })
};
