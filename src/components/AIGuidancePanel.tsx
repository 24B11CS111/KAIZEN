"use client";
import { motion } from "framer-motion";
import { Brain, Target, Clock } from "lucide-react";

interface Props {
  recommendation: string;
  focusArea: string;
  estimatedMinutes: number;
}

export function AIGuidancePanel({ recommendation, focusArea, estimatedMinutes }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="card p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] shrink-0">
          <Brain className="h-4 w-4 text-[var(--text-muted)]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Today\'s focus</h3>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">AI</span>
          </div>
          <p className="text-xs sm:text-sm text-white/75 mt-1.5 leading-relaxed">
            {recommendation}
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/75">
              <Target className="h-3 w-3 text-[var(--text-muted)]" /> {focusArea}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/75">
              <Clock className="h-3 w-3 text-[var(--text-muted)]" /> ~{estimatedMinutes} min
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
