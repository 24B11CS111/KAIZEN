import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, ShieldCheck, CreditCard, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SenseiOverviewPage() {
  await requireAdminPage();
  const supabase = createSupabaseServerClient();

  // Fetch only what we need for Overview
  const [profilesRes, paymentsRes] = await Promise.all([
    supabase.from("profiles").select("id, is_suspended, subscription_status, subscription_tier"),
    supabase.from("utr_logs").select("id, status, plan_amount")
  ]);

  const profiles = profilesRes.data || [];
  const payments = paymentsRes.data || [];

  const totalUsers = profiles.length;
  const activeTrials = profiles.filter((p: any) => p.subscription_tier === "trial").length;
  const coreUsers = profiles.filter((p: any) => p.subscription_tier === "core").length;
  const eliteUsers = profiles.filter((p: any) => p.subscription_tier === "elite").length;
  const pendingApprovals = payments.filter((p: any) => p.status === "pending").length;
  const totalRevenue = payments
    .filter((p: any) => p.status === "approved")
    .reduce((sum: number, p: any) => sum + Number(p.plan_amount || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-white/50 text-sm mt-1">High-level telemetry for the KAIZEN platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          value={`₹${totalRevenue.toLocaleString()}`} 
          icon={<CreditCard className="h-5 w-5 text-emerald-400" />} 
          href="/sensei/payments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ActionCard title="User CRM" desc="Manage users" href="/sensei/users" icon={<Users />} />
            <ActionCard title="View Analytics" desc="Growth metrics" href="/sensei/analytics" icon={<TrendingUp />} />
            <ActionCard title="Live Radar" desc="Realtime activity" href="/sensei/activity" icon={<Activity />} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">System Status</h2>
          </div>
          <div className="space-y-4">
            <StatusRow label="Database Connection" status="Operational" />
            <StatusRow label="Realtime Websockets" status="Operational" />
            <StatusRow label="Payment Webhooks" status="Operational" />
            <StatusRow label="AI Engine" status="Operational" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, alert, href }: { title: string, value: string | number, icon: any, alert?: boolean, href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors relative group overflow-hidden">
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-blood-500/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>}
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-white/50">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </Link>
  );
}

function ActionCard({ title, desc, href, icon }: { title: string, desc: string, href: string, icon: any }) {
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

function StatusRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-medium text-emerald-400">{status}</span>
      </div>
    </div>
  );
}

import { Zap } from "lucide-react";
