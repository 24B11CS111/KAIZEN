"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cleanupChannel, createFreshChannel } from "@/lib/realtime";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CreditCard, Dumbbell, Rocket, ShieldCheck, Target, UserPlus, Zap } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export interface SenseiActivityEntry {
  id: string;
  type: string;
  label: string;
  detail: string;
  user_id: string | null;
  created_at: string | null;
}

export function SenseiAdminActivityFeed({ initialFeed = [] }: { initialFeed?: SenseiActivityEntry[] }) {
  const [feed, setFeed] = useState<SenseiActivityEntry[]>(initialFeed);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    let activityChannel: any = null;

    try {
      activityChannel = createFreshChannel(supabase, "admin-activity");

      activityChannel
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload: { new: Record<string, unknown> }) => {
          if (cancelled) return;
          const row = payload.new as Record<string, unknown>;
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
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "payment_submissions" }, (payload: { new: Record<string, unknown> }) => {
          if (cancelled) return;
          const row = payload.new as Record<string, unknown>;
          const entry: SenseiActivityEntry = {
            id: `pay-${row.id}`,
            type: "payment",
            label: "New Payment Submitted",
            detail: `${row.plan} / ₹${row.amount}`,
            user_id: String(row.user_id),
            created_at: String(row.created_at)
          };
          setFeed(prev => [entry, ...prev].slice(0, 50));
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payment_submissions" }, (payload: { new: Record<string, unknown>, old: Record<string, unknown> }) => {
          if (cancelled) return;
          const row = payload.new as Record<string, unknown>;
          if (row.status === "approved" && payload.old.status === "pending") {
             const entry: SenseiActivityEntry = {
              id: `appr-${row.id}`,
              type: "premium_activation",
              label: "Payment Approved",
              detail: `User upgraded to ${row.plan}`,
              user_id: String(row.user_id),
              created_at: String(row.updated_at || new Date().toISOString())
            };
            setFeed(prev => [entry, ...prev].slice(0, 50));
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "daily_reports" }, (payload: { new: Record<string, unknown> }) => {
          if (cancelled) return;
          const row = payload.new as Record<string, unknown>;
          const entry: SenseiActivityEntry = {
            id: `dr-${row.id}`,
            type: "roadmap_progress",
            label: "Daily Report Submitted",
            detail: `Completion: ${row.completion_percentage}%`,
            user_id: String(row.user_id),
            created_at: String(row.created_at)
          };
          setFeed(prev => [entry, ...prev].slice(0, 50));
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload: { new: Record<string, unknown> }) => {
          if (cancelled) return;
          const row = payload.new as Record<string, unknown>;
          const entry: SenseiActivityEntry = {
            id: `profile-${row.id}`,
            type: "signup",
            label: "New User Signup",
            detail: String(row.full_name || row.email || "Unknown"),
            user_id: String(row.id),
            created_at: String(row.created_at)
          };
          setFeed(prev => [entry, ...prev].slice(0, 50));
        })
        .subscribe((status: string) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") setRealtimeError(null);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeError("Live activity is temporarily unavailable.");
          console.warn("[sensei-activity-feed] channel status:", status);
        }
      });
    } catch (error) {
      console.warn("[sensei-activity-feed] realtime setup failed:", error);
      setRealtimeError("Live activity is temporarily unavailable.");
    }

    return () => {
      cancelled = true;
      cleanupChannel(supabase, activityChannel);
      activityChannel = null;
    };
  }, []);

  if (!mounted) {
    return (
      <div className="sensei-panel p-5 lg:p-6 h-full min-h-[480px] lg:min-h-0 lg:h-full flex items-center justify-center text-white/40 border-dashed border border-white/10">
        Loading activity...
      </div>
    );
  }

  return (
    <div className="sensei-panel p-5 lg:p-6 h-full min-h-[480px] lg:min-h-0 lg:h-full flex flex-col">
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
        {realtimeError && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-3 text-xs text-amber-200/80">
            {realtimeError}
          </div>
        )}
        {feed.length === 0 && !realtimeError ? (
          <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
            No recent activity recorded.
          </div>
        ) : (
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
                    {mounted ? formatRelativeTime(entry.created_at) : "-"}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
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

function formatMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "Platform event";
  const m = metadata as Record<string, unknown>;
  if (m.day) return `Day ${m.day}`;
  if (m.pathname) return String(m.pathname);
  return "System recorded event";
}

function formatRelativeTime(value: string | null) {
  if (!value) return "Just now";
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return "Just now";
  }
}
