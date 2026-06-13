"use client";
import { motion } from "framer-motion";
import { Lock, Award, Flame, Target, Trophy, Sparkles, Calendar } from "lucide-react";
import type { ComponentType } from "react";

export interface Achievement {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  unlocked: boolean;
  hint?: string;
}

export function buildAchievements(args: {
  completed: number;
  longestStreak: number;
  currentStreak: number;
}): Achievement[] {
  const { completed, longestStreak, currentStreak } = args;
  return [
    { id: "first-day",   name: "First Step",       icon: Sparkles, unlocked: completed >= 1,   hint: "Day 1 sealed" },
    { id: "streak-3",    name: "Pattern",          icon: Flame,    unlocked: longestStreak >= 3, hint: "3-day streak" },
    { id: "streak-7",    name: "Warrior Rising",   icon: Award,    unlocked: longestStreak >= 7, hint: "7-day streak" },
    { id: "halfway",     name: "Half Path",        icon: Target,   unlocked: completed >= 15,   hint: "15 days" },
    { id: "streak-14",   name: "Iron Will",        icon: Calendar, unlocked: longestStreak >= 14, hint: "14-day streak" },
    { id: "ascended",    name: "Ascended",         icon: Trophy,   unlocked: completed >= 30,   hint: "30 days complete" }
  ];
}

interface Props {
  items: Achievement[];
}

export function AchievementGrid({ items }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Achievements</h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          {items.filter(i => i.unlocked).length} / {items.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {items.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
              className={
                "rounded-lg border p-2.5 text-center transition-all " +
                (a.unlocked
                  ? "border-[var(--border-light)] bg-white/5"
                  : "border-[var(--border)] bg-transparent opacity-60")
              }
              style={a.unlocked ? { boxShadow: "0 0 12px -4px rgba(255,255,255,0.1)" } : undefined}
              title={a.hint}
            >
              <span className={
                "mx-auto grid place-items-center h-9 w-9 rounded-md " +
                (a.unlocked ? "bg-[var(--bg-elevated)] border border-[var(--border)]" : "bg-white/5 border border-white/8")
              }>
                {a.unlocked
                  ? <Icon className="h-4 w-4 text-[var(--text)]" />
                  : <Lock className="h-4 w-4 text-white/40" />}
              </span>
              <div className={"mt-1.5 text-[10px] truncate " + (a.unlocked ? "text-white/85" : "text-white/45")}>
                {a.name}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
