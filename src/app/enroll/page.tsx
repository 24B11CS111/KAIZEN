import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnrollmentFlow } from "@/components/EnrollmentFlow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EnrollPage({
  searchParams
}: {
  searchParams: { plan?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const planRaw = Number(searchParams.plan);
  const initialPlan = planRaw === 49 || planRaw === 99 ? (planRaw as 49 | 99) : undefined;

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-24 px-6">
        <div className="text-center mb-10">
          <p className="label-mono">Enrollment</p>
          <h1 className="heading text-4xl md:text-5xl mt-2">Bind your vow.</h1>
          <p className="mt-3 text-white/60 max-w-lg mx-auto">
            Three steps. One path. Once your offering is verified, the dojo opens for 30 days.
          </p>
        </div>
        <EnrollmentFlow initialPlan={initialPlan} isAuthenticated={Boolean(user)} />
      </section>
      <Footer />
    </main>
  );
}
