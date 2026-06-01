"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  GraduationCap,
  IndianRupee,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X
} from "lucide-react";

export interface SenseiPaymentHistoryEntry {
  id: string;
  utr_number: string;
  plan_amount: number;
  status: string;
  created_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export interface SenseiUserRecord {
  user_id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  joined_at: string | null;
  path_type: string | null;
  branch: string | null;
  occupation: string | null;
  field_of_study: string | null;
  daily_time_min: number | null;
  skill_level: string | null;
  main_goal: string | null;
  main_goal_other: string | null;
  workout_location: string | null;
  fitness_level: string | null;
  age: number | null;
  gender: string | null;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  completed_days: number;
  current_roadmap_day: number;
  progress_percent: number;
  latest_activity_at: string | null;
  subscription_status: string | null;
  expiry_date: string | null;
  plan_amount: number | null;
  latest_payment_status: string | null;
  latest_utr_id: string | null;
  latest_utr_number: string | null;
  latest_payment_created_at: string | null;
  latest_rejection_reason: string | null;
  payment_history: SenseiPaymentHistoryEntry[];
  ai_track_label: string | null;
  ai_track_id: string | null;
  onboarding_raw: unknown;
  reviewable: boolean;
}

export interface SenseiDashboardStats {
  pendingApprovals: number;
  activeSubscribers: number;
  totalRevenue: number;
  expiringSoon: number;
  totalUsers: number;
  monthlyGrowth: number;
  consistencyRate: number;
}

export interface SenseiChartPoint {
  label: string;
  value: number;
}

export interface SenseiDashboardAnalytics {
  usersGrowth: SenseiChartPoint[];
  monthlyRevenue: SenseiChartPoint[];
  dailyActiveUsers: SenseiChartPoint[];
  branchDistribution: SenseiChartPoint[];
  planDistribution: SenseiChartPoint[];
  conversionRate: number;
  retentionRate: number;
  workoutCompletionRate: number;
}

interface Props {
  pendingUsers: SenseiUserRecord[];
  directoryUsers: SenseiUserRecord[];
  stats: SenseiDashboardStats;
  analytics: SenseiDashboardAnalytics;
}

type PlanFilter = "all" | "free" | "49" | "99";
type StatusFilter = "all" | "pending" | "active" | "expired" | "rejected";
type SortMode = "newest" | "oldest" | "streak" | "progress";

function formatPlan(amount: number | null) {
  if (amount === 49) return "Intermediate · Rs 49";
  if (amount === 99) return "B.Tech · Rs 99";
  return "Free";
}

function formatCompactINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(amount);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function toLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function goalLabel(mainGoal: string | null, other: string | null) {
  if (!mainGoal) return "—";
  if (mainGoal === "other") return other?.trim() || "Other";
  return toLabel(mainGoal);
}

function avatarText(name: string | null, email: string | null) {
  const source = (name?.trim() || email?.trim() || "KA").split(/\s+/).filter(Boolean);
  const initials = source.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "KA";
}

function toneForStatus(status: string | null | undefined) {
  switch (status) {
    case "approved":
    case "active":
      return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
    case "rejected":
      return "border-blood-500/25 bg-blood-500/[0.08] text-blood-400";
    case "expired":
      return "border-amber-300/20 bg-amber-300/[0.06] text-amber-300";
    default:
      return "border-white/[0.10] bg-white/[0.03] text-white/65";
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function SenseiVerificationDashboard({
  pendingUsers,
  directoryUsers,
  stats,
  analytics
}: Props) {
  const [pendingRows, setPendingRows] = useState(pendingUsers);
  const [directoryRows, setDirectoryRows] = useState(directoryUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selectedUser, setSelectedUser] = useState<SenseiUserRecord | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [pendingTransition, startTransition] = useTransition();

  const branchOptions = useMemo(() => {
    return Array.from(new Set(directoryRows.map((row) => row.branch).filter(Boolean) as string[])).sort();
  }, [directoryRows]);

  const filteredDirectory = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = [...directoryRows].filter((row) => {
      const matchesSearch =
        needle.length === 0 ||
        [
          row.full_name,
          row.email,
          row.whatsapp,
          row.latest_utr_number,
          row.branch,
          row.ai_track_label
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));

      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "free" ? !row.plan_amount : String(row.plan_amount ?? 0) === planFilter);
      const matchesStatus = statusFilter === "all" || (row.subscription_status ?? "pending") === statusFilter;
      const matchesBranch = branchFilter === "all" || (row.branch ?? "") === branchFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesBranch;
    });

    rows.sort((a, b) => {
      if (sortMode === "streak") return b.current_streak - a.current_streak;
      if (sortMode === "progress") return b.progress_percent - a.progress_percent;

      const left = new Date(a.joined_at ?? 0).getTime();
      const right = new Date(b.joined_at ?? 0).getTime();
      return sortMode === "oldest" ? left - right : right - left;
    });

    return rows;
  }, [branchFilter, directoryRows, planFilter, search, sortMode, statusFilter]);

  const filteredPending = useMemo(() => {
    const pendingIds = new Set(pendingRows.map((row) => row.user_id));
    return filteredDirectory.filter((row) => pendingIds.has(row.user_id) && row.reviewable);
  }, [filteredDirectory, pendingRows]);

  const actOnUser = (row: SenseiUserRecord, kind: "approve" | "reject") => {
    const utrId = row.latest_utr_id;
    if (!utrId) return;

    setError(null);
    setFeedback(null);
    setBusyId(utrId);

    startTransition(async () => {
      try {
        const payload: Record<string, string> = { utr_id: utrId };
        const reason = reasonDrafts[row.user_id]?.trim();
        if (kind === "reject" && reason) payload.rejection_reason = reason;

        const res = await fetch(`/api/admin/${kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Action failed");

        const nextStatus = kind === "approve" ? "active" : "rejected";
        const nextPaymentStatus = kind === "approve" ? "approved" : "rejected";
        const nextExpiry =
          kind === "approve" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : row.expiry_date;

        setPendingRows((prev) => prev.filter((item) => item.user_id !== row.user_id));
        setDirectoryRows((prev) =>
          prev.map((item) =>
            item.user_id !== row.user_id
              ? item
              : {
                  ...item,
                  reviewable: false,
                  subscription_status: nextStatus,
                  latest_payment_status: nextPaymentStatus,
                  expiry_date: nextExpiry,
                  plan_amount: row.plan_amount,
                  latest_rejection_reason: kind === "reject" ? reason || item.latest_rejection_reason : null
                }
          )
        );

        if (selectedUser?.user_id === row.user_id) {
          setSelectedUser((current) =>
            current
              ? {
                  ...current,
                  reviewable: false,
                  subscription_status: nextStatus,
                  latest_payment_status: nextPaymentStatus,
                  expiry_date: nextExpiry,
                  latest_rejection_reason:
                    kind === "reject" ? reason || current.latest_rejection_reason : null
                }
              : current
          );
        }

        setDashboardStats((current) => ({
          ...current,
          pendingApprovals: Math.max(0, current.pendingApprovals - 1),
          activeSubscribers:
            kind === "approve" && row.subscription_status !== "active"
              ? current.activeSubscribers + 1
              : current.activeSubscribers,
          totalRevenue:
            kind === "approve" ? current.totalRevenue + Number(row.plan_amount ?? 0) : current.totalRevenue
        }));

        setReasonDrafts((prev) => {
          const next = { ...prev };
          delete next[row.user_id];
          return next;
        });
        setRejectingUserId((current) => (current === row.user_id ? null : current));
        setFeedback(kind === "approve" ? "Warrior accepted into KAIZEN." : "Verification failed. Contact support.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-300"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="rounded-2xl border border-blood-500/35 bg-blood-500/[0.06] px-4 py-3 text-sm text-blood-400">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricCard label="Pending Approvals" value={String(dashboardStats.pendingApprovals)} helper="awaiting review" accent="blood" icon={Clock3} />
        <MetricCard label="Active Warriors" value={String(dashboardStats.activeSubscribers)} helper="premium access" accent="emerald" icon={BadgeCheck} />
        <MetricCard label="Total Revenue" value={formatCompactINR(dashboardStats.totalRevenue)} helper="approved UTRs" accent="blood" icon={IndianRupee} />
        <MetricCard label="Expiring Soon" value={String(dashboardStats.expiringSoon)} helper="next 7 days" accent="amber" icon={CalendarClock} />
        <MetricCard label="Total Users" value={String(dashboardStats.totalUsers)} helper={`${dashboardStats.monthlyGrowth >= 0 ? "+" : ""}${dashboardStats.monthlyGrowth.toFixed(1)}% MoM`} accent="neutral" icon={Users} />
        <MetricCard label="Consistency Rate" value={`${clampPercent(dashboardStats.consistencyRate)}%`} helper="7-day discipline" accent="emerald" icon={Flame} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Total Users Growth" subtitle="Cumulative registrations" icon={TrendingUp}>
          <LineChart data={analytics.usersGrowth} color="#D00000" />
        </ChartPanel>
        <ChartPanel title="Monthly Revenue" subtitle="Approved premium cashflow" icon={IndianRupee}>
          <BarChart data={analytics.monthlyRevenue} color="#D00000" />
        </ChartPanel>
        <ChartPanel title="Daily Active Users" subtitle="Unique warriors active in the last 7 days" icon={Activity}>
          <LineChart data={analytics.dailyActiveUsers} color="#f59e0b" />
        </ChartPanel>
        <ChartPanel title="Branch Distribution" subtitle="Where demand is clustering" icon={GraduationCap}>
          <DistributionList data={analytics.branchDistribution} />
        </ChartPanel>
        <ChartPanel title="Plan Distribution" subtitle="Free vs paid demand split" icon={BarChart3}>
          <DistributionList data={analytics.planDistribution} />
        </ChartPanel>
        <ChartPanel title="Conversion Signals" subtitle="Retention, conversion, and workout completion" icon={Sparkles}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <GaugeCard label="Conversion" value={analytics.conversionRate} />
            <GaugeCard label="Retention" value={analytics.retentionRate} />
            <GaugeCard label="Workout Completion" value={analytics.workoutCompletionRate} />
          </div>
        </ChartPanel>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Sensei filters</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Command the verification queue</h2>
            <p className="mt-1 text-sm text-white/50">
              Search, segment, and review warriors before you activate premium access.
            </p>
          </div>

          <DirectoryControls
            search={search}
            planFilter={planFilter}
            statusFilter={statusFilter}
            branchFilter={branchFilter}
            sortMode={sortMode}
            branchOptions={branchOptions}
            onSearchChange={setSearch}
            onPlanChange={setPlanFilter}
            onStatusChange={setStatusFilter}
            onBranchChange={setBranchFilter}
            onSortChange={setSortMode}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Awaiting Sensei Verification</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Pending approval queue</h2>
          </div>
          <span className="rounded-full border border-blood-500/20 bg-blood-500/[0.06] px-3 py-1 text-xs uppercase tracking-[0.16em] text-blood-300">
            {filteredPending.length} awaiting
          </span>
        </div>

        {filteredPending.length === 0 ? (
          <EmptyState title="No warriors awaiting Sensei verification." body="Fresh pending submissions will appear here with full learner context." />
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredPending.map((row) => {
              const busy = busyId === row.latest_utr_id || pendingTransition;
              const rejecting = rejectingUserId === row.user_id;
              return (
                <article key={row.user_id} className="rounded-[26px] border border-white/[0.08] bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blood-500/20 bg-blood-500/[0.08] text-sm font-semibold text-blood-400">
                        {avatarText(row.full_name, row.email)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white">{row.full_name ?? "Unnamed warrior"}</h3>
                        <p className="truncate text-sm text-white/50">{row.email ?? "No email captured"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${toneForStatus(row.latest_payment_status)}`}>
                            {row.latest_payment_status ?? "pending"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                            {formatPlan(row.plan_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedUser(row)}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/55 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <MiniInfo icon={Phone} label="WhatsApp" value={row.whatsapp ?? "—"} />
                    <MiniInfo icon={Clock3} label="Submitted UTR" value={row.latest_utr_number ?? "—"} />
                    <MiniInfo icon={Target} label="Goal" value={goalLabel(row.main_goal, row.main_goal_other)} />
                    <MiniInfo icon={Flame} label="Current streak" value={`${row.current_streak} days`} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/60">Roadmap completion</span>
                      <span className="font-semibold text-white">{row.progress_percent}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                      <div className="h-2 rounded-full bg-blood-500" style={{ width: `${row.progress_percent}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-white/45">Submitted {formatDate(row.latest_payment_created_at)}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => actOnUser(row, "approve")}
                      disabled={busy}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {busy ? "Working..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(row)}
                      className="btn-secondary w-full"
                    >
                      <Sparkles className="h-4 w-4" />
                      View Full Profile
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRejectingUserId((current) => (current === row.user_id ? null : row.user_id))
                      }
                      disabled={busy}
                      className="btn-secondary w-full disabled:opacity-50"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      {rejecting ? "Cancel Reject" : "Reject"}
                    </button>
                  </div>

                  {rejecting && (
                    <div className="mt-3 rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Rejection reason</span>
                        <textarea
                          value={reasonDrafts[row.user_id] ?? ""}
                          onChange={(event) =>
                            setReasonDrafts((prev) => ({ ...prev, [row.user_id]: event.target.value }))
                          }
                          rows={3}
                          placeholder="Optional note for support follow-up"
                          className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
                        />
                      </label>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => actOnUser(row, "reject")}
                          disabled={busy}
                          className="btn-primary bg-white text-black hover:bg-white/90 disabled:opacity-50"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          {busy ? "Rejecting..." : "Confirm Rejection"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Warrior Directory</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Complete user visibility</h2>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/55">
            {filteredDirectory.length} visible
          </span>
        </div>

        {filteredDirectory.length === 0 ? (
          <EmptyState title="No warriors match the current filters." body="Try broadening the plan, branch, or status filters." />
        ) : (
          <div className="mt-5 grid gap-3">
            {filteredDirectory.map((row) => (
              <button
                type="button"
                key={row.user_id}
                onClick={() => setSelectedUser(row)}
                className="grid w-full gap-3 rounded-[24px] border border-white/[0.08] bg-black/25 p-4 text-left transition-transform duration-200 hover:scale-[1.01] hover:border-blood-500/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-white/80">
                      {avatarText(row.full_name, row.email)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-white">{row.full_name ?? "Unnamed warrior"}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${toneForStatus(row.subscription_status)}`}>
                          {row.subscription_status ?? "pending"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-white/45">{row.email ?? "No email captured"}</p>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/35" />
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <MiniInfo icon={IndianRupee} label="Plan" value={formatPlan(row.plan_amount)} />
                  <MiniInfo icon={GraduationCap} label="Branch" value={row.branch ?? toLabel(row.path_type)} />
                  <MiniInfo icon={Flame} label="Streak" value={`${row.current_streak} days`} />
                  <MiniInfo icon={BarChart3} label="Progress" value={`${row.progress_percent}%`} />
                  <MiniInfo icon={Activity} label="Last active" value={formatShortDate(row.latest_activity_at)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedUser && (
          <UserModal
            user={selectedUser}
            busy={busyId === selectedUser.latest_utr_id || pendingTransition}
            rejecting={rejectingUserId === selectedUser.user_id}
            reason={reasonDrafts[selectedUser.user_id] ?? ""}
            onClose={() => setSelectedUser(null)}
            onApprove={
              selectedUser.reviewable ? () => actOnUser(selectedUser, "approve") : undefined
            }
            onToggleReject={() =>
              setRejectingUserId((current) => (current === selectedUser.user_id ? null : selectedUser.user_id))
            }
            onReject={
              selectedUser.reviewable ? () => actOnUser(selectedUser, "reject") : undefined
            }
            onReasonChange={(value) =>
              setReasonDrafts((prev) => ({ ...prev, [selectedUser.user_id]: value }))
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DirectoryControls({
  search,
  planFilter,
  statusFilter,
  branchFilter,
  sortMode,
  branchOptions,
  onSearchChange,
  onPlanChange,
  onStatusChange,
  onBranchChange,
  onSortChange
}: {
  search: string;
  planFilter: PlanFilter;
  statusFilter: StatusFilter;
  branchFilter: string;
  sortMode: SortMode;
  branchOptions: string[];
  onSearchChange: (value: string) => void;
  onPlanChange: (value: PlanFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  onBranchChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
}) {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-5">
      <label className="relative sm:col-span-2 xl:min-w-[260px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, email, UTR, branch"
          className="w-full rounded-2xl border border-white/[0.08] bg-black/25 px-10 py-3 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
        />
      </label>

      <SelectShell value={planFilter} onChange={(value) => onPlanChange(value as PlanFilter)}>
        <option value="all">All plans</option>
        <option value="free">Free</option>
        <option value="49">Rs 49</option>
        <option value="99">Rs 99</option>
      </SelectShell>

      <SelectShell value={statusFilter} onChange={(value) => onStatusChange(value as StatusFilter)}>
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
        <option value="rejected">Rejected</option>
      </SelectShell>

      <SelectShell value={branchFilter} onChange={onBranchChange}>
        <option value="all">All branches</option>
        {branchOptions.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </SelectShell>

      <SelectShell value={sortMode} onChange={(value) => onSortChange(value as SortMode)}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="streak">Highest streak</option>
        <option value="progress">Highest progress</option>
      </SelectShell>
    </div>
  );
}

function SelectShell({
  value,
  onChange,
  children
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-3 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
    >
      {children}
    </select>
  );
}

function ChartPanel({
  title,
  subtitle,
  icon: Icon,
  children
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Icon className="h-4 w-4 text-white/70" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function LineChart({ data, color }: { data: SenseiChartPoint[]; color: string }) {
  if (data.length === 0) return <p className="text-sm text-white/45">No data yet.</p>;
  const max = Math.max(...data.map((point) => point.value), 1);
  const width = 360;
  const height = 160;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((point, index) => {
      const x = index * step;
      const y = height - (point.value / max) * (height - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {data.map((point, index) => {
          const x = index * step;
          const y = height - (point.value / max) * (height - 16) - 8;
          return <circle key={point.label} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-white/45 sm:grid-cols-6">
        {data.map((point) => (
          <div key={point.label}>
            <p>{point.label}</p>
            <p className="mt-1 text-white/75">{point.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color }: { data: SenseiChartPoint[]; color: string }) {
  if (data.length === 0) return <p className="text-sm text-white/45">No data yet.</p>;
  const max = Math.max(...data.map((point) => point.value), 1);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {data.map((point) => (
        <div key={point.label} className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
          <div className="flex items-end gap-3">
            <div className="flex h-24 w-3 items-end rounded-full bg-white/[0.06]">
              <div
                className="w-3 rounded-full"
                style={{ height: `${Math.max(12, (point.value / max) * 96)}px`, backgroundColor: color }}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{point.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{point.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DistributionList({ data }: { data: SenseiChartPoint[] }) {
  if (data.length === 0) return <p className="text-sm text-white/45">No data yet.</p>;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="space-y-3">
      {data.map((point) => {
        const pct = (point.value / total) * 100;
        return (
          <div key={point.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/70">{point.label}</span>
              <span className="text-white">{point.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
              <div className="h-2 rounded-full bg-blood-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GaugeCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4 text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <div className="mt-3 text-2xl font-semibold text-white">{clampPercent(value)}%</div>
      <div className="mt-3 h-2 rounded-full bg-white/[0.06]">
        <div className="h-2 rounded-full bg-blood-500" style={{ width: `${clampPercent(value)}%` }} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  accent,
  icon: Icon
}: {
  label: string;
  value: string;
  helper: string;
  accent: "blood" | "emerald" | "amber" | "neutral";
  icon: ComponentType<{ className?: string }>;
}) {
  const tone =
    accent === "blood"
      ? "border-blood-500/25 bg-blood-500/[0.05] text-blood-400"
      : accent === "emerald"
        ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300"
        : accent === "amber"
          ? "border-amber-300/20 bg-amber-300/[0.05] text-amber-300"
          : "border-white/[0.08] bg-white/[0.03] text-white/70";

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">{value}</p>
          <p className="mt-1 text-xs text-white/45">{helper}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl border ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-base font-medium text-white/80">{title}</p>
      <p className="mt-1 text-sm text-white/45">{body}</p>
    </div>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/45" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className="mt-0.5 truncate text-sm text-white/78">{value}</p>
      </div>
    </div>
  );
}

function UserModal({
  user,
  busy,
  rejecting,
  reason,
  onClose,
  onApprove,
  onToggleReject,
  onReject,
  onReasonChange
}: {
  user: SenseiUserRecord;
  busy: boolean;
  rejecting: boolean;
  reason: string;
  onClose: () => void;
  onApprove?: () => void;
  onToggleReject: () => void;
  onReject?: () => void;
  onReasonChange: (value: string) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 px-4 py-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#070707] shadow-[0_32px_100px_-32px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blood-500/20 bg-blood-500/[0.08] text-base font-semibold text-blood-400">
              {avatarText(user.full_name, user.email)}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Warrior profile</p>
              <h3 className="mt-1 truncate text-xl font-semibold text-white">{user.full_name ?? "Unnamed warrior"}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${toneForStatus(user.subscription_status)}`}>
                  {user.subscription_status ?? "pending"}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${toneForStatus(user.latest_payment_status)}`}>
                  Payment {user.latest_payment_status ?? "none"}
                </span>
                {user.ai_track_label && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                    {user.ai_track_label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/60 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <Panel title="Identity" eyebrow="Account">
                <InfoGrid
                  items={[
                    { icon: Mail, label: "Email", value: user.email ?? "—" },
                    { icon: Phone, label: "WhatsApp", value: user.whatsapp ?? "—" },
                    {
                      icon: GraduationCap,
                      label: "Path",
                      value: user.branch ? `${toLabel(user.path_type)} · ${user.branch}` : toLabel(user.path_type)
                    },
                    { icon: CalendarClock, label: "Joined", value: formatShortDate(user.joined_at) }
                  ]}
                />
              </Panel>

              <Panel title="Onboarding Snapshot" eyebrow="Learner context">
                <InfoGrid
                  items={[
                    { icon: Target, label: "Goal", value: goalLabel(user.main_goal, user.main_goal_other) },
                    { icon: Sparkles, label: "Field", value: user.field_of_study ?? "—" },
                    { icon: BarChart3, label: "Skill level", value: toLabel(user.skill_level) },
                    { icon: Clock3, label: "Daily time", value: user.daily_time_min ? `${user.daily_time_min} min / day` : "—" },
                    {
                      icon: Dumbbell,
                      label: "Workout preference",
                      value:
                        [toLabel(user.workout_location), toLabel(user.fitness_level)]
                          .filter((value) => value !== "—")
                          .join(" · ") || "—"
                    },
                    { icon: Users, label: "Occupation", value: toLabel(user.occupation) }
                  ]}
                />
              </Panel>

              <Panel title="Payment History" eyebrow="Verification trail">
                <div className="space-y-2">
                  {user.payment_history.length === 0 ? (
                    <p className="text-sm text-white/45">No prior payment entries.</p>
                  ) : (
                    user.payment_history.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-mono text-sm tracking-[0.12em] text-white">{entry.utr_number}</p>
                            <p className="mt-1 text-xs text-white/45">{formatDate(entry.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">{formatPlan(entry.plan_amount)}</p>
                            <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${toneForStatus(entry.status)}`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                        {entry.rejection_reason && (
                          <p className="mt-2 text-xs text-blood-400">Reason: {entry.rejection_reason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel title="Roadmap & Discipline" eyebrow="Progress">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Current streak" value={`${user.current_streak}`} helper="days" />
                  <MiniStat label="Longest streak" value={`${user.longest_streak}`} helper="days" />
                  <MiniStat label="Completed days" value={`${user.completed_days}`} helper="/ 30" />
                  <MiniStat label="Roadmap day" value={`${user.current_roadmap_day}`} helper="current" />
                </div>
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/60">Roadmap completion</span>
                    <span className="font-semibold text-white">{user.progress_percent}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                    <div className="h-2 rounded-full bg-blood-500" style={{ width: `${user.progress_percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/45">Latest activity: {formatDate(user.latest_activity_at)}</p>
                </div>
              </Panel>

              <Panel title="Subscription Control" eyebrow="Access state">
                <InfoGrid
                  items={[
                    { icon: IndianRupee, label: "Selected plan", value: formatPlan(user.plan_amount) },
                    { icon: Clock3, label: "Submitted UTR", value: user.latest_utr_number ?? "—" },
                    { icon: CalendarClock, label: "Expiry", value: formatDate(user.expiry_date) },
                    { icon: Flame, label: "Last sealed day", value: formatShortDate(user.last_completed_date) }
                  ]}
                />

                {user.reviewable ? (
                  <>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button type="button" disabled={busy || !onApprove} onClick={onApprove} className="btn-primary w-full disabled:opacity-50">
                        <Check className="h-4 w-4" />
                        {busy ? "Working..." : "Approve & unlock"}
                      </button>
                      <button type="button" disabled={busy || !onReject} onClick={onToggleReject} className="btn-secondary w-full disabled:opacity-50">
                        <ShieldAlert className="h-4 w-4" />
                        {rejecting ? "Cancel reject" : "Reject request"}
                      </button>
                    </div>

                    {rejecting && (
                      <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/25 p-3">
                        <label className="block">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Rejection reason</span>
                          <textarea
                            value={reason}
                            onChange={(event) => onReasonChange(event.target.value)}
                            rows={3}
                            placeholder="Optional note for support follow-up"
                            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
                          />
                        </label>
                        <div className="mt-3 flex justify-end">
                          <button type="button" disabled={busy || !onReject} onClick={onReject} className="btn-primary bg-white text-black hover:bg-white/90 disabled:opacity-50">
                            <ShieldAlert className="h-4 w-4" />
                            {busy ? "Rejecting..." : "Confirm rejection"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-3 text-sm text-white/55">
                    This warrior is not awaiting payment approval right now. Use the directory view to inspect their current status and history.
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{eyebrow}</p>
      <h4 className="mt-1 text-base font-semibold text-white">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoGrid({
  items
}: {
  items: Array<{ icon: ComponentType<{ className?: string }>; label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-3">
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <Icon className="h-3.5 w-3.5 text-white/45" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-1 break-words text-sm text-white/78">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-white">{value}</span>
        <span className="text-xs text-white/45">{helper}</span>
      </div>
    </div>
  );
}
