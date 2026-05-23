/**
 * KAIZEN.SYS — Unified Daily Mission assembler.
 *
 * Pulls the existing AI plan day + workout mission + a rotating
 * recovery pool into ONE strictly-categorized mission object:
 *
 *   STUDY · PRACTICE · BUILD · WORKOUT · DISCIPLINE · RECOVERY
 *
 * 100% personalized — every field is derived from:
 *   - the user's ai_plans row (track + plan_day)
 *   - their profile (workout_location, fitness_level, daily_time_min)
 *   - the current dojo day number
 *
 * No random / placeholder / demo strings.
 */

import type { PlanDay } from "@/lib/ai-plan/types";
import { generateWorkout, workoutInputFromProfile } from "@/lib/workout";
import type { WorkoutMission } from "@/lib/workout";

/* ---------- public types ---------- */

export interface DailyMission {
  day:        number;
  title:      string;            // headline for the day (from the AI plan)
  branch:     string | null;
  goal:       string | null;
  trackLabel: string | null;     // e.g. "DSA + Placements"

  study:      MissionStudy;
  practice:   MissionPractice;
  build:      MissionBuild;
  workout:    WorkoutMission;
  discipline: MissionDiscipline;
  recovery:   MissionRecovery;
}

export interface MissionStudy {
  topic:    string;              // "Variables & Data Types"
  action:   string;              // "Watch Traversy Media (15 mins)" — actionable
  time_min: number;              // estimated time
}

export interface MissionPractice {
  items: string[];               // 1-3 short execution lines
}

export interface MissionBuild {
  task:        string;
  deliverable: string;           // 1-line "what to ship" definition of done
}

export interface MissionDiscipline {
  focus:        string;          // a single focus challenge
  productivity: string;          // one productivity habit
}

export interface MissionRecovery {
  hydration: string;
  sleep:     string;
  stretch:   string;
}

/* ---------- recovery rotation ---------- */

const HYDRATION_POOL = [
  "Drink 8 glasses of water through the day.",
  "Start with 500ml water on waking.",
  "Carry your bottle everywhere today.",
  "1 glass before every meal, no exceptions.",
  "3 liters minimum. Track each glass.",
  "Cut soda / sugary drinks for today.",
  "Add electrolytes after your workout."
];
const SLEEP_POOL = [
  "Lights out by 11 PM.",
  "No screens 30 min before bed.",
  "Set tomorrow's alarm before brushing.",
  "Cool, dark, quiet room. Phone outside.",
  "Read 10 pages instead of scrolling.",
  "7+ hours minimum, non-negotiable.",
  "Wind-down ritual: stretch + journal."
];
const STRETCH_POOL = [
  "5-minute neck + shoulder mobility.",
  "Hip-flexor stretch each side 60 sec.",
  "Couch stretch 60 sec each leg.",
  "Standing forward fold 90 sec.",
  "Cat-cow 10 reps + child's pose 60 sec.",
  "Doorway pec stretch 60 sec each side.",
  "Hanging dead-hang 30 sec."
];

function pick(pool: string[], day: number, salt: number): string {
  return pool[((day - 1) * 3 + salt) % pool.length];
}

/* ---------- core: split PlanDay.study into topic + action ---------- */

/**
 * The AI plan's `study` string is already actionable but free-form.
 * We split on the first period or em-dash to derive a clean "topic"
 * and "action" — without changing the content. This gives the unified
 * board a clean two-line render.
 */
function parseStudy(raw: string, dailyMin: number): MissionStudy {
  const split = raw.split(/[.—]/).map((s) => s.trim()).filter(Boolean);
  const topic = split[0] ?? raw;
  const action = split.slice(1).join(". ") || topic;
  return {
    topic,
    action,
    time_min: Math.max(15, Math.min(60, Math.round(dailyMin * 0.4)))
  };
}

/** Split practice into 1-3 bullets — handles "+", ";", ",  ", ". " */
function parsePractice(raw: string): MissionPractice {
  const items = raw
    .split(/[•;]|\.\s|\+\s/)
    .map((s) => s.trim().replace(/^\W+|\W+$/g, ""))
    .filter((s) => s.length >= 3);
  return { items: items.length > 0 ? items.slice(0, 3) : [raw] };
}

/* ---------- public API ---------- */

export interface AssembleArgs {
  /** The user's profile row (raw, untyped — keys read defensively). */
  profile:        any;
  /** Today's PlanDay (from ai_plans.generated_plan[displayDay - 1]). */
  planDay:        PlanDay;
  /** The branch / goal / track label to surface in the header. */
  trackLabel:     string | null;
  /** Current dojo day (1..30). */
  dayNumber:      number;
}

export function assembleDailyMission({
  profile, planDay, trackLabel, dayNumber
}: AssembleArgs): DailyMission {
  const dailyMin = Number(profile?.daily_time_min ?? 60);

  const workout: WorkoutMission = generateWorkout(
    workoutInputFromProfile(profile, dayNumber)
  );

  return {
    day:        dayNumber,
    title:      planDay.title,
    branch:     profile?.branch ?? null,
    goal:       (profile?.main_goal ?? null),
    trackLabel: trackLabel,

    study: parseStudy(planDay.study, dailyMin),
    practice: parsePractice(planDay.practice),
    build: {
      task:        planDay.build,
      deliverable: planDay.build
    },
    workout,
    discipline: {
      focus:        planDay.discipline,
      productivity: planDay.productivity
    },
    recovery: {
      hydration: pick(HYDRATION_POOL, dayNumber, 0),
      sleep:     pick(SLEEP_POOL,     dayNumber, 1),
      stretch:   pick(STRETCH_POOL,   dayNumber, 2)
    }
  };
}

/** Friendly display labels for the user's main_goal enum. */
export function friendlyGoalLabel(g: string | null | undefined): string {
  switch (g) {
    case "crack_placements":   return "Crack placements";
    case "full_stack_dev":     return "Full-stack mastery";
    case "improve_discipline": return "Discipline";
    case "aiml_mastery":       return "AI / ML mastery";
    case "build_projects":     return "Build projects";
    case "learn_programming":  return "Learn programming";
    case "prepare_exams":      return "Exam prep";
    default:                   return "Discipline";
  }
}
