"use client";

/**
 * KAIZEN.SYS — WorkoutMissionCard
 *
 * Drops in below the existing MissionCard on the dashboard. Shows
 * today's workout (track + cycle position + exercises). Collapsed by
 * default so it doesn't dominate the scroll; tap to expand.
 *
 * Premium mobile-first UI — no redesign of existing components.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, ChevronDown, Clock, Flame, Target, Sparkles,
  CheckCircle2, Bed
} from "lucide-react";
import type { WorkoutMission } from "@/lib/workout";

interface Props {
  mission: WorkoutMission;
}

export function WorkoutMissionCard({ mission }: Props) {
  const [open, setOpen] = useState(false);
  const d = mission.day;
  const isRest = d.kind === "rest" || d.kind === "active_recovery";

  return (
    <div
      className={
        "card p-4 sm:p-5 mt-4 relative overflow-hidden " +
        (isRest ? "border-white/12" : "")
      }
      style={{ boxShadow: "0 0 24px -12px rgba(208,0,0,0.32)" }}
    >
      {/* Header — tap to expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-tap w-full text-left flex items-start gap-3"
      >
        <span
          className={
            "grid place-items-center h-10 w-10 rounded-md shrink-0 border " +
            (isRest
              ? "bg-white/[0.04] border-white/15 text-white/70"
              : "bg-blood-500/10 border-blood-500/35 text-blood-500")
          }
        >
          {isRest ? <Bed className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">
              Workout · Day {mission.cycle_day} / 7
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-blood-500/85 font-semibold">
              {mission.track_label}
            </span>
          </div>
          <div className="mt-0.5 text-[15px] sm:text-[16px] font-semibold truncate">
            {d.title}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/55">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {d.duration_min} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> {d.target.slice(0, 2).join(" · ")}
            </span>
          </div>
        </div>

        <ChevronDown
          className={
            "h-4 w-4 text-white/45 transition-transform mt-1 shrink-0 " +
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
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Strategy */}
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold mb-1.5">
                Focus
              </div>
              <p className="text-[12.5px] text-white/85 leading-relaxed">
                {d.strategy}
              </p>
            </div>

            {/* Exercises list */}
            {d.exercises.length > 0 && (
              <ul className="mt-3 space-y-2">
                {d.exercises.map((ex, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid place-items-center h-6 w-6 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-semibold text-white/65 shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white leading-tight">
                          {ex.name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/60">
                          <span><span className="text-white/40">Sets</span> · {ex.sets}</span>
                          <span><span className="text-white/40">Reps</span> · {ex.reps}</span>
                          <span><span className="text-white/40">Rest</span> · {ex.rest}</span>
                        </div>
                        {ex.notes && (
                          <p className="mt-1.5 text-[11px] text-white/45 italic leading-snug">
                            {ex.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Recovery + Motivation */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Recovery
                </div>
                <p className="text-[12px] text-white/75 leading-snug">{d.recovery}</p>
              </div>
              <div className="rounded-lg border border-blood-500/25 bg-blood-500/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold mb-1 inline-flex items-center gap-1.5">
                  <Flame className="h-3 w-3" /> Cue
                </div>
                <p className="text-[12px] text-white/85 leading-snug italic">
                  &ldquo;{d.motivation}&rdquo;
                </p>
              </div>
            </div>

            {/* Target tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.target.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/10 bg-white/[0.03] text-white/65"
                >
                  <Sparkles className="h-2.5 w-2.5 text-blood-500/85" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
