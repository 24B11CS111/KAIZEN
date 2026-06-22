"use client";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, Lock, Crown, ArrowRight, Skull } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function UpgradePage() {
  const router = useRouter();

  return (
    <main className="min-h-[100svh] bg-obsidian text-white flex flex-col">
      <Navbar />

      <section className="flex-1 px-5 py-12 md:py-24 grid place-items-center">
        <div className="max-w-5xl mx-auto w-full">
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
              Your initiation is complete. To unlock the full power of the KAIZEN execution engine, you must commit.
            </p>
          </motion.div>

          <div className="mt-16 grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {/* RONIN Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative flex flex-col rounded-3xl glass-surface p-8 border border-white/10 overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Skull className="w-24 h-24 text-amber-600" />
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-2xl font-bold text-amber-500 uppercase tracking-widest">Ronin</h3>
                <div className="mt-4 flex items-baseline gap-1 text-5xl font-black">
                  <span className="text-2xl text-white/50">₹</span>49
                  <span className="text-sm font-medium text-white/40 tracking-normal">/month</span>
                </div>
                <p className="mt-2 text-sm text-white/50">Manual execution. For the disciplined wanderer.</p>

                <ul className="mt-8 space-y-4">
                  {[
                    "Notes & Journaling",
                    "Daily reminders & Notifications",
                    "Workout tracking",
                    "1% Better Every Day system",
                    "Streak & Consistency Score tracking",
                    "Manual daily planning"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                      <Check className="h-5 w-5 text-amber-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3 text-sm text-white/40">
                    <span className="h-5 w-5 flex items-center justify-center shrink-0">✕</span>
                    <span>No AI features</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/upgrade/submit?plan=ronin"
                className="mt-10 btn-tap w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500 text-amber-500 py-4 text-sm font-bold tracking-wide shadow-none hover:bg-amber-500 hover:text-white transition-all"
              >
                Become Ronin
              </Link>
            </motion.div>

            {/* SHOGUN Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative flex flex-col rounded-3xl bg-obsidian border border-blood-500 shadow-[0_0_40px_-10px_rgba(208,0,0,0.4)] p-8 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blood-500/10 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <Crown className="w-24 h-24 text-blood-500" />
              </div>
              <div className="relative z-10 flex-1">
                <div className="inline-flex px-3 py-1 bg-blood-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                  Elite Tier
                </div>
                <h3 className="text-2xl font-bold text-blood-500 uppercase tracking-widest">Shogun</h3>
                <div className="mt-4 flex items-baseline gap-1 text-5xl font-black">
                  <span className="text-2xl text-blood-500/50">₹</span>99
                  <span className="text-sm font-medium text-white/40 tracking-normal">/month</span>
                </div>
                <p className="mt-2 text-sm text-white/50">Complete AI OS. Command your life with ultimate precision.</p>

                <ul className="mt-8 space-y-4">
                  {[
                    "Everything in Ronin",
                    "Gemini 2.5 AI Engine",
                    "AI-generated 30-day roadmaps",
                    "Dynamic, adaptive daily missions",
                    "Remote work productivity analysis",
                    "Personalized execution insights"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/90">
                      <Zap className="h-5 w-5 text-blood-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/upgrade/submit?plan=shogun"
                className="mt-10 btn-tap w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blood-500 text-white py-4 text-sm font-bold tracking-wide shadow-[0_0_24px_-6px_rgba(208,0,0,0.6)] hover:bg-blood-600 hover:shadow-[0_0_32px_-4px_rgba(208,0,0,0.8)] transition-all"
              >
                Become Shogun <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          <div className="mt-12 text-center flex items-center justify-center gap-2 text-xs text-white/40">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure 256-bit encrypted submission.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
