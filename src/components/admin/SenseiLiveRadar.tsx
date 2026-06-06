"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Globe, MapPin, Monitor, Smartphone, Users } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { StaggerGroup, StaggerItem } from "@/components/PageTransition";

interface OnlineUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  pathname: string;
  online_at: string;
  last_seen_at: string;
}

export function SenseiLiveRadar() {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});
  const [loading, setLoading] = useState(true);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    
    // First fetch historical active sessions or just rely on real-time presence sync
    // For MVP, we just connect to presence and wait for sync
    const channel = (supabase as any).channel("kaizen-presence");

    try {
      channel.on("presence", { event: "sync" }, () => {
        if (cancelled) return;
        try {
          const state = channel.presenceState();
          const users: Record<string, OnlineUser> = {};

          for (const [key, p] of Object.entries(state)) {
            const presences = p as any[];
            if (presences && presences.length > 0) {
              users[key] = normalizePresence(key, presences[presences.length - 1]);
            }
          }
          setOnlineUsers(users);
          setRealtimeError(null);
        } catch (error) {
          console.warn("[sensei-live-radar] presence sync failed:", error);
          setRealtimeError("Realtime presence is temporarily unavailable.");
        }
        setLoading(false);
      });

      channel.on("presence", { event: "join" }, ({ key, newPresences }: any) => {
        if (cancelled) return;
        const presence = Array.isArray(newPresences) ? newPresences[0] : null;
        if (!presence) return;
        setOnlineUsers(prev => ({
          ...prev,
          [key]: normalizePresence(key, presence)
        }));
      });

      channel.on("presence", { event: "leave" }, ({ key }: any) => {
        if (cancelled) return;
        setOnlineUsers(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      });

      channel.subscribe((status: string) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setLoading(false);
          setRealtimeError(null);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setLoading(false);
          setRealtimeError("Realtime presence is temporarily unavailable.");
        }
      });
    } catch (error) {
      console.warn("[sensei-live-radar] realtime setup failed:", error);
      setLoading(false);
      setRealtimeError("Realtime presence is temporarily unavailable.");
    }

    return () => {
      cancelled = true;
      try { channel.unsubscribe(); } catch {}
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  const usersList = Object.values(onlineUsers);
  
  // Aggregate stats
  const activePaths = usersList.reduce((acc, user) => {
    acc[user.pathname] = (acc[user.pathname] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <StaggerGroup delayBetween={0.06} className="space-y-6">
      {/* Top Stats */}
      <StaggerItem>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5 text-emerald-400" />} label="Live Users" value={usersList.length} />
          <StatCard icon={<Activity className="h-5 w-5 text-blood-400" />} label="Active Sessions" value={usersList.length} />
          <StatCard icon={<Globe className="h-5 w-5 text-blue-400" />} label="Top Active Path" value={Object.keys(activePaths).sort((a,b) => activePaths[b] - activePaths[a])[0] || "/"} />
          <StatCard icon={<Monitor className="h-5 w-5 text-purple-400" />} label="Realtime Latency" value="~15ms" />
        </div>
      </StaggerItem>

      {/* Main Radar Feed */}
      <StaggerItem>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Active Connections
            </h2>
            <span className="text-sm font-medium text-white/50">{usersList.length} global</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-white/40">Syncing radar...</div>
            ) : realtimeError ? (
              <div className="py-12 text-center text-white/40 border border-dashed border-amber-300/20 bg-amber-300/[0.04] rounded-2xl">
                {realtimeError}
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                No users currently online.
              </div>
            ) : (
              <AnimatePresence>
                {usersList.map((user) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 transition-colors hover:bg-black/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold border border-white/5">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.full_name || "Unknown Warrior"}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">Current Page</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                          <MapPin className="h-3 w-3" />
                          {user.pathname}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">Duration</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                          <Clock className="h-3 w-3" />
                          {mounted ? formatRelativeTime(user.online_at) : "-"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </StaggerItem>
    </StaggerGroup>
  );
}

function normalizePresence(key: string, presence: any): OnlineUser {
  const now = new Date().toISOString();
  return {
    user_id: String(presence?.user_id ?? key),
    email: presence?.email ?? null,
    full_name: presence?.full_name ?? null,
    pathname: String(presence?.pathname ?? "/"),
    online_at: String(presence?.online_at ?? now),
    last_seen_at: String(presence?.last_seen_at ?? presence?.online_at ?? now)
  };
}

function formatRelativeTime(value: string | null) {
  if (!value) return "Just now";
  try {
    return formatDistanceToNow(parseISO(value));
  } catch {
    return "Just now";
  }
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-white/50">{label}</h3>
      </div>
      <p className="text-2xl font-bold text-white truncate">{value}</p>
    </div>
  );
}
