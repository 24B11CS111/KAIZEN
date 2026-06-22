import { requireAdminPage } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSenseiFetch } from "@/lib/senseiLog";
import { AdminApprovalList, type PaymentSubmissionRow } from "@/components/AdminApprovalList";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { SenseiPage } from "@/components/admin/SenseiPage";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  let pendingRows: PaymentSubmissionRow[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from("payment_submissions")
      .select("id, user_id, plan, amount, transaction_id, payment_screenshot, created_at, status, profiles!payment_submissions_user_id_fkey(full_name, whatsapp)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[sensei approvals]", error);
      logSenseiFetch("approvals/payment_submissions", error);
      fetchError = `Unable to load pending approvals: ${error.message || JSON.stringify(error)}`;
    } else {
      pendingRows = (data ?? []).map((row: any) => {
        const profile = row.profiles as { full_name?: string | null; whatsapp?: string | null } | null;
        return {
          id: String(row.id),
          user_id: String(row.user_id),
          plan: String(row.plan),
          amount: Number(row.amount),
          transaction_id: String(row.transaction_id),
          payment_screenshot: String(row.payment_screenshot),
          status: row.status as "pending" | "approved" | "rejected",
          created_at: String(row.created_at ?? new Date().toISOString()),
          full_name: profile?.full_name ?? null,
          whatsapp: profile?.whatsapp ?? null
        };
      });
    }
  } catch (err: any) {
    console.error("[sensei approvals]", err);
    logSenseiFetch("approvals/payment_submissions", err);
    fetchError = `Unable to load pending approvals: ${err.message || String(err)}`;
  }

  return (
    <SenseiPage
      title="Payment Approvals"
      description="Review and approve pending payment submissions in real-time."
    >
      {fetchError && (
        <div className="rounded-2xl border border-blood-500/20 bg-blood-500/[0.04] p-4 text-sm text-blood-400">
          {fetchError} The dashboard will continue to load with an empty queue.
        </div>
      )}

      {!fetchError && (
        <ErrorBoundary name="Approvals">
          <AdminApprovalList initialRows={pendingRows} />
        </ErrorBoundary>
      )}
    </SenseiPage>
  );
}
