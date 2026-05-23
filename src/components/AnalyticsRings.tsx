"use client";
import { motion } from "framer-motion";

interface RingProps {
  label: string;
  value: number;
  max: number;
  display?: string;
  hint?: string;
}

function Ring({ label, value, max, display, hint }: RingProps) {
  const pct = Math.min(1, Math.max(0, value / Math.max(1, max)));
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <div className="card p-3 sm:p-4 text-center">
      <div className="relative mx-auto h-[88px] w-[88px]">
        <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
          <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="40" cy="40" r={r}
            stroke="#d00000" strokeWidth="6" fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 0 6px rgba(208,0,0,0.55))" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-base font-semibold leading-none">
            {display ?? `${Math.round(pct * 100)}%`}
          </div>
        </div>
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</div>
      {hint && <div className="text-[10px] text-white/40 mt-0.5">{hint}</div>}
    </div>
  );
}

interface Props {
  completedDays: number;
  totalDays: number;
  cycleDay: number;
  longestStreak: number;
  studyHoursEstimate: number;
}

export function AnalyticsRings({ completedDays, totalDays, cycleDay, longestStreak, studyHoursEstimate }: Props) {
  const consistency = cycleDay > 0 ? completedDays / cycleDay : 0;
  return (
    <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
      <Ring
        label="30-day"
        value={completedDays}
        max={totalDays}
        display={`${completedDays}/${totalDays}`}
      />
      <Ring
        label="Consistency"
        value={consistency}
        max={1}
        display={`${Math.round(consistency * 100)}%`}
        hint={completedDays + "/" + Math.max(1, cycleDay) + " days"}
      />
      <Ring
        label="Best streak"
        value={longestStreak}
        max={Math.max(7, longestStreak)}
        display={String(longestStreak)}
        hint={longestStreak === 1 ? "day" : "days"}
      />
    </section>
  );
}
