"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition } from "react";
import { X, ShieldAlert, BadgeCheck, Clock, Check, TrendingUp, Calendar, AlertTriangle, ShieldBan, Smartphone, Briefcase, Dumbbell, Target } from "lucide-react";
import { type SenseiUserRecord } from "../SenseiVerificationDashboard";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  user: SenseiUserRecord | null;
  onClose: () => void;
  onUpdate: () => void; // Trigger refresh
}

export function SenseiProfileModal({ user, onClose, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const adminAction = async (action: string, payload: any = {}) => {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const res = await fetch("/api/admin/user-control", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action, user_id: user.user_id, ...payload })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Action failed");
        
        onUpdate();
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      }
    });
  };

  const statusColor = 
    user.subscription_status === "active" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
    user.subscription_status === "banned" ? "text-red-400 bg-red-400/10 border-red-400/20" :
    "text-amber-400 bg-amber-400/10 border-amber-400/20";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative flex h-full max-h-[900px] w-full max-w-[1200px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-obsidian shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl font-bold text-white border border-white/10">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || "?"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {user.full_name || "Unknown Warrior"}
                  {user.is_suspended && <ShieldBan className="h-4 w-4 text-red-500" />}
                </h2>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
                    {user.subscription_status || "pending"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                
                {/* Identity & Onboarding */}
                <section className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Identity & Goals
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DataField label="Branch" value={user.branch} />
                    <DataField label="Path" value={user.path_type} />
                    <DataField label="Occupation" value={user.occupation} />
                    <DataField label="Field of Study" value={user.field_of_study} />
                    <DataField label="WhatsApp" value={user.whatsapp} />
                    <DataField label="Age / Gender" value={`${user.age || '?'} / ${user.gender || '?'}`} />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <DataField label="Main Goal" value={user.main_goal === "other" ? user.main_goal_other : user.main_goal} block />
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <DataField label="Skill Level" value={user.skill_level} />
                      <DataField label="Daily Time" value={user.daily_time_min ? `${user.daily_time_min} mins` : null} />
                    </div>
                  </div>
                </section>

                {/* Discipline Profile */}
                <section className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Discipline Profile
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard label="Current Streak" value={user.current_streak} suffix="days" />
                    <MetricCard label="Longest Streak" value={user.longest_streak} suffix="days" />
                    <MetricCard label="Completed" value={user.completed_days} suffix="workouts" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/50">Roadmap Progress</span>
                      <span className="text-emerald-400">{Math.round(user.progress_percent || 0)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, user.progress_percent || 0))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/40 text-right">Day {user.current_roadmap_day} of 30</p>
                  </div>
                </section>

              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                {/* Admin Quick Actions */}
                <section className="rounded-2xl border border-blood-500/20 bg-blood-500/5 p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-blood-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Admin Quick Actions
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {user.subscription_status !== "active" ? (
                      <AdminButton 
                        onClick={() => adminAction("grant_premium", { days: 30, plan_amount: 99 })}
                        loading={isPending}
                        variant="primary"
                      >
                        Activate Premium (30d)
                      </AdminButton>
                    ) : (
                      <AdminButton 
                        onClick={() => adminAction("extend_subscription", { days: 30 })}
                        loading={isPending}
                        variant="outline"
                      >
                        Extend +30 Days
                      </AdminButton>
                    )}
                    
                    {user.is_suspended ? (
                      <AdminButton 
                        onClick={() => adminAction("unsuspend")}
                        loading={isPending}
                        variant="success"
                      >
                        Unsuspend User
                      </AdminButton>
                    ) : (
                      <AdminButton 
                        onClick={() => adminAction("suspend", { reason: "Manual Admin Suspension" })}
                        loading={isPending}
                        variant="danger"
                      >
                        Suspend User
                      </AdminButton>
                    )}
                    
                    <AdminButton 
                      onClick={() => adminAction("reset_progress")}
                      loading={isPending}
                      variant="outline"
                    >
                      Reset Streak/Progress
                    </AdminButton>
                    
                    {user.subscription_status === "active" && (
                      <AdminButton 
                        onClick={() => adminAction("revoke_premium")}
                        loading={isPending}
                        variant="danger"
                      >
                        Revoke Premium
                      </AdminButton>
                    )}
                  </div>
                </section>

                {/* Subscription & History */}
                <section className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Subscription Timeline
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center rounded-xl bg-white/5 p-3">
                      <span className="text-sm text-white/60">Joined Platform</span>
                      <span className="text-sm font-medium text-white">
                        {user.joined_at ? format(parseISO(user.joined_at), "MMM d, yyyy") : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center rounded-xl bg-white/5 p-3">
                      <span className="text-sm text-white/60">Subscription Expiry</span>
                      <span className={`text-sm font-medium ${user.expiry_date && parseISO(user.expiry_date) > new Date() ? "text-emerald-400" : "text-red-400"}`}>
                        {user.expiry_date ? format(parseISO(user.expiry_date), "MMM d, yyyy") : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center rounded-xl bg-white/5 p-3">
                      <span className="text-sm text-white/60">Last Active</span>
                      <span className="text-sm font-medium text-white">
                        {user.latest_activity_at ? formatDistanceToNow(parseISO(user.latest_activity_at), { addSuffix: true }) : "Never"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Payment History */}
                <section className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Payment History
                  </h3>
                  
                  <div className="space-y-3">
                    {user.payment_history?.length > 0 ? (
                      user.payment_history.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center border-l-2 border-white/20 pl-3">
                          <div>
                            <p className="text-sm font-medium text-white">₹{payment.plan_amount}</p>
                            <p className="text-xs text-white/40">{payment.utr_number}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-semibold uppercase ${payment.status === 'approved' ? 'text-emerald-400' : payment.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                              {payment.status}
                            </span>
                            <p className="text-xs text-white/40">
                              {payment.created_at ? format(parseISO(payment.created_at), "MMM d") : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/40">No payment history found.</p>
                    )}
                  </div>
                </section>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DataField({ label, value, block = false }: { label: string, value: any, block?: boolean }) {
  return (
    <div className={`${block ? 'col-span-full' : ''}`}>
      <p className="text-xs font-medium uppercase text-white/40">{label}</p>
      <p className="mt-1 text-sm font-medium text-white truncate">{value || <span className="text-white/20">Not provided</span>}</p>
    </div>
  );
}

function MetricCard({ label, value, suffix }: { label: string, value: number, suffix: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/50">{suffix}</p>
    </div>
  );
}

function AdminButton({ children, onClick, loading, variant }: { children: React.ReactNode, onClick: () => void, loading: boolean, variant: "primary" | "danger" | "outline" | "success" }) {
  const baseClass = "flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    success: "bg-emerald-500 text-black hover:bg-emerald-400",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/5"
  };
  
  return (
    <button onClick={onClick} disabled={loading} className={`${baseClass} ${variants[variant]}`}>
      {loading ? "Processing..." : children}
    </button>
  );
}
