"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Target, FlaskConical, Package, Flame, ArrowUpRight, Lock, Sparkles } from "lucide-react";
import type { CseDay } from "@/data/cse-days";

const item = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }
  })
};

interface Props {
  day: number;
  branch: string | null;
  data?: CseDay;
  locked?: boolean;
  lockReason?: "plan" | "cycle";
  upgradeHref?: string;
}

export function MissionCard({
  day,
  branch,
  data,
  locked,
  lockReason = "plan",
  upgradeHref = "/enroll"
}: Props) {
  const sections = [
    {
      key: "learn",
      icon: Target,
      label: "Learn",
      desc: data ? "Concept primer (video)" : "Today's concept primer",
      href: data?.learn,
      kind: "link" as const
    },
    {
      key: "practice",
      icon: FlaskConical,
      label: "Practice",
      desc: data
        ? `${data.practice.length} ${data.practice.length === 1 ? "problem" : "problems"} - timed set`
        : "10 questions, timed problem-set",
      href: data?.practice?.[0],
      kind: "link" as const
    },
    {
      key: "build",
      icon: Package,
      label: "Build",
      desc: data?.build ?? "Ship one tangible artifact",
      kind: "text" as const
    },
    {
      key: "discipline",
      icon: Flame,
      label: "Discipline",
      desc: data?.discipline ?? "Reflect, log, mark complete",
      kind: "text" as const
    }
  ];

  return (
    <div
      className={"card p-5 mt-5 relative overflow-hidden " + (locked ? "select-none" : "")}
      style={{ boxShadow: "0 0 28px -10px rgba(208,0,0,0.25)" }}
    >
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-black/55 px-5">
          <div className="text-center max-w-[260px]">
            <span className="grid place-items-center h-10 w-10 mx-auto rounded-md bg-blood-500/15 border border-blood-500/40 mb-3">
              <Lock className="h-5 w-5 text-blood-500" />
            </span>
            {lockReason === "plan" ? (
              <>
                <p className="text-sm font-semibold">Upgrade to unlock</p>
                <p className="text-xs text-white/65 mt-1">
                  Free preview ends here. Get the full 30-day path.
                </p>
                <Link
                  href={upgradeHref}
                  className="btn-primary mt-4 inline-flex items-center justify-center gap-1.5 text-xs px-4 py-2"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Upgrade
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Locked</p>
                <p className="text-xs text-white/65 mt-1">
                  Day {day} unlocks on its scheduled date.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-4 gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            Today&apos;s mission
          </div>
          <div className="text-base sm:text-lg font-semibold mt-0.5 truncate">
            Day {day}
            {data?.title && <span className="text-white/65"> - {data.title}</span>}
            {!data?.title && branch && <span className="text-white/45"> - {branch}</span>}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-blood-500 shrink-0">
          4 actions
        </span>
      </div>

      <ul className="space-y-2.5">
        {sections.map((s, i) => {
          const isLink = s.kind === "link" && !!s.href && !locked;
          const Tag: any = isLink ? "a" : "div";
          const linkProps = isLink
            ? { href: s.href, target: "_blank", rel: "noopener noreferrer" }
            : {};
          return (
            <motion.li
              key={s.key}
              variants={item}
              initial="hidden"
              animate="show"
              custom={i}
            >
              <Tag
                {...linkProps}
                className={
                  "tap-card w-full text-left flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] transition-all p-3.5 sm:p-4 min-h-[64px] sm:min-h-[68px] " +
                  (isLink ? "hover:border-blood-500/45 active:scale-[0.97]" : "")
                }
              >
                <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30 shrink-0">
                  <s.icon className="h-5 w-5 text-blood-500" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block text-xs text-white/55 mt-0.5 line-clamp-2">{s.desc}</span>
                </span>
                {isLink && <ArrowUpRight className="h-4 w-4 text-white/35 shrink-0" />}
              </Tag>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
