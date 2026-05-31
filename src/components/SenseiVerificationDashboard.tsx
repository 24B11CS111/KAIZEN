"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Filter,
  Flame,
  GraduationCap,
  IndianRupee,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
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

export interface SenseiPendingRow {
  utr_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  utr_number: string;
  plan_amount: number;
  created_at: string;
  payment_status: string;
  rejection_reason?: string | null;
  subscription_status: string | null;
  expiry_date: string | null;
  joined_at: string | null;
  path_type: string | null;
  branch: string | null;
  occupation: string | null;
  field_of_study: string | null;
  daily_time_min: number | null;
  skill_level: string | null;
  main_goal: string | null;
  main_goal_other: string | null;
  age: number | null;
  gender: string | null;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  completed_days: number;
  current_roadmap_day: number;
  progress_percent: number;
  latest_activity_at: string | null;
  payment_history: SenseiPaymentHistoryEntry[];
  ai_track_label: string | null;
  ai_track_id: string | null;
  onboarding_raw: unknown;
}

export interface SenseiDashboardStats {
  pendingApprovals: number;
  activeSubscribers: number;
  totalRevenue: number;
  expiringSoon: number;
  totalUsers: number;
}

interface Props {
  initialPending: SenseiPendingRow[];
  stats: SenseiDashboardStats;
}

type PlanFilter = "all" | "49" | "99";
type PathFilter = "all" | "btech" | "intermediate";

function formatPlan(amount: number) {
  if (amount === 49) return "Intermediate · Rs 49";
  if (amount === 99) return "B.Tech · Rs 99";
  return "Rs " + amount;
}

function formatCompactINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
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
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function paymentTone(status: string | null | undefined) {
  switch (status) {
    case "approved":
    case "active":
      return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
    case "rejected":
      return "border-blood-500/25 bg-blood-500/[0.08] text-blood-400";
    default:
      return "border-amber-300/20 bg-amber-300/[0.06] text-amber-300";
  }
}

