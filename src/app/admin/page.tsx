import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminEmail";
import { AdminApprovalList, type PendingRow } from "@/components/AdminApprovalList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/admin");

  // Admin gate: email must match ADMIN_EMAIL (defaults to hrixofficial@gmail.com).
  // Role check is defense-in-depth.
  const { data: me } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .maybeSingle();

  const p: any = me;
  if (!p || !isAdminEmail(user.email) || p.role !== "admin") {
    redirect("/");
  }

  // Pending UTR rows joined with the profile for name + whatsapp.
  const { data: utrs } = await supabase
    .from("utr_logs")
    .select(
      "id, user_id, utr_number, plan_amount, created_at, profiles!inner(full_name, whatsapp)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows: PendingRow[] = ((utrs as any[]) ?? []).map((u: any) => ({
    utr_id: u.id,
    user_id: u.user_id,
    utr_number: u.utr_number,
    plan_amount: u.plan_amount,
    created_at: u.created_at,
    full_name: u.profiles?.full_name ?? null,
    whatsapp: u.profiles?.whatsapp ?? null
  }));

  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-3xl">
      <header className="flex items-center gap-3 mb-6">
        <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30">
          <ShieldCheck className="h-5 w-5 text-blood-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">Admin</p>
          <h1 className="text-xl font-semibold mt-0.5">Pending approvals</h1>
        </div>
        <span className="text-[11px] text-white/55">{rows.length} pending</span>
      </header>

      {rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-white/65">No pending submissions.</p>
          <p className="text-xs text-white/40 mt-1">New UTRs will appear here automatically.</p>
        </div>
      ) : (
        <AdminApprovalList rows={rows} />
      )}

      <p className="mt-8 text-center">
        <Link href="/sensei" className="text-[11px] uppercase tracking-[0.18em] text-white/45 hover:text-white">
          Open full Sensei panel
        </Link>
      </p>
    </main>
  );
}
