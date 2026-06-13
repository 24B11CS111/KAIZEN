"use client";

import { useState, useMemo } from "react";
import { Search, IndianRupee, Clock3, AlertCircle } from "lucide-react";

interface PaymentLog {
  id: string;
  user_id: string;
  utr_number: string;
  plan_amount: number | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  full_name: string;
  email: string;
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
  if (amount === 49) return "Essential Growth · Rs 49";
  if (amount === 99) return "AI Growth Assistant · Rs 99";
  return "Free";
}

export function SenseiPaymentsClient({ initialPayments }: { initialPayments: PaymentLog[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return initialPayments.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = 
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.utr_number || "").toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [initialPayments, search, statusFilter]);

  return (
    <div className="flex flex-col h-full w-full sensei-panel overflow-hidden">
      {/* Filters Bar */}
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/20">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search name, email, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blood-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blood-500/50 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-obsidian border-b border-white/10 text-white/40 uppercase tracking-wider text-[10px] z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Transaction Details</th>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Dates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                  No payment logs found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        log.status === "approved" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                        log.status === "rejected" ? "border-blood-500/20 bg-blood-500/10 text-blood-400" :
                        "border-white/10 bg-white/5 text-white/50"
                      }`}>
                        <IndianRupee className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-mono text-white text-xs">{log.utr_number || "NO UTR"}</p>
                        <p className="text-xs text-white/40 mt-0.5">ID: {log.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{log.full_name}</p>
                    <p className="text-xs text-white/40">{log.email}</p>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {formatPlan(log.plan_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                      log.status === "approved" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" :
                      log.status === "rejected" ? "border-blood-500/25 bg-blood-500/[0.08] text-blood-400" :
                      "border-amber-300/20 bg-amber-300/[0.06] text-amber-300"
                    }`}>
                      {log.status}
                    </span>
                    {log.rejection_reason && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-blood-400 max-w-[200px] truncate">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span className="truncate" title={log.rejection_reason}>{log.rejection_reason}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-3 w-3 text-white/30" />
                        <span className="text-xs">Sub: {formatDate(log.created_at)}</span>
                      </div>
                      {log.reviewed_at && (
                        <div className="flex items-center gap-2">
                          <CheckIcon className="h-3 w-3 text-emerald-400/50" />
                          <span className="text-xs">Rev: {formatDate(log.reviewed_at)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
