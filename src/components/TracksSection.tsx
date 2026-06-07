"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

const intermediateCourses = ["MPC", "BiPC"];
const intermediateExpansions: Record<string, string> = {
  MPC: "Maths, Physics, Chemistry",
  BiPC: "Biology, Physics, Chemistry",
  MEC: "Maths, Economics, Commerce",
  CEC: "Civics, Economics, Commerce",
  HEC: "History, Economics, Civics"
};

const engineeringBranches = [
  "CSE", "AI & ML", "Data Science", "ECE", "EEE", "Mechanical", "Civil"
];

const intermediateFeatures = [
  "Logical thinking development",
  "Career awareness sessions",
  "Soft skills training",
  "Daily study discipline"
];

const engineeringFeatures = [
  "Full-stack development",
  "Agentic AI workflows",
  "Placement preparation",
  "Real-world projects"
];

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }
  })
};

export function TracksSection() {
  return (
    <section id="pricing" className="section">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="eyebrow justify-center">Pricing</p>
          <h2 className="h2 mt-3">Choose your path.</h2>
          <p className="lead mt-4">
            Two tracks. One discipline. Pay manually via UPI &mdash; activated within minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intermediate */}
          <motion.div
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="card card-hover p-7 flex flex-col"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/55">Intermediate Path</div>
                <h3 className="h3 mt-2">Foundation Dojo</h3>
                <p className="text-sm text-white/55 mt-1">For 11th and 12th students.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-semibold">&#8377;49</div>
                <div className="text-xs text-white/50 mt-1">/ month</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55 mb-3">Courses</div>
              <div className="flex flex-wrap gap-2">
                {intermediateCourses.map((c) => (
                  <span key={c} className="pill-tag" title={intermediateExpansions[c]}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm">
              {intermediateFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-white/80">
                  <Check className="h-4 w-4 mt-0.5 text-blood-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/upgrade?plan=49" className="btn-secondary mt-7 w-full">
              Choose Intermediate <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Engineering */}
          <motion.div
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            className="card card-hover p-7 flex flex-col relative"
            style={{ borderColor: "rgba(208,0,0,0.4)" }}
          >
            <span className="absolute -top-2.5 left-7 text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded bg-blood-500 text-white">
              Recommended
            </span>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-blood-500">Engineering Path</div>
                <h3 className="h3 mt-2">Warrior Specialization</h3>
                <p className="text-sm text-white/55 mt-1">For B.Tech students preparing for industry.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-semibold">&#8377;99</div>
                <div className="text-xs text-white/50 mt-1">/ month</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55 mb-3">Branches</div>
              <div className="flex flex-wrap gap-2">
                {engineeringBranches.map((b) => (
                  <span key={b} className="pill-tag">{b}</span>
                ))}
              </div>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm">
              {engineeringFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-white/80">
                  <Check className="h-4 w-4 mt-0.5 text-blood-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/upgrade?plan=99" className="btn-primary mt-7 w-full">
              Choose Engineering <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
