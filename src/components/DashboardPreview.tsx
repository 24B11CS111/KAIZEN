"use client";
import { motion } from "framer-motion";
import { Check, Lock, Flame } from "lucide-react";

export function DashboardPreview() {
  // Imagine the user is on day 8, has completed days 1-7
  const TODAY = 8;
  const COMPLETED = 7;

  return (
    <section className="section">
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="eyebrow">Your Dojo</p>
            <h2 className="h2 mt-3">A real product, not a course list.</h2>
            <p className="lead mt-4">
              Your dashboard tracks every day of the cycle. Skip a day and the streak resets.
              Complete the day and the next door opens.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 mt-0.5 text-blood-500 shrink-0" />
                Day 1 to Day 30 drip &mdash; one tier at a time.
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 mt-0.5 text-blood-500 shrink-0" />
                Streak counter &amp; longest-streak record.
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 mt-0.5 text-blood-500 shrink-0" />
                Hard lock on day 31 &mdash; no partial extensions.
              </li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="card p-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs text-white/50">Welcome back, Anurag</div>
                  <div className="text-lg font-semibold mt-0.5">Day {TODAY} of 30</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blood-500/10 border border-blood-500/30">
                  <Flame className="h-4 w-4 text-blood-500" />
                  <span className="text-sm font-medium">{COMPLETED} day streak</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-white/55 mb-2">
                <span>Progress</span>
                <span>{COMPLETED} / 30</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: ((COMPLETED / 30) * 100) + "%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-blood-500"
                />
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                  const done = d <= COMPLETED;
                  const today = d === TODAY;
                  const locked = d > TODAY;
                  const cls = done
                    ? "bg-blood-500/20 border-blood-500/55 text-white"
                    : today
                    ? "border-blood-500/70 text-white"
                    : locked
                    ? "border-white/8 text-white/30"
                    : "border-white/15 text-white/70";
                  return (
                    <div
                      key={d}
                      className={"aspect-square rounded-md border grid place-items-center text-[11px] font-medium " + cls}
                    >
                      {locked ? (
                        <Lock className="h-3 w-3" />
                      ) : done ? (
                        <Check className="h-3 w-3 text-blood-500" />
                      ) : (
                        <span>{d}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer chips */}
              <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-white/50">Cycle expires</div>
                  <div className="text-white font-medium mt-1">22 days</div>
                </div>
                <div>
                  <div className="text-white/50">Tier</div>
                  <div className="text-white font-medium mt-1">Elite</div>
                </div>
                <div>
                  <div className="text-white/50">Plan</div>
                  <div className="text-white font-medium mt-1">&#8377;99 / month</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
