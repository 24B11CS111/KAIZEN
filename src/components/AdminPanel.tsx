"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, X, ShieldAlert, Undo2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface PendingRow {
  utr_id: string;
  user_id: string;
  full_name: string | null;
  whatsapp: string | null;
  utr_number: string;
  plan_amount: number;
  created_at: string;
}

interface Props {
  initialPending: PendingRow[];
  page: number;
  pageSize: number;
  total: number;
}

export function AdminPanel({ initialPending, page, pageSize, total }: Props) {
  const [rows, setRows] = useState(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const action = async (
    endpoint: "approve" | "reject" | "ban" | "reset",
    payload: Record<string, string>
  ) => {
    setBusyId(payload.utr_id || payload.user_id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (payload.utr_id) {
        setRows((r) => r.filter((x) => x.utr_id !== payload.utr_id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="glass border-blood-500/40 rounded-md p-3 mb-4 text-sm text-blood-400">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-xs label-mono border-b border-white/5">
          <div className="col-span-3">Warrior</div>
          <div className="col-span-3">WhatsApp</div>
          <div className="col-span-3">UTR</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-white/55">
            <p className="font-display text-lg">The dojo is silent.</p>
            <p className="text-sm mt-1">No pending offerings to review.</p>
          </div>
        ) : (
          rows.map((row) => (
            <motion.div
              key={row.utr_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-12 items-center px-5 py-4 border-b border-white/5 last:border-0 text-sm hover:bg-white/[0.02]"
            >
              <div className="col-span-3 truncate">
                <div className="text-white font-medium">{row.full_name || "—"}</div>
                <div className="text-xs text-white/40">{new Date(row.created_at).toLocaleString()}</div>
              </div>
              <div className="col-span-3 font-display text-xs">{row.whatsapp}</div>
              <div className="col-span-3 font-display text-xs tracking-wider">{row.utr_number}</div>
              <div className="col-span-1 text-blood-500 font-display">{formatINR(row.plan_amount)}</div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  disabled={busyId === row.utr_id || pending}
                  onClick={() =>
                    startTransition(() => action("approve", { utr_id: row.utr_id }))
                  }
                  className="btn-blood !px-3 !py-2 text-[11px]"
                  title="Approve"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={busyId === row.utr_id || pending}
                  onClick={() =>
                    startTransition(() => action("reject", { utr_id: row.utr_id }))
                  }
                  className="btn-ghost !px-3 !py-2 text-[11px]"
                  title="Reject"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={busyId === row.user_id || pending}
                  onClick={() =>
                    startTransition(() => action("ban", { user_id: row.user_id }))
                  }
                  className="btn-ghost !px-3 !py-2 text-[11px]"
                  title="Ban"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={busyId === row.user_id || pending}
                  onClick={() =>
                    startTransition(() => action("reset", { user_id: row.user_id }))
                  }
                  className="btn-ghost !px-3 !py-2 text-[11px]"
                  title="Reset progress (God Mode)"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-xs">
          <a
            className={`btn-ghost !py-2 !px-3 ${page <= 1 ? "opacity-40 pointer-events-none" : ""}`}
            href={`?page=${Math.max(1, page - 1)}`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </a>
          <span className="label-mono">
            Page {page} / {totalPages}
          </span>
          <a
            className={`btn-ghost !py-2 !px-3 ${page >= totalPages ? "opacity-40 pointer-events-none" : ""}`}
            href={`?page=${Math.min(totalPages, page + 1)}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
