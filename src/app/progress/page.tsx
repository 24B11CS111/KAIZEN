import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Flame, Check, Sparkles, ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 30;

export default async function ProgressPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/progress");

  const [{ data: progress }, { data: streak }] = await Promise.all([
    supabase.from("user_progress").select("day, completed").eq("user_id", user.id),
    supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle()
  ]);

  const completedDays = new Set(
    (progress ?? []).filter((p: any) => p.completed).map((p: any) => p.day)
  );
  const completedCount = completedDays.size;
  const pct = Math.round((completedCount / TOTAL_DAYS) * 100);
  const currentStreak = streak?.current_streak ?? 0;
  const dayNumbers = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

  return (
    <main className="container-app pt-10 pb-bottom-nav max-w-md">
      <header className="flex items-center gap-3 mb-6">
        <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30">
          <BarChart3 className="h-5 w-5 text-blood-500" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">Progress</p>
          <h1 className="text-xl font-semibold mt-0.5">Your journey</h1>
        </div>
      </header>

      {completedCount === 0 && (
        <section className="card p-5 mb-4 border-blood-500/30 flex items-center gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/15 border border-blood-500/40 shrink-0">
            <Sparkles className="h-5 w-5 text-blood-500" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Start your journey</div>
            <div className="text-xs text-white/60 mt-0.5">Complete Day 1 to begin your streak.</div>
          </div>
          <Link
            href="/dojo"
            className="text-blood-500 inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap"
          >
            Go <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      )}

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Completed</div>
            <div className="mt-1 text-3xl font-semibold leading-none">
              {completedCount}
              <span className="text-white/40 text-base"> / {TOTAL_DAYS}</span>
            </div>
          </div>
          <div className="text-sm text-white/65">{pct}%</div>
        </div>
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-blood-500 transition-all duration-500 ease-out"
            style={{ width: pct + "%" }}
          />
        </div>
      </section>

      <section className="card p-5 mt-4 flex items-center gap-4">
        <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/15 border border-blood-500/40">
          <Flame className="h-5 w-5 text-blood-500" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Current streak</div>
          <div className="text-2xl font-semibold leading-none mt-1">
            {currentStreak}{" "}
            <span className="text-sm text-white/55">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-2">
          Days completed
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {dayNumbers.map((day) => {
            const done = completedDays.has(day);
            const cls = done
              ? "bg-blood-500/20 border-blood-500/55 text-white"
              : "border-white/10 text-white/35";
            return (
              <div
                key={day}
                className={"aspect-square rounded-md border grid place-items-center text-[11px] font-medium " + cls}
              >
                {done ? <Check className="h-3.5 w-3.5 text-blood-500" /> : day}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
