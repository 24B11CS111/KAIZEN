"use client";
import { motion } from "framer-motion";
import { Sparkles, Flame, ArrowUpRight } from "lucide-react";
import type { XpState } from "@/lib/ranking";

interface Props {
  firstName: string;
  xp: XpState;
  currentStreak: number;
  todayProgressPct: number;
  aiMessage: string;
}

export function HeroStatusPanel({ firstName, xp, currentStreak, todayProgressPct, aiMessage }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden card p-5 sm:p-6"
      style={{
        background:
          "radial-gradient(800px 220px at 0% 0%, rgba(255,255,255,0.03), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.0))"
      }}
    >
      {/* Ambient pulse behind */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top row: rank + level + greeting */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            Welcome back
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold mt-0.5 truncate">
            {firstName}
          </h1>
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-semibold tracking-wide">
              <Sparkles className="h-3 w-3 text-blood-500" />
              {xp.rank.name}
            </span>
            <span className="text-[11px] text-white/55">
              Level {xp.level}
            </span>
          </div>
        </div>

        {/* Streak crest */}
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <Flame className="h-3.5 w-3.5 text-blood-500" />
            <span className="text-sm font-semibold tabular-nums">{currentStreak}</span>
            <span className="text-[10px] text-white/55">{currentStreak === 1 ? "day" : "days"}</span>
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-white/45">
            Streak
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="relative mt-5">
        <div className="flex items-baseline justify-between">
          <div className="inline-flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums leading-none">
              {xp.totalXp.toLocaleString()}
            </span>
            <span className="text-[11px] text-white/55">XP</span>
          </div>
          {xp.nextRank ? (
            <span className="text-[11px] text-white/55">
              {xp.xpToNextRank} to <span className="text-blood-500 font-semibold">{xp.nextRank.name}</span>
            </span>
          ) : (
            <span className="text-[11px] text-blood-500 font-semibold inline-flex items-center gap-1">
              Max rank <ArrowUpRight className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xp.rankProgress * 100}%` }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-white"
            style={{ boxShadow: "0 0 14px rgba(255,255,255,0.55)" }}
          />
        </div>
      </div>

      {/* Today progress + AI message */}
      <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-3 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Today</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tabular-nums leading-none">
              {todayProgressPct}%
            </span>
            <span className="text-[10px] text-white/45">complete</span>
          </div>
          <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: todayProgressPct + "%", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }}
            />
          </div>
        </div>
        <div className="card p-3 sm:col-span-2 flex items-start gap-2.5">
          <span className="grid place-items-center h-7 w-7 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
              Sensei
            </div>
            <p className="text-xs sm:text-sm text-white/85 mt-0.5 leading-relaxed">
              {aiMessage}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
