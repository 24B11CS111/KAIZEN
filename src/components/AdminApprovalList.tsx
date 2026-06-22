"use client";
import { useState, useTransition, useEffect } from "react";

import { Check, X, Phone, Hash, IndianRupee, User as UserIcon, Image as ImageIcon, Ban, Edit, Clock, MoreVertical } from "lucide-react";

export interface PaymentSubmissionRow {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  transaction_id: string;
  payment_screenshot: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  full_name: string | null;
  whatsapp: string | null;
}

interface Props {
  initialRows: PaymentSubmissionRow[];
}

export function AdminApprovalList({ initialRows }: Props) {
  const [rows, setRows] = useState<PaymentSubmissionRow[]>(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // Realtime updates handled globally by AdminRealtime via router.refresh()

  const act = (id: string, action: string) => {
    if (pendingId) return;
    setPendingId(id);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/payment-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_id: id, action })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Failed");
        
        // Remove from list if processed
        setRows(prev => prev.filter(r => r.id !== id));
      } catch (e: any) {
        setError(e?.message ?? "Action failed");
      } finally {
        setPendingId(null);
      }
    });
  };

  const pendingRows = rows.filter(r => r.status === "pending");

  if (pendingRows.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center border border-white/[0.05] bg-black/40 backdrop-blur-md">
        <div className="h-12 w-12 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mb-4">
          <Check className="h-5 w-5 text-white/40" />
        </div>
        <h3 className="text-lg font-semibold text-white">All caught up</h3>
        <p className="text-sm text-white/50 mt-1 max-w-sm">
          No pending payment submissions in the queue. You're up to date.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="card p-3 mb-6 border-blood-500/40 bg-blood-500/[0.05] text-xs font-semibold text-blood-500 shadow-[0_0_15px_-3px_rgba(208,0,0,0.3)]">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-black/50 backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              <th className="px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-widest whitespace-nowrap">User</th>
              <th className="px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-widest whitespace-nowrap">Plan / Amt</th>
              <th className="px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-widest whitespace-nowrap">Txn ID</th>
              <th className="px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-widest whitespace-nowrap">Submitted</th>
              <th className="px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {pendingRows.map((r) => {
              const busy = pendingId === r.id;
              return (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                        <UserIcon className="h-4 w-4 text-white/60" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{r.full_name ?? "Unknown"}</div>
                        <div className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {r.whatsapp ?? "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">{r.plan}</span>
                      <span className="text-[11px] text-white/50 flex items-center gap-1 mt-0.5">
                        <IndianRupee className="h-3 w-3" /> {r.amount}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-xs font-mono text-white/70">
                      <Hash className="h-3 w-3 text-white/40" />
                      {r.transaction_id}
                    </span>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-xs text-white/60">
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      {new Date(r.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/admin/receipt?path=${r.payment_screenshot}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors tooltip-trigger relative"
                        title="View Screenshot"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </a>
                      
                      <button
                        onClick={() => act(r.id, "approve")}
                        disabled={busy}
                        className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        title="Approve & Upgrade"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => act(r.id, "reject")}
                        disabled={busy}
                        className="p-2 rounded-lg bg-blood-500/10 border border-blood-500/20 text-blood-400 hover:bg-blood-500/20 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Dropdown for extra actions (Ban, Edit Plan, Extend Expiry) */}
                      <div className="relative group/dropdown ml-1">
                        <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/[0.08] bg-[#0A0A0A] shadow-2xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 overflow-hidden">
                          <button onClick={() => act(r.id, "extend")} className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-white/40" /> Extend Expiry
                          </button>
                          <button onClick={() => act(r.id, "upgrade_plan")} className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white flex items-center gap-2">
                            <Edit className="h-3.5 w-3.5 text-white/40" /> Upgrade Plan
                          </button>
                          <button onClick={() => act(r.id, "downgrade_plan")} className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white flex items-center gap-2">
                            <Edit className="h-3.5 w-3.5 text-white/40" /> Downgrade Plan
                          </button>
                          <div className="h-px bg-white/[0.06] w-full" />
                          <button onClick={() => act(r.id, "delete")} className="w-full text-left px-4 py-2.5 text-xs text-blood-400 hover:bg-blood-500/10 flex items-center gap-2">
                            <X className="h-3.5 w-3.5" /> Delete Payment
                          </button>
                          <button onClick={() => act(r.id, "ban")} className="w-full text-left px-4 py-2.5 text-xs text-blood-400 hover:bg-blood-500/10 flex items-center gap-2">
                            <Ban className="h-3.5 w-3.5" /> Ban User
                          </button>
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
