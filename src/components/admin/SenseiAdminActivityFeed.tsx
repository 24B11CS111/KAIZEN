"use client";

import { useEffect, useState } from "react";
import { type SenseiActivityEntry } from "@/components/SenseiVerificationDashboard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CreditCard, Dumbbell, Rocket, ShieldCheck, Target, UserPlus, Zap } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export function SenseiAdminActivityFeed({ initialFeed = [] }: { initialFeed?: SenseiActivityEntry[] }) {
  const [feed, setFeed] = useState<SenseiActivityEntry[]>(initialFeed);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    // Listen to activity_log inserts
    const activityChannel = supabase.channel("admin-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
        if (cancelled) return;
        const row = payload.new;
        const entry: SenseiActivityEntry = {
          id: String(row.id),
          type: String(row.type),
          label: formatActivityType(String(row.type)),
          detail: formatMetadata(row.metadata),
          user_id: String(row.user_id),
          created_at: String(row.created_at)
        };
        setFeed(prev => [entry, ...prev].slice(0, 50));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "utr_logs" }, (payload) => {
        if (cancelled) return;
        const row = payload.new;
        const entry: SenseiActivityEntry = {
          id: `utr-${row.id}`,
          type: "payment",
          label: "New Payment Submitted",
          detail: `UTR ${row.utr_number} / ₹${row.plan_amount}`,
          user_id: String(row.user_id),
          created_at: String(row.created_at)
        };
        setFeed(prev => [entry, ...prev].slice(0, 50));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        if (cancelled) return;
        const row = payload.new;
        const entry: SenseiActivityEntry = {
          id: `profile-${row.id}`,
          type: "signup",
          label: "New User Signup",
          detail: row.full_name || row.email || "Unknown",
          user_id: String(row.id),
          created_at: String(row.created_at)
        };
        setFeed(prev => [entry, ...prev].slice(0, 50));
      });

    activityChannel.subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(activityChannel);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 lg:p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-blood-500" />
          Live Platform Activity
        </h2>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blood-500"></span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {feed.map((entry) => {
            const icon = getIconForType(entry.type);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="flex items-start gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 transition-colors hover:bg-black/40"
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 ${icon.bg}`}>
                  {icon.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{entry.label}</p>
                  <p className="text-xs text-white/50 truncate mt-0.5">{entry.detail}</p>
                </div>
                <span className="text-[10px] uppercase font-bold text-white/30 whitespace-nowrap">
                  {entry.created_at ? formatDistanceToNow(parseISO(entry.created_at), { addSuffix: true }) : "Just now"}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getIconForType(type: string) {
  if (type.includes("payment")) return { icon: <CreditCard className="h-4 w-4 text-emerald-400" />, bg: "bg-emerald-500/10" };
  if (type.includes("workout")) return { icon: <Dumbbell className="h-4 w-4 text-purple-400" />, bg: "bg-purple-500/10" };
  if (type.includes("signup")) return { icon: <UserPlus className="h-4 w-4 text-blue-400" />, bg: "bg-blue-500/10" };
  if (type.includes("roadmap")) return { icon: <Target className="h-4 w-4 text-blood-400" />, bg: "bg-blood-500/10" };
  return { icon: <Activity className="h-4 w-4 text-white/60" />, bg: "bg-white/5" };
}

function formatActivityType(type: string) {
  if (type === "workout_completed") return "Workout Completed";
  if (type === "roadmap_progress") return "Roadmap Milestone";
  if (type === "premium_activation") return "Premium Activation";
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatMetadata(metadata: any) {
  if (!metadata) return "Platform event";
  if (metadata.day) return `Day ${metadata.day}`;
  if (metadata.pathname) return String(metadata.pathname);
  return "System recorded event";
}
