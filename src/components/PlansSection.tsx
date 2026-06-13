"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sword } from "lucide-react";
import { formatINR } from "@/lib/utils";

const plans = [
  {
    amount: 49,
    name: "Essential Growth",
    tagline: "Manual workflow and tracking.",
    features: [
      "Manual Workflow & Habit Tracking",
      "Smart Push Notifications",
      "Strength Training & Fitness",
      "Productivity & Focus Sessions",
      "Daily Reflection System"
    ]
  },
  {
    amount: 99,
    name: "AI Growth Assistant",
    tagline: "Your personal 24/7 AI coach.",
    featured: true,
    features: [
      "Everything in Essential Growth",
      "AI-Powered Task Execution",
      "Daily 1% Improvement Engine",
      "Advanced Predictive Insights",
      "Complete Life Operating System"
    ]
  }
];

export function PlansSection() {
  return (
    <section id="plans" className="relative py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="label-mono">Plans</p>
          <h2 className="heading mt-3 text-4xl md:text-5xl">Choose your blade.</h2>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            One UPI, manually verified by the Sensei. Activates for exactly 30 days.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`glass glass-hover relative rounded-2xl p-7 ${
                p.featured ? "border-blood-500/60 shadow-blood" : ""
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 label-mono px-2 py-1 rounded bg-blood-500 text-white">
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-2 text-blood-500">
                <Sword className="h-4 w-4" />
                <span className="label-mono">{p.name}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl">{formatINR(p.amount)}</span>
                <span className="text-white/50 text-sm">/ 30 days</span>
              </div>
              <p className="mt-2 text-white/60">{p.tagline}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 mt-0.5 text-blood-500 shrink-0" />
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/enroll?plan=${p.amount}`}
                className={p.featured ? "btn-blood mt-7 w-full" : "btn-ghost mt-7 w-full"}
              >
                Enlist for {formatINR(p.amount)}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
