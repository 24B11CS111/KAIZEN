"use client";
import { useState, useTransition } from "react";
import { Check, X, Phone, Hash, IndianRupee, User as UserIcon } from "lucide-react";

export interface PendingRow {
  utr_id: string;
  user_id: string;
  utr_number: string;
  plan_amount: number;
  created_at: string;
  full_name: string | null;
  whatsapp: string | null;
}

interface Props {
  rows: PendingRow[];
}

export function AdminApprovalList({ rows: initialRows }: Props) {
  const [rows, setRows] = useState<PendingRow[]>(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const act = (utr_id: string, kind: "approve" | "reject") => {
    setError(null);
    setPendingId(utr_id);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/" + kind, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ utr_id })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Action failed");
        // Optimistically remove the row from the list
        setRows((prev) => prev.filter((r) => r.utr_id !== utr_id));
      } catch (e: any) {
        setError(e?.message ?? "Action failed");
      } finally {
        setPendingId(null);
      }
    });
  };

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-white/65">All caught up.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="card p-3 mb-4 border-blood-500/40 text-xs text-blood-500">{error}</div>
      )}
      <ul className="space-y-3">
        {rows.map((r) => {
          const busy = pendingId === r.utr_id;
          const planLabel = r.plan_amount === 49 ? "Intermediate - Rs 49"
            : r.plan_amount === 99 ? "B.Tech - Rs 99"
            : "Rs " + r.plan_amount;
          return (
            <li key={r.utr_id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-md bg-white/5 border border-white/10 shrink-0">
                  <UserIcon className="h-4 w-4 text-white/70" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {r.full_name ?? "(no name)"}
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px] text-white/65">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Phone className="h-3 w-3 text-white/40 shrink-0" />
                      {r.whatsapp ?? "-"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 truncate font-mono">
                      <Hash className="h-3 w-3 text-white/40 shrink-0" />
                      {r.utr_number}
                    </span>
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <IndianRupee className="h-3 w-3 text-white/40 shrink-0" />
                      {planLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-white/35">
                    Submitted {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => act(r.utr_id, "approve")}
                  disabled={busy}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {busy ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => act(r.utr_id, "reject")}
                  disabled={busy}
                  className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  {busy ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
