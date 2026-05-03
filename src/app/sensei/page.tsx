import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminPanel } from "@/components/AdminPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function SenseiPage({
  searchParams
}: {
  searchParams: { page?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sensei");

  // Defense-in-depth: middleware already enforces, but verify here too
  const { data: me } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "admin" || me.email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    redirect("/");
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Pull pending UTR rows, joined with profile (admin RLS allows)
  const { data: utrs, count } = await supabase
    .from("utr_logs")
    .select("id, user_id, utr_number, plan_amount, created_at, profiles!inner(full_name, whatsapp)", {
      count: "exact"
    })
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .range(from, to);

  const rows = (utrs ?? []).map((u: any) => ({
    utr_id: u.id,
    user_id: u.user_id,
    utr_number: u.utr_number,
    plan_amount: u.plan_amount,
    created_at: u.created_at,
    full_name: u.profiles?.full_name ?? null,
    whatsapp: u.profiles?.whatsapp ?? null
  }));

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <p className="label-mono">Sensei · Admin</p>
              <h1 className="heading text-4xl mt-2">The Council Chamber</h1>
              <p className="text-white/55 text-sm mt-2">
                {count ?? 0} offering{count === 1 ? "" : "s"} await your judgment.
              </p>
            </div>
          </div>
          <AdminPanel
            initialPending={rows}
            page={page}
            pageSize={PAGE_SIZE}
            total={count ?? 0}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
