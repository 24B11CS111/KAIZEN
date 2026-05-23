"use client";

/**
 * KAIZEN.SYS — DailyMissionBoard
 *
 * The single canonical view for a day's mission. Six strictly-named
 * categories, each in its own card with an icon and a tight body.
 * Mobile-first, collapsible. Lock state respected.
 *
 * Replaces the prior MissionCard + WorkoutMissionCard pair for
 * unlocked days; for locked days, MissionCard's upgrade overlay is
 * still used in DojoDashboard (no change there).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FlaskConical, Hammer, Dumbbell, Flame, Heart,
  ChevronDown, Clock, Target, Bed, Droplets, Activity as StretchIcon
} from "lucide-react";
import type { DailyMission } from "@/lib/missions";
import { friendlyGoalLabel } from "@/lib/missions";

interface Props {
  mission: DailyMission;
}

type SectionKey = "study" | "practice" | "build" | "workout" | "discipline" | "recovery";

const ICONS: Record<SectionKey, React.ComponentType<{ className?: string }>> = {
  study:      BookOpen,
  practice:   FlaskConical,
  build:      Hammer,
  workout:    Dumbbell,
  discipline: Flame,
  recovery:   Heart
};

const LABELS: Record<SectionKey, string> = {
  study:      "Study",
  practice:   "Practice",
  build:      "Build",
  workout:    "Workout",
  discipline: "Discipline",
  recovery:   "Recovery"
};

export function DailyMissionBoard({ mission }: Props) {
  return (
    <div className="space-y-3 mt-5">
      {/* Header strip — branch + goal + day */}
      <div className="card p-4 sm:p-5 relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(208,0,0,0.10), transparent 60%)"
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
              Day {mission.day} mission
            </div>
            <div className="text-base sm:text-lg font-semibold mt-1 leading-tight truncate">
              {mission.title}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {mission.trackLabel && (
                <span className="inline-flex items-center gap-1 text-blood-500 font-semibold">
                  <Target className="h-3 w-3" /> {mission.trackLabel}
                </span>
              )}
              <span className="text-white/55">
                Goal · <span className="text-white/80">{friendlyGoalLabel(mission.goal)}</span>
              </span>
              {mission.branch && (
                <span className="text-white/55">
                  Branch · <span className="text-white/80">{mission.branch}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6 categorized cards */}
      <Section k="study" defaultOpen>
        <p className="text-[13px] text-white font-semibold leading-tight">
          {mission.study.topic}
        </p>
        <p className="mt-1.5 text-[12.5px] text-white/70 leading-relaxed">
          {mission.study.action}
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-white/45">
          <Clock className="h-3 w-3" />
          ~{mission.study.time_min} min
        </div>
      </Section>

      <Section k="practice">
        <ul className="space-y-1.5">
          {mission.practice.items.map((it, i) => (
            <li
              key={i}
              className="text-[12.5px] text-white/85 leading-snug flex items-start gap-2"
            >
              <span className="text-blood-500 mt-1 shrink-0">▸</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section k="build">
        <p className="text-[12.5px] text-white/85 leading-relaxed">
          {mission.build.task}
        </p>
      </Section>

      <Section k="workout">
        <WorkoutBlock mission={mission} />
      </Section>

      <Section k="discipline">
        <ul className="space-y-2">
          <DiscRow label="Focus"        text={mission.discipline.focus} />
          <DiscRow label="Productivity" text={mission.discipline.productivity} />
        </ul>
      </Section>

      <Section k="recovery">
        <ul className="space-y-2">
          <RecoveryRow icon={Droplets}    text={mission.recovery.hydration} />
          <RecoveryRow icon={Bed}         text={mission.recovery.sleep} />
          <RecoveryRow icon={StretchIcon} text={mission.recovery.stretch} />
        </ul>
      </Section>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Section({
  k, children, defaultOpen
}: {
  k: SectionKey;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const Icon = ICONS[k];
  return (
    <div className="card p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-tap w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 text-left"
      >
        <span
          className={
            "grid place-items-center h-9 w-9 rounded-md shrink-0 border " +
            "bg-blood-500/10 border-blood-500/35 text-blood-500"
          }
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">
            {LABELS[k]}
          </div>
        </div>
        <ChevronDown
          className={
            "h-4 w-4 text-white/45 transition-transform shrink-0 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 sm:px-5 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DiscRow({ label, text }: { label: string; text: string }) {
  return (
    <li className="text-[12.5px] text-white/85 leading-snug">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold mr-2">
        {label}
      </span>
      {text}
    </li>
  );
}

function RecoveryRow({
  icon: Icon, text
}: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[12.5px] text-white/85 leading-snug">
      <Icon className="h-3.5 w-3.5 text-blood-500/85 mt-0.5 shrink-0" />
      <span>{text}</span>
    </li>
  );
}

function WorkoutBlock({ mission }: { mission: DailyMission }) {
  const w = mission.workout.day;
  const isRest = w.kind === "rest" || w.kind === "active_recovery";
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[11px] text-white/55">
          {mission.workout.track_label} · Day {mission.workout.cycle_day}/7
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-white/45">
          <Clock className="h-3 w-3" /> {w.duration_min} min
        </span>
      </div>
      <p className="text-[13px] font-semibold text-white leading-tight">
        {w.title}
      </p>
      <p className="mt-1 text-[12px] text-white/65 leading-snug">{w.strategy}</p>

      {!isRest && w.exercises.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {w.exercises.map((ex, i) => (
            <li key={i} className="text-[11.5px] text-white/80 leading-snug flex items-start gap-2">
              <span className="text-blood-500 mt-0.5 shrink-0 font-semibold">{i + 1}.</span>
              <span>
                <span className="text-white">{ex.name}</span>
                <span className="text-white/50"> — {ex.sets}×{ex.reps}, rest {ex.rest}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 text-[11px] text-white/55 italic">
        “{w.motivation}”
      </div>
    </div>
  );
}
