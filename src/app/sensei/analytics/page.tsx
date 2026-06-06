import { requireAdminPage } from "@/lib/admin";
import { getSenseiDirectoryUsers } from "@/lib/adminData";
import { SenseiAnalyticsClient } from "./SenseiAnalyticsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();
  const users = await getSenseiDirectoryUsers();

  const [paymentsRes, logsRes] = await Promise.all([
    supabase.from("utr_logs").select("id, status, plan_amount, created_at, reviewed_at"),
    supabase.from("daily_logs").select("id, user_id, completed, completed_at, created_at"),
  ]);

  const payments = paymentsRes.data || [];
  const logs = logsRes.data || [];

  // Generate basic analytics server-side
  const approvedPayments = payments.filter((p: any) => p.status === "approved");
  const totalRevenue = approvedPayments.reduce((sum: number, p: any) => sum + Number(p.plan_amount || 0), 0);
  
  const activeSubscribers = users.filter((u: any) => u.subscription_status === "active").length;
  
  const branchCounts = new Map<string, number>();
  for (const u of users) {
    const key = u.branch || "Unassigned";
    branchCounts.set(key, (branchCounts.get(key) || 0) + 1);
  }
  
  const branchDistribution = Array.from(branchCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const planDistribution = [
    { label: "Free", value: users.filter((u: any) => !u.plan_amount).length },
    { label: "Rs 49", value: users.filter((u: any) => u.plan_amount === 49).length },
    { label: "Rs 99", value: users.filter((u: any) => u.plan_amount === 99).length }
  ];

  const now = new Date();
  
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = month.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const monthRevenue = approvedPayments.filter((p: any) => {
      const d = p.reviewed_at ? new Date(p.reviewed_at) : p.created_at ? new Date(p.created_at) : null;
      return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    }).reduce((sum: number, p: any) => sum + Number(p.plan_amount || 0), 0);
    return { label, value: monthRevenue };
  });

  const usersGrowth = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = month.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const count = users.filter((u: any) => {
      if (!u.joined_at) return false;
      const d = new Date(u.joined_at);
      return d <= new Date(month.getFullYear(), month.getMonth() + 1, 0); // up to end of month
    }).length;
    return { label, value: count };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Reports</h1>
        <p className="text-white/50 text-sm mt-1">Growth metrics, retention analytics, and platform health.</p>
      </div>

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
