"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Ban,
  CalendarClock,
  Check,
  Clock3,
  IndianRupee,
  Mail,
  Phone,
  ShieldAlert,
  X
} from "lucide-react";

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
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

interface Props {
  initialPending: SenseiPendingRow[];
  stats: Stats;
}

function formatPlan(amount: number) {
  if (amount === 49) return "Intermediate · Rs 49";
  if (amount === 99) return "B.Tech · Rs 99";
  return "Rs " + amount;
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

export function SenseiVerificationDashboard({ initialPending, stats }: Props) {
  const [rows, setRows] = useState(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [approvedCount, setApprovedCount] = useState(stats.approved);
  const [rejectedCount, setRejectedCount] = useState(stats.rejected);

  const liveStats = useMemo(
    () => ({
      pending: rows.length,
      approved: approvedCount,
      rejected: rejectedCount
    }),
    [rows.length, approvedCount, rejectedCount]
  );

  const submit = (row: SenseiPendingRow, kind: "approve" | "reject" | "ban") => {
    setError(null);
    setBusyId(kind === "ban" ? row.user_id : row.utr_id);
    startTransition(async () => {
      try {
        const payload: Record<string, string> =
          kind === "ban"
            ? { user_id: row.user_id }
            : { utr_id: row.utr_id };

        const reason = reasonDrafts[row.utr_id]?.trim();
        if (kind === "reject" && reason) {
          payload.rejection_reason = reason;
        }

        const res = await fetch(`/api/admin/${kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Action failed");

        if (kind !== "ban") {
          setRows((prev) => prev.filter((item) => item.utr_id !== row.utr_id));
          if (kind === "approve") setApprovedCount((current) => current + 1);
          if (kind === "reject") setRejectedCount((current) => current + 1);
          setReasonDrafts((prev) => {
            const next = { ...prev };
            delete next[row.utr_id];
            return next;
          });
          setRejectingId((current) => (current === row.utr_id ? null : current));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Pending" value={liveStats.pending} accent="blood" icon={Clock3} />
        <MetricCard label="Approved" value={liveStats.approved} accent="emerald" icon={BadgeCheck} />
        <MetricCard label="Rejected" value={liveStats.rejected} accent="amber" icon={ShieldAlert} />
      </section>

      {error && (
        <div className="rounded-2xl border border-blood-500/35 bg-blood-500/[0.06] px-4 py-3 text-sm text-blood-500">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Verification Queue</p>
            <h2 className="mt-1 text-lg font-semibold">Pending enrollments</h2>
          </div>
          <span className="rounded-full border border-blood-500/30 bg-blood-500/[0.08] px-3 py-1 text-[11px] font-semibold text-blood-500">
            {rows.length} awaiting
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-base font-medium text-white/80">No warriors awaiting Sensei verification.</p>
            <p className="mt-1 text-sm text-white/45">New payment submissions will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {rows.map((row, index) => {
              const busy = busyId === row.utr_id || busyId === row.user_id || pending;
              const rejecting = rejectingId === row.utr_id;
              return (
                <motion.article
                  key={row.utr_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.02 }}
                  className="px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{row.full_name ?? "Unnamed warrior"}</h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/50">
                          {row.subscription_status ?? "pending"}
                        </span>
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-300">
                          Payment {row.payment_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-white/70 sm:grid-cols-2">
                        <InfoLine icon={Mail} label="Email" value={row.email ?? "—"} mono={false} />
                        <InfoLine icon={Phone} label="WhatsApp" value={row.whatsapp ?? "—"} mono />
                        <InfoLine icon={IndianRupee} label="Plan" value={formatPlan(row.plan_amount)} mono={false} />
                        <InfoLine icon={CalendarClock} label="Submitted" value={formatDate(row.created_at)} mono={false} />
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">UTR Number</p>
                        <p className="mt-1 font-mono text-sm tracking-[0.16em] text-white">{row.utr_number}</p>
                        {row.expiry_date && (
                          <p className="mt-2 text-[11px] text-white/40">
                            Current expiry: {formatDate(row.expiry_date)}
                          </p>
                        )}
                      </div>

                      {rejecting && (
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                              Rejection reason
                            </span>
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
                              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blood-500/50"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[280px]">
                      <button
                        disabled={busy}
                        onClick={() => submit(row, "approve")}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {busyId === row.utr_id ? "Working..." : "Approve"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          setRejectingId((current) => (current === row.utr_id ? null : row.utr_id))
                        }
                        className="btn-secondary w-full disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        {rejecting ? "Cancel" : "Reject"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => submit(row, "ban")}
                        className="btn-secondary w-full border-blood-500/20 text-blood-500 hover:border-blood-500/40 hover:bg-blood-500/[0.06] disabled:opacity-50 col-span-2 sm:col-span-1"
                      >
                        <Ban className="h-4 w-4" />
                        Ban
                      </button>
                      {rejecting && (
                        <button
                          disabled={busy}
                          onClick={() => submit(row, "reject")}
                          className="btn-primary col-span-2 sm:col-span-3 w-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          {busyId === row.utr_id ? "Rejecting..." : "Confirm rejection"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
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
  value: number;
  accent: "blood" | "emerald" | "amber";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const tone =
    accent === "blood"
      ? "border-blood-500/25 bg-blood-500/[0.05] text-blood-500"
      : accent === "emerald"
        ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300"
        : "border-amber-300/20 bg-amber-300/[0.05] text-amber-300";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl border ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  mono = false
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
        <Icon className="h-3.5 w-3.5 text-white/45" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className={`mt-0.5 truncate text-sm text-white/78 ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
