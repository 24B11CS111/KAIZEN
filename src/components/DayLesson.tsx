"use client";
import { motion } from "framer-motion";
import {
  Calendar, Target, PlayCircle, FlaskConical, Package, Check, ArrowRight
} from "lucide-react";

interface Lesson {
  task: string;
  resource: { title: string; href: string };
  practice: string[];
  output: string;
}

/**
 * Per-day lesson card. Replace `getLesson(day, branch)` with whatever data
 * source you eventually use - a JSON file, Supabase table, or CMS.
 *
 * For now this returns a templated lesson so the UI is fully functional
 * without any backend content authored.
 */
function getLesson(day: number, branch: string | null): Lesson {
  const branchLabel = branch ?? "your stream";
  return {
    task:
      "Day " + day + " - Build foundational fluency in " + branchLabel +
      ". Spend 60 focused minutes on the core skill of the day.",
    resource: {
      title: "Day " + day + " primer (10-min read + 15-min watch)",
      href: "#"
    },
    practice: [
      "10 conceptual questions on the day's topic",
      "1 timed problem-set (20 minutes)",
      "Reflect: write 3 sentences in your log"
    ],
    output:
      "Ship one tangible artifact - a code file, a worked-out problem set, " +
      "or a one-page summary. Drop it in your portfolio folder."
  };
}

interface Props {
  day: number;
  branch: string | null;
  done: boolean;
  pending: boolean;
  onComplete: () => void;
}

export function DayLesson({ day, branch, done, pending, onComplete }: Props) {
  const lesson = getLesson(day, branch);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card p-6 mt-6"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-md bg-blood-500/10 border border-blood-500/30">
            <Calendar className="h-5 w-5 text-blood-500" />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
              Today
            </div>
            <div className="text-lg font-semibold mt-0.5">Day {day} of 30</div>
          </div>
        </div>
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-blood-500/10 border border-blood-500/40 text-blood-500">
            <Check className="h-3.5 w-3.5" /> Sealed
          </span>
        ) : (
          <button onClick={onComplete} disabled={pending} className="btn-primary btn-sm">
            {pending ? "Sealing..." : "Mark complete"} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Block icon={Target} label="Task of the day" body={lesson.task} />
        <Block
          icon={PlayCircle}
          label="Learning resource"
          body={
            <a href={lesson.resource.href} className="text-blood-500 hover:underline">
              {lesson.resource.title}
            </a>
          }
        />
        <Block
          icon={FlaskConical}
          label="Practice"
          body={
            <ul className="space-y-1.5 mt-1">
              {lesson.practice.map((p) => (
                <li key={p} className="flex items-start gap-2 text-white/80">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-blood-500 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          }
        />
        <Block icon={Package} label="Output" body={lesson.output} />
      </div>
    </motion.div>
  );
}

function Block({
  icon: Icon,
  label,
  body
}: {
  icon: typeof Target;
  label: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-blood-500" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</span>
      </div>
      <div className="text-sm text-white/80 leading-relaxed">{body}</div>
    </div>
  );
}
