import { requireAdminPage } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSenseiFetch } from "@/lib/senseiLog";
import { AdminApprovalList, type PendingRow } from "@/components/AdminApprovalList";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { SenseiPage } from "@/components/admin/SenseiPage";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  let pendingRows: PendingRow[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from("utr_logs")
      .select("id, user_id, utr_number, plan_amount, created_at, profiles!utr_logs_user_id_fkey(full_name, whatsapp)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[sensei approvals]", error);
      logSenseiFetch("approvals/utr_logs", error);
      fetchError = `Unable to load pending approvals: ${error.message || JSON.stringify(error)}`;
    } else {
      pendingRows = (data ?? []).map((row: Record<string, unknown>) => {
        const profile = row.profiles as { full_name?: string | null; whatsapp?: string | null } | null;
        return {
          utr_id: String(row.id),
          user_id: String(row.user_id),
          utr_number: String(row.utr_number ?? ""),
          plan_amount: Number(row.plan_amount ?? 0),
          created_at: String(row.created_at ?? new Date().toISOString()),
          full_name: profile?.full_name ?? null,
          whatsapp: profile?.whatsapp ?? null
        };
      });
    }
  } catch (err: any) {
    console.error("[sensei approvals]", err);
    logSenseiFetch("approvals/utr_logs", err);
    fetchError = `Unable to load pending approvals: ${err.message || String(err)}`;
  }

  return (
    <SenseiPage
      title="Payment Approvals"
      description="Review and approve pending UTR submissions."
    >
      {fetchError && (
        <div className="rounded-2xl border border-blood-500/20 bg-blood-500/[0.04] p-4 text-sm text-blood-400">
          {fetchError} The dashboard will continue to load with an empty queue.
        </div>
      )}

      {!fetchError && pendingRows.length === 0 && (
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 text-center">
          <p className="text-white/50 text-sm font-medium">All caught up. No pending approvals.</p>
        </div>
      )}

      {!fetchError && pendingRows.length > 0 && (
        <ErrorBoundary name="Approvals">
          <AdminApprovalList rows={pendingRows} />
        </ErrorBoundary>
      )}
    </SenseiPage>
  );
}
