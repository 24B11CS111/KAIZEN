"use client";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function UpgradePage() {
  return (
    <main className="min-h-[100svh] bg-obsidian text-white flex flex-col">
      <Navbar />

      <section className="flex-1 px-5 py-12 md:py-24 grid place-items-center">
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blood-500/30 bg-blood-500/10 text-blood-500 text-xs font-semibold tracking-wider uppercase mb-6">
              <Lock className="h-3 w-3" />
              Trial Expired
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Discipline is not free.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-400 to-blood-600">
                Choose your path.
              </span>
            </h1>
            <p className="mt-4 text-white/60 max-w-lg mx-auto text-sm leading-relaxed">
              Your 3-day initiation is complete. To unlock the full power of the KAIZEN AI execution engine, you must commit.
            </p>
          </motion.div>

          <div className="mt-16 grid md:grid-cols-2 gap-6 items-start">
            {/* Core Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold">KAIZEN CORE</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">₹99</span>
                  <span className="text-white/40 text-sm">/ month</span>
                </div>
                <p className="mt-3 text-sm text-white/50">For the focused operator.</p>
              </div>

              <ul className="space-y-4 mb-8 text-sm">
                <FeatureItem text="Dynamic 30-Day AI Roadmaps" />
                <FeatureItem text="Daily Progress Tracking" />
                <FeatureItem text="Streak & Consistency Engine" />
                <FeatureItem text="Basic In-App Reminders" />
              </ul>

              <Link
                href="/enroll?plan=core"
                className="w-full btn-ghost py-4 inline-flex items-center justify-center gap-2 text-sm"
              >
                Unlock Core
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Elite Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 rounded-2xl border border-blood-500/40 bg-blood-500/[0.03] shadow-[inset_0_0_0_1px_rgba(208,0,0,0.1),0_0_40px_rgba(208,0,0,0.15)]"
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-blood-500 text-white text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1.5">
                <Crown className="h-3 w-3" />
                Recommended
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-blood-500">KAIZEN ELITE</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">₹199</span>
                  <span className="text-white/40 text-sm">/ month</span>
                </div>
                <p className="mt-3 text-sm text-white/50">For the uncompromising elite.</p>
              </div>

              <ul className="space-y-4 mb-8 text-sm">
                <FeatureItem text="Adaptive Realtime AI Restructuring" />
                <FeatureItem text="Aggressive Push & Email Reminders" />
                <FeatureItem text="Premium Radar Telemetry Analytics" />
                <FeatureItem text="Direct Sensei Protocol Access" />
                <FeatureItem text="Priority Mission Generation" />
              </ul>

              <Link
                href="/enroll?plan=elite"
                className="w-full btn-blood py-4 inline-flex items-center justify-center gap-2 text-sm"
              >
                Become Elite
                <Zap className="h-4 w-4 fill-current" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-white/80">
      <span className="grid place-items-center shrink-0 h-5 w-5 rounded-full bg-white/10 text-white/70 mt-0.5">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span className="leading-snug">{text}</span>
    </li>
  );
}
