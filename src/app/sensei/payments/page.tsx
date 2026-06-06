import { requireAdminPage } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SenseiPaymentsClient } from "./SenseiPaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  // Fetch utr_logs with user details
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

  const payments = (logs || []).map((log: any) => ({
    id: String(log.id),
    user_id: log.user_id,
    utr_number: log.utr_number,
    plan_amount: log.plan_amount,
    status: log.status,
    created_at: log.created_at,
    reviewed_at: log.reviewed_at,
    rejection_reason: log.rejection_reason,
    full_name: log.profiles?.full_name || "Unknown",
    email: log.profiles?.email || "Unknown"
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 flex flex-col h-[calc(100svh-6rem)]">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Payment Ledger</h1>
        <p className="text-white/50 text-sm mt-1">Audit log of all UTR submissions and subscription activations.</p>
      </div>

      <div className="flex-1 min-h-0">
        <SenseiPaymentsClient initialPayments={payments} />
      </div>
    </div>
  );
}
