"use client";
import { motion } from "framer-motion";
import { ScrollText, Lock, Flame, GaugeCircle } from "lucide-react";

const tenets = [
  {
    icon: ScrollText,
    title: "30-Day Drip",
    body: "Day 1 to Day 30 unlocks one tier at a time. No skipping. The path reveals itself only to those who walk it."
  },
  {
    icon: Flame,
    title: "Streak Doctrine",
    body: "Miss a day, the flame dies. Continue, the fire grows. Your streak is your reflection."
  },
  {
    icon: Lock,
    title: "Hard Lock at Expiry",
    body: "On day 31, the gate closes. No partial access. Renew to begin a new 30-day cycle from zero."
  },
  {
    icon: GaugeCircle,
    title: "Manual UPI Activation",
    body: "Pay via UPI. Submit your 12-digit UTR. The Sensei verifies. Your dojo opens."
  }
];

export function ProtocolSection() {
  return (
    <section id="protocol" className="relative py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="label-mono">The codex</p>
          <h2 className="heading mt-3 text-4xl md:text-5xl">Four laws. One blade.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tenets.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="glass glass-hover rounded-xl p-5"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blood-500/10 border border-blood-500/30">
                <t.icon className="h-5 w-5 text-blood-500" />
              </div>
              <h3 className="mt-4 font-display text-lg">{t.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{t.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
