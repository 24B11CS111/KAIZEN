import { requireAdminPage } from "@/lib/admin";
import { getSenseiDirectoryUsers } from "@/lib/adminData";
import { SenseiAnalyticsClient } from "./SenseiAnalyticsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSenseiFetch } from "@/lib/senseiLog";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();
  const users = await getSenseiDirectoryUsers();

  let payments: Record<string, unknown>[] = [];
  let fetchError: string | null = null;

  try {
    const paymentsRes = await supabase
      .from("utr_logs")
      .select("id, status, plan_amount, created_at, reviewed_at");

    if (paymentsRes.error) {
      logSenseiFetch("analytics/utr_logs", paymentsRes.error);
      fetchError = "Revenue analytics are temporarily unavailable.";
    } else {
      payments = (paymentsRes.data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    logSenseiFetch("analytics", err);
    fetchError = "Revenue analytics are temporarily unavailable.";
  }

  const approvedPayments = payments.filter((p) => p.status === "approved");
  const totalRevenue = approvedPayments.reduce((sum: number, p) => sum + Number(p.plan_amount || 0), 0);

  const activeSubscribers = users.filter((u) => u.subscription_status === "active").length;

  const branchCounts = new Map<string, number>();
  for (const u of users) {
    const key = u.branch || "Unassigned";
    branchCounts.set(key, (branchCounts.get(key) || 0) + 1);
  }

  const branchDistribution = Array.from(branchCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const planDistribution = [
    { label: "Free", value: users.filter((u) => !u.plan_amount).length },
    { label: "Rs 49", value: users.filter((u) => u.plan_amount === 49).length },
    { label: "Rs 99", value: users.filter((u) => u.plan_amount === 99).length }
  ];

  const now = new Date();

  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = month.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const monthRevenue = approvedPayments
      .filter((p) => {
        const d = p.reviewed_at ? new Date(String(p.reviewed_at)) : p.created_at ? new Date(String(p.created_at)) : null;
        return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      })
      .reduce((sum: number, p) => sum + Number(p.plan_amount || 0), 0);
    return { label, value: monthRevenue };
  });

  const usersGrowth = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = month.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const count = users.filter((u) => {
      if (!u.joined_at) return false;
      const d = new Date(u.joined_at);
      return d <= new Date(month.getFullYear(), month.getMonth() + 1, 0);
    }).length;
    return { label, value: count };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Reports</h1>
        <p className="text-white/50 text-sm mt-1">Growth metrics, retention analytics, and platform health.</p>
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-200/80">
          {fetchError} User metrics are still shown below.
        </div>
      )}

      <ErrorBoundary name="Analytics Charts">
        <SenseiAnalyticsClient
          totalRevenue={totalRevenue}
          activeSubscribers={activeSubscribers}
          branchDistribution={branchDistribution}
          planDistribution={planDistribution}
          monthlyRevenue={monthlyRevenue}
          usersGrowth={usersGrowth}
        />
      </ErrorBoundary>
    </div>
  );
}
