"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }
  })
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-28">
      <div className="container-page grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Left: copy */}
        <div className="lg:col-span-7">
          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={0}
            className="eyebrow mb-6"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blood-500" />
            For Intermediate &amp; Engineering students
          </motion.div>

          <motion.h1
            variants={fade}
            initial="hidden"
            animate="show"
            custom={1}
            className="h1"
          >
            Discipline builds <br className="hidden md:block" />
            your <span className="text-blood-500">future</span>.
          </motion.h1>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            custom={2}
            className="lead mt-6 max-w-xl"
          >
            A structured 30-day system for Intermediate and Engineering students
            to become industry-ready. Pay once via UPI, train daily, ascend.
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href="/enroll" className="btn-primary">
              Begin Your Path <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dojo" className="btn-secondary">
              View Dojo
            </Link>
          </motion.div>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-12 flex items-center gap-8 text-sm text-white/55"
          >
            <div>
              <div className="text-white text-2xl font-semibold">30 days</div>
              <div className="text-xs mt-1">Per cycle</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-white text-2xl font-semibold">12 tracks</div>
              <div className="text-xs mt-1">Inter + Engineering</div>
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-white text-2xl font-semibold">UPI</div>
              <div className="text-xs mt-1">No card needed</div>
            </div>
          </motion.div>
        </div>

        {/* Right: minimal product mock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="card p-5 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blood-500 pulse-dot" />
                <span className="text-xs text-white/60">Today, Day 7</span>
              </div>
              <span className="text-xs text-white/50">7 / 30</span>
            </div>

            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "23%" }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-blood-500"
              />
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const done = d <= 6;
                const today = d === 7;
                const cls = done
                  ? "bg-blood-500/20 border-blood-500/50 text-white"
                  : today
                  ? "border-blood-500/60 text-white"
                  : "border-white/8 text-white/30";
                return (
                  <div
                    key={d}
                    className={"aspect-square rounded-md border text-[10px] grid place-items-center " + cls}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <div className="text-white/55">Streak</div>
              <div className="text-white font-medium">6 days</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
