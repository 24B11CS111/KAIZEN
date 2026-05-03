"use client";
import { motion } from "framer-motion";
import { Compass, QrCode, Sword } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Compass,
    title: "Choose your path",
    body: "Pick Intermediate or Engineering based on your stage. Subjects and roadmap auto-adjust."
  },
  {
    n: "02",
    icon: QrCode,
    title: "Pay via UPI",
    body: "Scan the QR, transfer the amount, submit your 12-digit UTR. No card or wallet account."
  },
  {
    n: "03",
    icon: Sword,
    title: "Enter your Dojo",
    body: "Once verified, your 30-day dojo unlocks. One day at a time, with streak and progress."
  }
];

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }
  })
};

export function HowItWorks() {
  return (
    <section className="section-tight">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow justify-center">How it works</p>
          <h2 className="h2 mt-3">Three steps. Then you train.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              className="card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30">
                  <s.icon className="h-5 w-5 text-blood-500" />
                </span>
                <span className="text-xs text-white/35 font-mono">{s.n}</span>
              </div>
              <h3 className="h3 mt-5">{s.title}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
