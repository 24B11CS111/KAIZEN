"use client";

import { useState } from "react";
import { Check, Clock3, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { type SenseiUserRecord } from "@/lib/adminData";
import { useRouter } from "next/navigation";

function avatarText(name: string | null, email: string | null) {
  const source = (name?.trim() || email?.trim() || "KA").split(/\s+/).filter(Boolean);
  const initials = source.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "KA";
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

function formatPlan(amount: number | null) {
  if (amount === 49) return "Intermediate · Rs 49";
  if (amount === 99) return "B.Tech · Rs 99";
  return "Free";
}

export function SenseiApprovalsClient({ pendingUsers }: { pendingUsers: SenseiUserRecord[] }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter();

  const filtered = pendingUsers.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.latest_utr_number || "").toLowerCase().includes(q)
    );
  });

  const handleAction = async (user: SenseiUserRecord, action: "approve" | "reject") => {
    if (!user.latest_utr_id) return;
    setBusyId(user.latest_utr_id);
    
    try {
      const payload: Record<string, string> = { utr_id: user.latest_utr_id };
      if (action === "reject" && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }

      const res = await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Action failed");
      
      // Refresh the page
      router.refresh();
      setRejectingId(null);
      setRejectionReason("");
    } catch (e) {
      alert("Failed to process request");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input 
          type="text" 
          placeholder="Search by name, email, or UTR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blood-500/50 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
          <ShieldAlert className="h-10 w-10 text-white/20 mb-4" />
          <h3 className="text-white font-medium">No Pending Approvals</h3>
          <p className="text-sm text-white/40 mt-1">The queue is completely clear.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(user => (
            <div key={user.user_id} className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col transition-all hover:bg-black/60">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blood-500/20 bg-blood-500/[0.08] text-sm font-semibold text-blood-400">
                  {avatarText(user.full_name, user.email)}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{user.full_name || "Unknown"}</h3>
                  <p className="truncate text-sm text-white/50">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider">
                    Pending
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">UTR Number</p>
                  <p className="text-sm font-medium text-white font-mono mt-0.5">{user.latest_utr_number || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Plan</p>
                  <p className="text-sm font-medium text-white mt-0.5">{formatPlan(user.plan_amount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Submitted On</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock3 className="h-3 w-3 text-white/40" />
                    <p className="text-xs text-white/60">{formatDate(user.latest_payment_created_at)}</p>
                  </div>
                </div>
              </div>

              {rejectingId === user.user_id ? (
                <div className="mt-4 p-3 rounded-xl border border-blood-500/30 bg-blood-500/5">
                  <label className="block text-[10px] uppercase tracking-wider text-blood-400 mb-2">Rejection Reason</label>
                  <textarea 
                    className="w-full bg-black/50 border border-blood-500/20 rounded-lg p-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blood-500/50 mb-3"
                    placeholder="E.g., Invalid UTR number provided..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction(user, "reject")}
                      disabled={busyId === user.latest_utr_id}
                      className="flex-1 bg-blood-600 hover:bg-blood-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {busyId === user.latest_utr_id ? "Rejecting..." : "Confirm Reject"}
                    </button>
                    <button 
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-white/60" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleAction(user, "approve")}
                    disabled={busyId === user.latest_utr_id}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white text-black py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {busyId === user.latest_utr_id ? "Working..." : "Approve"}
                  </button>
                  <button 
                    onClick={() => setRejectingId(user.user_id)}
                    disabled={busyId === user.latest_utr_id}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
