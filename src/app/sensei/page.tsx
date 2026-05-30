import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  SenseiVerificationDashboard,
  type SenseiPendingRow
} from "@/components/SenseiVerificationDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminEmail";
import { isAuthBypassed } from "@/lib/devBypass";

export const dynamic = "force-dynamic";

async function loadStats(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const [{ count: pending }, { count: approved }, { count: rejected }] = await Promise.all([
    supabase.from("utr_logs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("utr_logs").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("utr_logs").select("id", { count: "exact", head: true }).eq("status", "rejected")
  ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    rejected: rejected ?? 0
  };
}

export default async function SenseiPage() {
  const supabase = createSupabaseServerClient();
  const bypass = isAuthBypassed();

  if (!bypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login?next=/sensei");

    const { data: me } = await supabase
      .from("profiles")
      .select("role,is_admin,email")
      .eq("id", user.id)
      .maybeSingle();
    const p: any = me;
    if (!p || !(p.role === "admin" || p.is_admin === true) || !isAdminEmail(p.email)) {
      redirect("/");
    }
  }

  const [stats, pendingRes] = await Promise.all([
    loadStats(supabase),
    supabase
      .from("utr_logs")
      .select(
        "id,user_id,utr_number,plan_amount,created_at,status,rejection_reason,profiles!inner(full_name,email,whatsapp,subscription_status,expiry_date)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true })
  ]);

  const rows: SenseiPendingRow[] = ((pendingRes.data as any[]) ?? []).map((row: any) => ({
    utr_id: row.id,
    user_id: row.user_id,
    full_name: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? null,
    whatsapp: row.profiles?.whatsapp ?? null,
    utr_number: row.utr_number,
    plan_amount: row.plan_amount,
    created_at: row.created_at,
    subscription_status: row.profiles?.subscription_status ?? row.status ?? "pending",
    expiry_date: row.profiles?.expiry_date ?? null
  }));

  return (
    <main className="min-h-[100svh] bg-obsidian">
      <Navbar />
      <section className="container-app pt-24 pb-bottom-nav">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blood-500/25 bg-blood-500/[0.08] shadow-[0_0_24px_-12px_rgba(208,0,0,0.6)]">
                <ShieldCheck className="h-5 w-5 text-blood-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Sensei Verification System</p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Council chamber</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                  Review pending UTR submissions, activate 30-day subscriptions, reject fake proofs,
                  and manage access with full control.
                </p>
              </div>
            </div>
          </header>

          <SenseiVerificationDashboard initialPending={rows} stats={stats} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
