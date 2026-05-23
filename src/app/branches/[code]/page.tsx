import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Compass, Sparkles, Briefcase, Target, GraduationCap,
  Award, Hammer, Zap, ChevronRight
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listBranches, getRoadmap, listSemesters,
  listMissions, listCertifications, listProjects, listSkills
} from "@/lib/content";

export const dynamic = "force-dynamic";

interface Props {
  params: { code: string };
}

export default async function BranchDetailPage({ params }: Props) {
  const code = params.code.toUpperCase();
  const supabase = createSupabaseServerClient();
  const branches = await listBranches(supabase as any);
  const branch = branches.find((b) => b.code === code);
  if (!branch) notFound();

  const roadmap = await getRoadmap(supabase as any, code);
  const [semesters, skills, missions, certs, projects] = await Promise.all([
    roadmap ? listSemesters(supabase as any, roadmap.id) : Promise.resolve([]),
    listSkills(supabase as any, code),
    listMissions(supabase as any, code),
    listCertifications(supabase as any, code),
    listProjects(supabase as any, code)
  ]);

  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-4xl space-y-8">
      {/* Hero / identity */}
      <section className="card p-5 sm:p-6 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-blood-500/15 blur-3xl pointer-events-none"
        />
        <div className="relative">
          <Link
            href="/branches"
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/55 hover:text-white"
          >
            <ChevronRight className="h-3 w-3 rotate-180" /> All branches
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <Compass className="h-4 w-4 text-blood-500" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">{branch.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">{branch.name}</h1>
          {branch.tagline && (
            <p className="text-sm text-white/75 mt-2 italic">{branch.tagline}</p>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IdentityRow icon={Sparkles} label="Purpose" body={branch.purpose} />
            <IdentityRow icon={Briefcase} label="Career" body={branch.career_direction} />
            <IdentityRow icon={Target} label="Industry" body={branch.industry_focus} />
            <IdentityRow icon={Zap} label="Transformation" body={branch.transformation_goal} />
          </div>
        </div>
      </section>

      {/* Roadmap */}
      {roadmap && semesters.length > 0 && (
        <section>
          <SectionHeader icon={GraduationCap} title="Roadmap" subtitle={roadmap.title} />
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {semesters.map((s) => (
              <li key={s.id} className="card p-3.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">
                    Sem {s.number}
                  </span>
                </div>
                <div className="text-sm font-semibold mt-1">{s.title}</div>
                {s.theme && <div className="text-xs text-white/55 mt-1">{s.theme}</div>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Skill tree */}
      {skills.length > 0 && (
        <section>
          <SectionHeader icon={Sparkles} title="Skill tree" subtitle={skills.length + " core skills"} />
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {skills.map((s) => (
              <li key={s.id} className="card p-3 text-center">
                <div className="text-sm font-semibold">{s.name}</div>
                {s.description && (
                  <div className="text-[11px] text-white/55 mt-1 leading-snug line-clamp-2">{s.description}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Daily missions */}
      {missions.length > 0 && (
        <section>
          <SectionHeader icon={Target} title="Daily missions" subtitle={missions.length + " mission templates"} />
          <ul className="space-y-2">
            {missions.map((m) => (
              <li key={m.id} className="card p-3 flex items-start gap-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold shrink-0 w-20 mt-0.5">
                  {m.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{m.title}</div>
                  {m.description && (
                    <div className="text-xs text-white/55 mt-0.5 leading-relaxed">{m.description}</div>
                  )}
                </div>
                <span className="text-[11px] text-white/65 tabular-nums shrink-0">+{m.xp_reward} XP</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <section>
          <SectionHeader icon={Award} title="Certifications" subtitle={certs.length + " curated paths"} />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {certs.map((c) => (
              <li key={c.id} className="card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">
                      {c.provider}
                    </div>
                    <div className="text-sm font-semibold mt-0.5">{c.name}</div>
                    <div className="text-[11px] text-white/55 mt-1">
                      {c.difficulty} - ~{c.estimated_hours}h
                    </div>
                  </div>
                  <span className="text-[11px] tabular-nums shrink-0">+{c.xp_reward} XP</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <SectionHeader icon={Hammer} title="Project missions" subtitle={projects.length + " build deliverables"} />
          <ol className="space-y-2">
            {projects.map((p) => (
              <li key={p.id} className="card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{p.title}</div>
                    {p.description && (
                      <div className="text-xs text-white/55 mt-1 leading-relaxed">{p.description}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{p.difficulty}</div>
                    <div className="text-[11px] tabular-nums mt-0.5">+{p.xp_reward} XP</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}

function IdentityRow({
  icon: Icon, label, body
}: { icon: any; label: string; body: string | null }) {
  if (!body) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid place-items-center h-7 w-7 rounded-md bg-blood-500/10 border border-blood-500/30 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-blood-500" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</div>
        <div className="text-xs text-white/85 mt-0.5 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon, title, subtitle
}: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <Icon className="h-4 w-4 text-blood-500 self-center" />
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 ml-auto">{subtitle}</span>}
    </div>
  );
}
