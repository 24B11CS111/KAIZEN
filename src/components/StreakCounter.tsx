"use client";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export function StreakCounter({ streak, longest }: { streak: number; longest: number }) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <motion.div
        key={streak}
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 14 }}
        className="relative h-14 w-14 grid place-items-center"
      >
        <div className="absolute inset-0 rounded-full bg-blood-500/15 blur-xl animate-flameRise" />
        <Flame className="h-9 w-9 text-blood-500 drop-shadow-[0_0_12px_rgba(208,0,0,0.7)]" />
      </motion.div>
      <div>
        <div className="label-mono">Streak</div>
        <div className="font-display text-3xl leading-none">
          {streak}
          <span className="text-white/40 text-base ml-1">day{streak === 1 ? "" : "s"}</span>
        </div>
        <div className="text-xs text-white/50 mt-1">Longest · {longest}</div>
      </div>
    </div>
  );
}
