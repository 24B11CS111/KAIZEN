import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listBranches } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const supabase = createSupabaseServerClient();
  const branches = await listBranches(supabase as any);

  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-4xl">
      <header className="flex items-center gap-3 mb-6">
        <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30">
          <Compass className="h-5 w-5 text-blood-500" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">Branches</p>
          <h1 className="text-xl sm:text-2xl font-semibold mt-0.5">Choose your path</h1>
        </div>
      </header>

      <p className="text-sm text-white/65 mb-6">
        Each branch is a complete operating system - identity, roadmap, daily missions, certifications, and projects.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {branches.map((b) => (
          <li key={b.code}>
            <Link
              href={"/branches/" + b.code.toLowerCase()}
              className="card p-4 block hover:border-blood-500/45 transition-colors h-full group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">
                      {b.code}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold mt-1 truncate">{b.name}</h2>
                  {b.tagline && (
                    <p className="text-xs text-white/65 mt-1.5 leading-relaxed">{b.tagline}</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-blood-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
