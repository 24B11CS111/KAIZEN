"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface YouVsYouStats {
  thisWeekDays: number;
  lastWeekDays: number;
  thisWeekXp: number;
  lastWeekXp: number;
  currentStreak: number;
  longestStreak: number;
  consistencyPct: number;
  improvementPct: number;
}

interface Props {
  /** Re-fetch trigger (bump on realtime change). */
  refreshKey?: number;
}

export function YouVsYou({ refreshKey = 0 }: Props) {
  const [stats, setStats] = useState<YouVsYouStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.rpc("get_you_vs_you").single();
        if (cancelled) return;
        if (error) throw error;
        const r: any = data;
        if (!r) { setStats(null); setLoading(false); return; }
        setStats({
          thisWeekDays:    r.this_week_days ?? 0,
          lastWeekDays:    r.last_week_days ?? 0,
          thisWeekXp:      r.this_week_xp ?? 0,
          lastWeekXp:      r.last_week_xp ?? 0,
          currentStreak:   r.current_streak ?? 0,
          longestStreak:   r.longest_streak ?? 0,
          consistencyPct:  r.consistency_pct ?? 0,
          improvementPct:  r.improvement_pct ?? 0
        });
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Could not load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-blood-500" />
        <h3 className="text-sm font-semibold">You vs You</h3>
        <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-white/45">This week vs last</span>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      )}

      {err && <div className="text-xs text-blood-500">{err}</div>}

      {!loading && !err && stats && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Metric
              label="Days sealed"
              now={stats.thisWeekDays}
              prev={stats.lastWeekDays}
              suffix={stats.thisWeekDays === 1 ? "day" : "days"}
            />
            <Metric
              label="XP earned"
              now={stats.thisWeekXp}
              prev={stats.lastWeekXp}
              suffix="XP"
            />
          </div>
          <div className="mt-3 text-[11px] text-white/55 leading-relaxed">
            {stats.lastWeekDays === 0 && stats.thisWeekDays === 0
              ? "Begin your first week. The compound starts now."
              : stats.improvementPct > 0
              ? "You are " + stats.improvementPct + "% ahead of last week. Keep pulling."
              : stats.improvementPct < 0
              ? "You are " + Math.abs(stats.improvementPct) + "% behind last week. Reset and show up."
              : "Even with last week. Hold the line, then push past."}
          </div>
        </>
      )}
    </motion.section>
  );
}

function Metric({ label, now, prev, suffix }: { label: string; now: number; prev: number; suffix?: string }) {
  const delta = now - prev;
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : (now > 0 ? 100 : 0);
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-blood-500" : "text-white/45";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tabular-nums leading-none">{now.toLocaleString()}</span>
        {suffix && <span className="text-[10px] text-white/45">{suffix}</span>}
      </div>
      <div className={"mt-1 inline-flex items-center gap-1 text-[11px] " + tone}>
        <Icon className="h-3 w-3" />
        <span className="tabular-nums">{delta >= 0 ? "+" : ""}{delta}</span>
        <span className="text-white/40">vs last week ({prev.toLocaleString()}{suffix ? " " + suffix : ""})</span>
      </div>
      {prev > 0 && delta !== 0 && (
        <div className={"mt-0.5 text-[10px] " + tone}>
          {pct >= 0 ? "+" : ""}{pct}%
        </div>
      )}
    </div>
  );
}
