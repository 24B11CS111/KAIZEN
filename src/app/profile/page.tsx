import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  pending: "Pending verification",
  expired: "Expired",
  rejected: "Rejected",
  banned: "Banned"
};

const STATUS_TONE: Record<string, string> = {
  active: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  pending: "text-amber-300 border-amber-300/40 bg-amber-300/10",
  expired: "text-white/60 border-white/20 bg-white/5",
  rejected: "text-blood-500 border-blood-500/40 bg-blood-500/10",
  banned: "text-blood-500 border-blood-500/40 bg-blood-500/10"
};

function planLabel(amount: number | null | undefined) {
  if (amount === 49) return "Intermediate - ₹49";
  if (amount === 99) return "B.Tech - ₹99";
  return "Free";
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/");

  const name = profile.full_name ?? "Warrior";
  const status = profile.subscription_status ?? "pending";

  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-md">
      <header className="flex items-center gap-3 mb-6">
        <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30">
          <User className="h-5 w-5 text-blood-500" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">Profile</p>
          <h1 className="text-xl font-semibold mt-0.5">Your account</h1>
        </div>
      </header>

      <div className="card p-5 space-y-5">
        <Row label="Name" value={name} />
        <Row label="Plan" value={planLabel(profile.plan_amount)} />
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1.5">Status</div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_TONE[status]}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <LogoutButton />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1">{label}</div>
      <div className="text-base text-white">{value}</div>
    </div>
  );
}
