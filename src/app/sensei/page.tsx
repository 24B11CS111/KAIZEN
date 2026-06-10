import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, ShieldCheck, CreditCard, Activity, TrendingUp, Zap } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { logSenseiFetch } from "@/lib/senseiLog";
import { SenseiPage } from "@/components/admin/SenseiPage";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SenseiOverviewPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  let profiles: Record<string, unknown>[] = [];
  let payments: Record<string, unknown>[] = [];
  let fetchError: string | null = null;

  try {
    const [profilesRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("id, is_suspended, subscription_status, subscription_tier"),
      supabase.from("utr_logs").select("id, status, plan_amount")
    ]);

    if (profilesRes.error) {
      logSenseiFetch("overview/profiles", profilesRes.error);
      fetchError = "Some overview metrics are unavailable.";
    } else {
      profiles = (profilesRes.data ?? []) as Record<string, unknown>[];
    }

    if (paymentsRes.error) {
      logSenseiFetch("overview/utr_logs", paymentsRes.error);
      fetchError = "Some overview metrics are unavailable.";
    } else {
      payments = (paymentsRes.data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    logSenseiFetch("overview", err);
    fetchError = "Some overview metrics are unavailable.";
  }

  const activeTrials = profiles.filter((p) => p.subscription_tier === "trial").length;
  const coreUsers = profiles.filter((p) => p.subscription_tier === "core").length;
  const eliteUsers = profiles.filter((p) => p.subscription_tier === "elite").length;
  const pendingApprovals = payments.filter((p) => p.status === "pending").length;
  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum: number, p) => sum + Number(p.plan_amount || 0), 0);

  return (
    <SenseiPage
      title="System Overview"
      description="High-level telemetry for the KAIZEN platform."
      className="space-y-8"
    >
      {fetchError && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-200/80">
          {fetchError}
        </div>
      )}

      <div className="sensei-stat-grid">
        <StatCard
          title="Active Trials"
          value={activeTrials}
          icon={<Zap className="h-5 w-5 text-blue-400" />}
          href="/sensei/users"
        />
        <StatCard
          title="KAIZEN ELITE"
          value={eliteUsers}
          icon={<ShieldCheck className="h-5 w-5 text-blood-500" />}
          href="/sensei/users"
        />
        <StatCard
          title="KAIZEN CORE"
          value={coreUsers}
          icon={<Users className="h-5 w-5 text-purple-400" />}
          href="/sensei/users"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          icon={<CreditCard className="h-5 w-5 text-emerald-400" />}
          href="/sensei/payments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
        <div className="sensei-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <ActionCard title="User CRM" desc="Manage users" href="/sensei/users" icon={<Users />} />
            <ActionCard title="View Analytics" desc="Growth metrics" href="/sensei/analytics" icon={<TrendingUp />} />
            <ActionCard title="Live Radar" desc="Realtime activity" href="/sensei/activity" icon={<Activity />} />
            <ActionCard
              title="Approvals"
              desc={pendingApprovals > 0 ? `${pendingApprovals} pending` : "All clear"}
              href="/sensei/approvals"
              icon={<ShieldCheck />}
            />
          </div>
        </div>

        <div className="sensei-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">System Status</h2>
          </div>
          <div className="space-y-4">
            <StatusRow label="Database Connection" status={fetchError ? "Degraded" : "Operational"} degraded={!!fetchError} />
            <StatusRow label="Realtime Websockets" status="Operational" />
            <StatusRow label="Payment Webhooks" status="Operational" />
            <StatusRow label="AI Engine" status="Operational" />
          </div>
        </div>
      </div>
    </SenseiPage>
  );
}

function StatCard({ title, value, icon, href }: { title: string; value: string | number; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="block sensei-panel p-5 hover:bg-white/[0.04] transition-colors relative group overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-white/50">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </Link>
  );
}

function ActionCard({ title, desc, href, icon }: { title: string; desc: string; href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-4 hover:bg-white/5 transition-colors group">
      <div className="text-white/40 group-hover:text-white transition-colors [&>svg]:w-5 [&>svg]:h-5 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/40 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

function StatusRow({ label, status, degraded }: { label: string; status: string; degraded?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${degraded ? "bg-amber-400" : "bg-emerald-400"}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${degraded ? "bg-amber-500" : "bg-emerald-500"}`}></span>
        </span>
        <span className={`text-xs font-medium ${degraded ? "text-amber-400" : "text-emerald-400"}`}>{status}</span>
      </div>
    </div>
  );
}
