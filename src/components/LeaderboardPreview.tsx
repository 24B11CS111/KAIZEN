"use client";
import { motion } from "framer-motion";
import { Trophy, ChevronUp, ChevronDown, Minus } from "lucide-react";

export interface LbEntry {
  rank: number;
  name: string;
  xp: number;
  delta: 0 | 1 | -1;
  isMe?: boolean;
}

interface Props {
  rows: LbEntry[];
}

export function LeaderboardPreview({ rows }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="card p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-blood-500" />
        <h3 className="text-sm font-semibold">Top warriors</h3>
        <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-white/45">This week</span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.rank}
            className={
              "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors " +
              (r.isMe
                ? "border-blood-500/55 bg-blood-500/10"
                : "border-white/8 bg-white/[0.02]")
            }
          >
            <span className={
              "grid place-items-center h-7 w-7 rounded-md text-[11px] font-semibold tabular-nums " +
              (r.rank === 1
                ? "bg-blood-500/20 border border-blood-500/55 text-white"
                : "bg-white/5 border border-white/10 text-white/75")
            }
              style={r.rank === 1 ? { boxShadow: "0 0 10px rgba(208,0,0,0.45)" } : undefined}
            >
              {r.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className={"text-sm truncate " + (r.isMe ? "font-semibold" : "")}>
                {r.name} {r.isMe && <span className="text-[10px] text-blood-500 font-normal ml-1">(you)</span>}
              </div>
            </div>
            <div className="text-xs tabular-nums text-white/75">{r.xp.toLocaleString()} <span className="text-white/45">XP</span></div>
            <span className="ml-1 text-white/55">
              {r.delta > 0 ? <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />
               : r.delta < 0 ? <ChevronDown className="h-3.5 w-3.5 text-blood-500" />
               : <Minus className="h-3.5 w-3.5" />}
            </span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
