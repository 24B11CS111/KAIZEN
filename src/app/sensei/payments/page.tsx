import { requireAdminPage } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SenseiPaymentsClient } from "./SenseiPaymentsClient";
import { SenseiPage } from "@/components/admin/SenseiPage";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  // 1. Fetch Payment Submissions
  const { data: submissions } = await supabase
    .from("payment_submissions")
    .select("id, amount, status, created_at, plan, transaction_id, user_id")
    .order("created_at", { ascending: true });

  // 2. Fetch Profiles for distribution
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, subscription_tier, created_at");

  // Calculate Aggregations
  let todaysRevenue = 0;
  let weeklyRevenue = 0;
  let monthlyRevenue = 0;
  let lifetimeRevenue = 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);

  // Group by day for charts
  const revenueByDay: Record<string, number> = {};

  (submissions || []).forEach((sub: any) => {
    if (sub.status === "approved") {
      const amt = Number(sub.amount);
      const subDate = new Date(sub.created_at);
      
      lifetimeRevenue += amt;
      if (subDate >= todayStart) todaysRevenue += amt;
      if (subDate >= weekStart) weeklyRevenue += amt;
      if (subDate >= monthStart) monthlyRevenue += amt;

      const dayKey = subDate.toISOString().split("T")[0];
      revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + amt;
    }
  });

  const chartData = Object.entries(revenueByDay).map(([date, amount]) => ({
    date,
    amount
  }));

  // Profiles Distribution
  let trialCount = 0;
  let roninCount = 0;
  let shogunCount = 0;
  let expiredCount = 0;

  (profiles || []).forEach((p: any) => {
    if (p.subscription_tier === "trial") trialCount++;
    else if (p.subscription_tier === "ronin") roninCount++;
    else if (p.subscription_tier === "shogun") shogunCount++;
    else if (p.subscription_tier === "expired") expiredCount++;
  });

  const analytics = {
    todaysRevenue,
    weeklyRevenue,
    monthlyRevenue,
    lifetimeRevenue,
    chartData,
    distribution: {
      trial: trialCount,
      ronin: roninCount,
      shogun: shogunCount,
      expired: expiredCount
    },
    submissions: submissions || []
  };

  return (
    <SenseiPage
      title="Payments & Analytics"
      description="Real-time revenue monitoring and plan distribution."
    >
      <SenseiPaymentsClient initialData={analytics} />
    </SenseiPage>
  );
}