export function SenseiVerificationDashboard({ initialPending, stats }: Props) {
  const [rows, setRows] = useState(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [pathFilter, setPathFilter] = useState<PathFilter>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [selectedRow, setSelectedRow] = useState<SenseiPendingRow | null>(null);
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [pendingTransition, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        needle.length === 0 ||
        [
          row.full_name,
          row.email,
          row.whatsapp,
          row.utr_number,
          row.branch,
          row.ai_track_label
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));

      const matchesPlan = planFilter === "all" || String(row.plan_amount) === planFilter;
      const matchesPath = pathFilter === "all" || (row.path_type ?? "").toLowerCase() === pathFilter;

      return matchesSearch && matchesPlan && matchesPath;
    });
  }, [rows, search, planFilter, pathFilter]);

  const submit = (row: SenseiPendingRow, kind: "approve" | "reject") => {
    setError(null);
    setBusyId(row.utr_id);
    startTransition(async () => {
      try {
        const payload: Record<string, string> = { utr_id: row.utr_id };
        const reason = reasonDrafts[row.utr_id]?.trim();
        if (kind === "reject" && reason) payload.rejection_reason = reason;

        const res = await fetch(`/api/admin/${kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Action failed");

        setRows((prev) => prev.filter((item) => item.utr_id !== row.utr_id));
        setReasonDrafts((prev) => {
          const next = { ...prev };
          delete next[row.utr_id];
          return next;
        });
        setRejectingId((current) => (current === row.utr_id ? null : current));
        setSelectedRow((current) => (current?.utr_id === row.utr_id ? null : current));
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
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Pending Approvals" value={String(dashboardStats.pendingApprovals)} accent="blood" icon={Clock3} />
        <MetricCard label="Active Subscribers" value={String(dashboardStats.activeSubscribers)} accent="emerald" icon={BadgeCheck} />
        <MetricCard label="Revenue" value={formatCompactINR(dashboardStats.totalRevenue)} accent="blood" icon={IndianRupee} />
        <MetricCard label="Expiring Soon" value={String(dashboardStats.expiringSoon)} accent="amber" icon={CalendarClock} />
        <MetricCard label="Total Users" value={String(dashboardStats.totalUsers)} accent="neutral" icon={Users} />
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Verification Queue</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Pending approvals</h2>
            <p className="mt-1 text-sm text-white/50">
              Search by learner, UTR, branch, or phone. Open any row to review the full context before approval.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[560px]">
            <label className="relative sm:col-span-3 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, UTR, branch"
                className="w-full rounded-2xl border border-white/[0.08] bg-black/25 py-3 pl-10 pr-3 text-sm text-white outline-none transition-colors focus:border-blood-500/45"
              />
            </label>

            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2.5">
              <Filter className="h-4 w-4 text-white/35" />
              <select
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value as PlanFilter)}
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                <option value="all">All plans</option>
                <option value="49">Intermediate · Rs 49</option>
                <option value="99">B.Tech · Rs 99</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2.5">
              <Sparkles className="h-4 w-4 text-white/35" />
              <select
                value={pathFilter}
                onChange={(event) => setPathFilter(event.target.value as PathFilter)}
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                <option value="all">All paths</option>
                <option value="btech">B.Tech</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-blood-500/35 bg-blood-500/[0.06] px-4 py-3 text-sm text-blood-400">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-white/[0.06] px-5 py-4 text-[10px] uppercase tracking-[0.18em] text-white/40 lg:grid">
          <span>Warrior</span>
          <span>Status</span>
          <span>Plan</span>
          <span>Submitted</span>
          <span>Streak</span>
          <span>Actions</span>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-base font-medium text-white/80">No warriors awaiting Sensei verification.</p>
            <p className="mt-1 text-sm text-white/45">
              Pending payment submissions will appear here the moment learners complete the UTR flow.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredRows.map((row, index) => {
              const busy = busyId === row.utr_id || pendingTransition;
              const rejecting = rejectingId === row.utr_id;
              const avatar = avatarText(row.full_name, row.email);

              return (
                <motion.article
                  key={row.utr_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.02 }}
                  className="px-4 py-4 sm:px-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr_1fr] lg:items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedRow(row)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blood-500/20 bg-blood-500/[0.08] text-sm font-semibold text-blood-400">
                        {avatar}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {row.full_name ?? "Unnamed warrior"}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-white/55">
                          {row.email ?? "—"}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-white/38">
                          {row.branch ? `${toLabel(row.path_type)} · ${row.branch}` : toLabel(row.path_type)}
                        </span>
                      </span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${paymentTone(row.subscription_status)}`}>
                        {row.subscription_status ?? "pending"}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${paymentTone(row.payment_status)}`}>
                        Payment {row.payment_status}
                      </span>
                    </div>

                    <div className="text-sm text-white/78">{formatPlan(row.plan_amount)}</div>
                    <div className="text-sm text-white/60">{formatDate(row.created_at)}</div>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Flame className="h-4 w-4 text-blood-400" />
                      {row.current_streak} day streak
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="btn-secondary text-xs"
                      >
                        Review <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => submit(row, "approve")}
                        className="btn-primary text-xs disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {busy ? "Working..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRejectingId((current) => (current === row.utr_id ? null : row.utr_id))}
                        className="btn-secondary text-xs disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        {rejecting ? "Cancel" : "Reject"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-white/65 sm:grid-cols-2 xl:hidden">
                    <MiniInfo icon={Phone} label="WhatsApp" value={row.whatsapp ?? "—"} />
                    <MiniInfo icon={Target} label="Goal" value={goalLabel(row.main_goal, row.main_goal_other)} />
                  </div>

                  {rejecting && (
                    <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-3">
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Rejection reason</span>
                        <textarea
                          value={reasonDrafts[row.utr_id] ?? ""}
                          onChange={(event) =>
                            setReasonDrafts((prev) => ({
                              ...prev,
                              [row.utr_id]: event.target.value
                            }))
                          }
                          rows={3}
                          placeholder="Optional note for support follow-up"
                          className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
                        />
                      </label>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => submit(row, "reject")}
                          className="btn-primary bg-white text-black hover:bg-white/90 disabled:opacity-50"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          {busy ? "Rejecting..." : "Confirm rejection"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedRow && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRow(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#070707] shadow-[0_32px_100px_-32px_rgba(0,0,0,0.85)]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blood-500/20 bg-blood-500/[0.08] text-base font-semibold text-blood-400">
                    {avatarText(selectedRow.full_name, selectedRow.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Warrior profile</p>
                    <h3 className="mt-1 truncate text-xl font-semibold text-white">
                      {selectedRow.full_name ?? "Unnamed warrior"}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${paymentTone(selectedRow.subscription_status)}`}>
                        {selectedRow.subscription_status ?? "pending"}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${paymentTone(selectedRow.payment_status)}`}>
                        Payment {selectedRow.payment_status}
                      </span>
                      {selectedRow.ai_track_label && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                          {selectedRow.ai_track_label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
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
                          { icon: Mail, label: "Email", value: selectedRow.email ?? "—" },
                          { icon: Phone, label: "WhatsApp", value: selectedRow.whatsapp ?? "—" },
                          { icon: GraduationCap, label: "Path", value: selectedRow.branch ? `${toLabel(selectedRow.path_type)} · ${selectedRow.branch}` : toLabel(selectedRow.path_type) },
                          { icon: CalendarClock, label: "Joined", value: formatShortDate(selectedRow.joined_at) }
                        ]}
                      />
                    </Panel>

                    <Panel title="Onboarding Snapshot" eyebrow="Learner context">
                      <InfoGrid
                        items={[
                          { icon: Target, label: "Goal", value: goalLabel(selectedRow.main_goal, selectedRow.main_goal_other) },
                          { icon: Sparkles, label: "Field", value: selectedRow.field_of_study ?? "—" },
                          { icon: BarChart3, label: "Skill level", value: toLabel(selectedRow.skill_level) },
                          { icon: Clock3, label: "Daily time", value: selectedRow.daily_time_min ? `${selectedRow.daily_time_min} min / day` : "—" },
                          { icon: Users, label: "Occupation", value: toLabel(selectedRow.occupation) },
                          { icon: BadgeCheck, label: "Gender / Age", value: [toLabel(selectedRow.gender), selectedRow.age ? `${selectedRow.age}` : null].filter(Boolean).join(" · ") || "—" }
                        ]}
                      />
                    </Panel>

                    <Panel title="Payment History" eyebrow="Verification trail">
                      <div className="space-y-2">
                        {selectedRow.payment_history.length === 0 ? (
                          <p className="text-sm text-white/45">No prior payment entries.</p>
                        ) : (
                          selectedRow.payment_history.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-mono text-sm tracking-[0.12em] text-white">{entry.utr_number}</p>
                                  <p className="mt-1 text-xs text-white/45">{formatDate(entry.created_at)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-white">{formatPlan(entry.plan_amount)}</p>
                                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${paymentTone(entry.status)}`}>
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
                    <Panel title="Progress" eyebrow="Roadmap health">
                      <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="Current streak" value={`${selectedRow.current_streak}`} helper="days" accent="blood" />
                        <MiniStat label="Longest streak" value={`${selectedRow.longest_streak}`} helper="days" accent="neutral" />
                        <MiniStat label="Completed days" value={`${selectedRow.completed_days}`} helper="/ 30" accent="emerald" />
                        <MiniStat label="Roadmap day" value={`${selectedRow.current_roadmap_day}`} helper="current" accent="amber" />
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/60">Progress completion</span>
                          <span className="font-semibold text-white">{selectedRow.progress_percent}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                          <div
                            className="h-2 rounded-full bg-blood-500 transition-all"
                            style={{ width: `${selectedRow.progress_percent}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-white/45">
                          Latest activity: {formatDate(selectedRow.latest_activity_at)}
                        </p>
                      </div>
                    </Panel>

                    <Panel title="Subscription Control" eyebrow="Access state">
                      <InfoGrid
                        items={[
                          { icon: IndianRupee, label: "Requested plan", value: formatPlan(selectedRow.plan_amount) },
                          { icon: Clock3, label: "Submitted", value: formatDate(selectedRow.created_at) },
                          { icon: CalendarClock, label: "Expiry", value: formatDate(selectedRow.expiry_date) },
                          { icon: Flame, label: "Last sealed day", value: formatShortDate(selectedRow.last_completed_date) }
                        ]}
                      />

                      {selectedRow.rejection_reason && (
                        <div className="mt-4 rounded-2xl border border-blood-500/25 bg-blood-500/[0.06] px-3 py-3 text-sm text-blood-300">
                          Last rejection reason: {selectedRow.rejection_reason}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={busyId === selectedRow.utr_id}
                          onClick={() => submit(selectedRow, "approve")}
                          className="btn-primary w-full disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          {busyId === selectedRow.utr_id ? "Working..." : "Approve & unlock"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === selectedRow.utr_id}
                          onClick={() =>
                            setRejectingId((current) => (current === selectedRow.utr_id ? null : selectedRow.utr_id))
                          }
                          className="btn-secondary w-full disabled:opacity-50"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          {rejectingId === selectedRow.utr_id ? "Cancel reject" : "Reject request"}
                        </button>
                      </div>

                      {rejectingId === selectedRow.utr_id && (
                        <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/25 p-3">
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Rejection reason</span>
                            <textarea
                              value={reasonDrafts[selectedRow.utr_id] ?? ""}
                              onChange={(event) =>
                                setReasonDrafts((prev) => ({
                                  ...prev,
                                  [selectedRow.utr_id]: event.target.value
                                }))
                              }
                              rows={3}
                              placeholder="Optional note for support follow-up"
                              className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
                            />
                          </label>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              disabled={busyId === selectedRow.utr_id}
                              onClick={() => submit(selectedRow, "reject")}
                              className="btn-primary bg-white text-black hover:bg-white/90 disabled:opacity-50"
                            >
                              <ShieldAlert className="h-4 w-4" />
                              {busyId === selectedRow.utr_id ? "Rejecting..." : "Confirm rejection"}
                            </button>
                          </div>
                        </div>
                      )}
                    </Panel>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  icon: Icon
}: {
  label: string;
  value: string;
  accent: "blood" | "emerald" | "amber" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
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
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl border ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
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
  items: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }>;
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
              <p className="mt-1 text-sm text-white/78 break-words">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
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

function MiniStat({
  label,
  value,
  helper,
  accent
}: {
  label: string;
  value: string;
  helper: string;
  accent: "blood" | "emerald" | "amber" | "neutral";
}) {
  const tone =
    accent === "blood"
      ? "border-blood-500/20 bg-blood-500/[0.06] text-blood-300"
      : accent === "emerald"
        ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
        : accent === "amber"
          ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-300"
          : "border-white/[0.08] bg-black/25 text-white/70";

  return (
    <div className={`rounded-2xl border px-3 py-3 ${tone}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-white">{value}</span>
        <span className="text-xs text-white/45">{helper}</span>
      </div>
    </div>
  );
}
