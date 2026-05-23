"use client";

/**
 * KAIZEN.SYS — Hero (cinematic premium edition)
 *
 * Full-viewport split layout. Left: dominant typography + CTAs +
 * trust row. Right: layered dashboard mockup with floating widgets,
 * glow rings, ambient depth. No design-token changes — all built
 * from existing KAIZEN utilities.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Flame, Sparkles, Trophy, Check,
  Shield, Dumbbell, Brain, Zap
} from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }
  })
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-28 min-h-[100svh] flex items-center">

      {/* ===== AMBIENT BACKDROP — radial gradients + spotlight ===== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-1/3 -left-1/4 h-[80vmin] w-[80vmin] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(208,0,0,0.18), transparent 60%)" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[70vmin] w-[70vmin] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(208,0,0,0.10), transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)"
          }}
        />
      </div>

      <div className="container-page grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center relative">

        {/* ===== LEFT — dominant copy ===== */}
        <div className="lg:col-span-7 relative z-10">
          <motion.div
            variants={fade} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-blood-500/35 bg-blood-500/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.20em] text-blood-500 font-semibold backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blood-500 pulse-dot" />
            AI-powered discipline OS · For B.Tech students
          </motion.div>

          <motion.h1
            variants={fade} initial="hidden" animate="show" custom={1}
            className="mt-7 text-[44px] sm:text-[56px] lg:text-[72px] xl:text-[80px] leading-[1.02] font-semibold tracking-[-0.03em]"
          >
            Discipline builds
            <br />
            your <span className="relative inline-block">
              <span className="text-blood-500">future</span>
              <span aria-hidden className="absolute -inset-x-2 -inset-y-1 -z-10 blur-2xl bg-blood-500/30 rounded-full" />
            </span>.
          </motion.h1>

          <motion.p
            variants={fade} initial="hidden" animate="show" custom={2}
            className="mt-6 text-[15px] sm:text-base lg:text-lg text-white/65 leading-relaxed max-w-xl"
          >
            A 30-day execution system that turns chaotic learning into daily
            disciplined missions — study, build, train. Personalized for your
            branch and goal. Forged for the warrior in you.
          </motion.p>

          <motion.div
            variants={fade} initial="hidden" animate="show" custom={3}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/auth/signup"
              className="btn-primary btn-tap inline-flex items-center gap-2 px-5 py-3.5 text-[14px] font-semibold shadow-[0_0_30px_-4px_rgba(208,0,0,0.7)] hover:shadow-[0_0_42px_-2px_rgba(208,0,0,0.85)] transition-shadow"
            >
              Begin your path
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-tap inline-flex items-center gap-2 px-5 py-3.5 text-[14px] font-semibold text-white/80 hover:text-white border border-white/12 hover:border-white/25 rounded-md bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              Already in the dojo · Sign in
            </Link>
          </motion.div>

          {/* trust indicators */}
          <motion.div
            variants={fade} initial="hidden" animate="show" custom={4}
            className="mt-10 flex items-center gap-6 text-[11px] text-white/55"
          >
            <TrustItem icon={Shield}   label="UPI verified" />
            <TrustItem icon={Brain}    label="AI personalized" />
            <TrustItem icon={Dumbbell} label="Body + mind" />
            <TrustItem icon={Zap}      label="Real-time tracking" />
          </motion.div>

          {/* stat row */}
          <motion.div
            variants={fade} initial="hidden" animate="show" custom={5}
            className="mt-9 flex items-stretch gap-4 sm:gap-6"
          >
            <Stat n="30" label="Day cycle" />
            <Divider />
            <Stat n="7" label="B.Tech tracks" />
            <Divider />
            <Stat n="6" label="Daily missions" />
          </motion.div>
        </div>

        {/* ===== RIGHT — layered cinematic mockup ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 relative"
        >
          {/* glow ring behind the stack */}
          <div
            aria-hidden
            className="absolute inset-0 -m-8 rounded-[40px] blur-3xl opacity-60"
            style={{ background: "radial-gradient(circle at center, rgba(208,0,0,0.30), transparent 65%)" }}
          />

          {/* main dashboard card */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-5 shadow-[0_30px_80px_-20px_rgba(208,0,0,0.45)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center h-7 w-7 rounded-md bg-blood-500/15 border border-blood-500/45">
                  <Flame className="h-3.5 w-3.5 text-blood-500" />
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Today's mission</div>
                  <div className="text-[12px] font-semibold leading-tight">Day 7 · DSA</div>
                </div>
              </div>
              <span className="text-[11px] text-blood-500 font-semibold">23%</span>
            </div>

            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "23%" }}
                transition={{ duration: 1.4, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-blood-700 to-blood-500 shadow-[0_0_14px_rgba(208,0,0,0.6)]"
              />
            </div>

            <div className="grid grid-cols-6 gap-1.5 mb-5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const done = d <= 6;
                const today = d === 7;
                const cls = done
                  ? "bg-blood-500/20 border-blood-500/55 text-white"
                  : today
                  ? "border-blood-500/70 text-white animate-pulse"
                  : "border-white/8 text-white/30";
                return (
                  <div
                    key={d}
                    className={"aspect-square rounded-md border text-[10px] grid place-items-center " + cls}
                  >
                    {done ? <Check className="h-3 w-3" /> : d}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.06]">
              <MiniStat label="Streak" value="6" accent />
              <MiniStat label="Rank"   value="Disciple" />
              <MiniStat label="XP"     value="620" />
            </div>
          </div>

          {/* floating widget — top-right notification */}
          <motion.div
            initial={{ opacity: 0, x: 16, y: -8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -top-4 -right-3 sm:-right-6 rounded-xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
          >
            <span className="grid place-items-center h-7 w-7 rounded-md bg-emerald-400/12 border border-emerald-400/35">
              <Trophy className="h-3.5 w-3.5 text-emerald-300" />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300 font-semibold">Milestone</div>
              <div className="text-[11px] text-white">7-day streak unlocked</div>
            </div>
          </motion.div>

          {/* floating widget — bottom-left workout chip */}
          <motion.div
            initial={{ opacity: 0, x: -16, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-5 -left-3 sm:-left-6 rounded-xl border border-blood-500/30 bg-[#0a0a0a]/95 backdrop-blur-xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-[0_18px_40px_-12px_rgba(208,0,0,0.3)]"
          >
            <span className="grid place-items-center h-7 w-7 rounded-md bg-blood-500/15 border border-blood-500/45">
              <Dumbbell className="h-3.5 w-3.5 text-blood-500" />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-blood-500 font-semibold">Body mission</div>
              <div className="text-[11px] text-white">Push · 4 exercises</div>
            </div>
          </motion.div>

          {/* tiny ambient widget — middle-right XP burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-6 lg:-right-10 rounded-full border border-blood-500/40 bg-blood-500/10 backdrop-blur-md px-3 py-1.5 items-center gap-1.5"
            style={{ boxShadow: "0 0 24px rgba(208,0,0,0.45)" }}
          >
            <Sparkles className="h-3 w-3 text-blood-500" />
            <span className="text-[10px] font-semibold text-white">+100 XP</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- subcomponents ---------- */

function TrustItem({
  icon: Icon, label
}: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-blood-500/85" />
      <span>{label}</span>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-white text-2xl sm:text-3xl font-semibold leading-none tracking-tight">{n}</div>
      <div className="text-[11px] text-white/55 mt-1.5">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />;
}

function MiniStat({
  label, value, accent
}: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className={"text-[13px] font-semibold mt-1 leading-none " + (accent ? "text-blood-500" : "text-white")}>
        {value}
      </div>
    </div>
  );
}
