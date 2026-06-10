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
      .select("id, user_id, utr_number, plan_amount, created_at, profiles(full_name, whatsapp)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      logSenseiFetch("approvals/utr_logs", error);
      fetchError = "Unable to load pending approvals.";
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
  } catch (err) {
    logSenseiFetch("approvals/utr_logs", err);
    fetchError = "Unable to load pending approvals.";
  }

  return (
    <SenseiPage
      title="Payment Approvals"
      description="Review and approve pending UTR submissions."
    >
      {fetchError && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-200/80">
          {fetchError} The dashboard will continue to load with an empty queue.
        </div>
      )}

      <ErrorBoundary name="Approvals">
        <AdminApprovalList rows={pendingRows} />
      </ErrorBoundary>
    </SenseiPage>
  );
}
