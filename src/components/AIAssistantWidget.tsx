"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Dumbbell, Target, BookOpen, Moon, ChevronDown, CheckCircle2, Zap } from "lucide-react";

interface Mission {
  title: string;
  description: string;
  duration: number;
  priority: string;
  category: "focus" | "workout" | "learning" | "reflection" | "custom";
}

interface AIInsight {
  type: string;
  message: string;
}

interface Props {
  missions: Mission[];
  insights: AIInsight[];
}

const CATEGORY_ICONS: Record<string, any> = {
  focus: Target,
  workout: Dumbbell,
  learning: BookOpen,
  reflection: Moon,
  custom: Zap
};

const CATEGORY_LABELS: Record<string, string> = {
  focus: "Deep Work",
  workout: "Physical Training",
  learning: "Skill Acquisition",
  reflection: "Night Reflection",
  custom: "Dynamic Mission"
};

export function AIAssistantWidget({ missions, insights }: Props) {
  return (
    <div className="space-y-4">
      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="card p-4 sm:p-5 border-blood-500/40 bg-blood-500/[0.04]">
          <div className="flex items-center gap-2 mb-3 text-blood-400">
            <Brain className="h-4 w-4" />
            <h3 className="text-xs font-semibold tracking-widest uppercase">Sensei Insights</h3>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-[13px] text-white/80 flex items-start gap-2">
                <span className="text-blood-500 mt-1">-,</span>
                <span>{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missions Board */}
      <div className="space-y-2">
        {missions.map((mission, idx) => (
          <MissionSection key={idx} mission={mission} defaultOpen={idx === 0} />
        ))}
      </div>
    </div>
  );
}

function MissionSection({ mission, defaultOpen }: { mission: Mission; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = CATEGORY_ICONS[mission.category] || Zap;
  const label = CATEGORY_LABELS[mission.category] || "Mission";

  return (
    <div className="card p-0 overflow-hidden border border-white/[0.08] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          <span className="grid place-items-center h-8 w-8 rounded bg-white/[0.04] border border-white/10 text-white/70">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
            <div className="text-sm font-semibold mt-0.5">{mission.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">{mission.duration} min</span>
          <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <p className="text-[13px] text-white/70 leading-relaxed border-t border-white/[0.04] pt-3">
                {mission.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
