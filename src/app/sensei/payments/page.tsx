import { requireAdminPage } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SenseiPaymentsClient } from "./SenseiPaymentsClient";
import { SenseiPage } from "@/components/admin/SenseiPage";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("utr_logs")
    .select(`
      id,
      utr_number,
      plan_amount,
      status,
      created_at,
      reviewed_at,
      rejection_reason,
      user_id,
      profiles (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  const payments = (logs || []).map((log: Record<string, unknown>) => {
    const profiles = log.profiles as { full_name?: string; email?: string } | null;
    return {
      id: String(log.id),
      user_id: log.user_id,
      utr_number: log.utr_number,
      plan_amount: log.plan_amount,
      status: log.status,
      created_at: log.created_at,
      reviewed_at: log.reviewed_at,
      rejection_reason: log.rejection_reason,
      full_name: profiles?.full_name || "Unknown",
      email: profiles?.email || "Unknown"
    };
  });

  return (
    <SenseiPage
      title="Payment Ledger"
      description="Audit log of all UTR submissions and subscription activations."
      fullHeight
    >
      <SenseiPaymentsClient initialPayments={payments} />
    </SenseiPage>
  );
}
