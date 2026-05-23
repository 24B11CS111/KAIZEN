/**
 * KAIZEN.SYS — Workout DATA (flat, production-ready shape)
 *
 * The 6 exports below match the canonical KAIZEN data architecture
 * spec. They re-shape the underlying WorkoutTrack content (one
 * authored source of truth) into a flat, scalable array per
 * (location, level) — suitable for:
 *
 *   - REST / GraphQL API responses
 *   - dashboard card rendering
 *   - AI personalization pipelines
 *   - mobile-app / Capacitor integration
 *
 * Each array represents a 7-day weekly cycle that repeats across the
 * 30-day program. The picker in ./index.ts uses these via the wrapped
 * WorkoutTrack interface; consumers needing flat JSON-friendly data
 * import directly from this file.
 *
 * Shape (per the spec):
 *   {
 *     day, type, level, title, targetMuscles, strategy,
 *     exercises: [{ name, target, sets, reps, rest, notes }],
 *     recovery, discipline
 *   }
 */

import type { WorkoutTrack } from "./types";
import { homeBeginner }      from "./tracks/home-beginner";
import { homeIntermediate }  from "./tracks/home-intermediate";
import { homeAdvanced }      from "./tracks/home-advanced";
import { gymBeginner }       from "./tracks/gym-beginner";
import { gymIntermediate }   from "./tracks/gym-intermediate";
import { gymAdvanced }       from "./tracks/gym-advanced";

/* ---------- Public types (production-ready) ---------- */

export type WorkoutType  = "Home" | "Gym";
export type WorkoutLevel = "Beginner" | "Intermediate" | "Advanced";

/** Per-exercise structure exactly as specified in the brief. */
export interface WorkoutExercise {
  name:   string;
  target: string;          // primary muscle group
  sets:   number;
  reps:   string;          // "8-10" | "AMRAP" | "30 sec"
  rest:   string;          // "120 sec" | "60-90 sec"
  notes:  string;          // empty string if none — always present
}

/** A single day inside one of the 6 flat exports. */
export interface WorkoutEntry {
  day:           number;            // 1..7 (cycle position)
  type:          WorkoutType;
  level:         WorkoutLevel;
  title:         string;
  targetMuscles: string[];
  strategy:      string;
  exercises:     WorkoutExercise[];
  recovery:      string;
  discipline:    string;
}

/* ---------- Helpers ---------- */

/**
 * Map an exercise name to its primary muscle group via regex patterns.
 * Order matters — most-specific patterns first so general words ("back"
 * in "back squat", "curl" in "Nordic curl") don't capture incorrectly.
 */
function inferTarget(name: string, fallback: string): string {
  const n = name.toLowerCase();

  // Most-specific compound names first
  if (/nordic|hamstring|leg curl|rdl|romanian deadlift/.test(n))          return "Hamstrings";
  if (/hip thrust|glute bridge|kickback|hip bridge|glute/.test(n))        return "Glutes";
  if (/squat|leg press|leg ext|pistol|shrimp|lunge|step.?up/.test(n))     return "Quads";
  if (/calf/.test(n))                                                     return "Calves";

  // Upper-body push
  if (/bench|chest fly|chest press|pec|push.?up|dip(?!ladder)/.test(n))   return "Chest";
  if (/overhead.+press|shoulder press|pike|handstand|lateral raise|delt|y-t-w|shrug|front raise/.test(n)) return "Shoulders";
  if (/tricep|skullcrusher|pushdown|tricep extension|overhead extension/.test(n)) return "Triceps";

  // Upper-body pull
  if (/face pull|rear delt|reverse pec|reverse fly|snow angel/.test(n))   return "Rear delts";
  if (/pull.?up|chin|lat pulldown|pulldown|inverted row|towel chin|skin.the.cat|front lever|back lever/.test(n)) return "Lats";
  if (/row|pendlay|t-bar|superman|deadlift/.test(n))                      return "Back";
  if (/wrist curl|forearm|hammer curl/.test(n))                           return "Forearms";
  if (/bicep|curl/.test(n))                                               return "Biceps";

  // Core / mobility / cardio
  if (/plank|hollow|dead bug|bird.?dog|l-?sit|leg raise|knee raise|crunch|core|side plank/.test(n)) return "Core";
  if (/jefferson|bridge hold|pancake|cossack|sun salutation/.test(n))     return "Mobility";
  if (/walk|run|cycle|cardio|jog|skipping|treadmill|row(ing)?(?!.+(barbell|cable))/.test(n)) return "Cardio";
  if (/stretch|mobility|cat.?cow|hip rot|thoracic|flow/.test(n))          return "Recovery";

  return fallback;
}

function levelLabel(level: WorkoutTrack["level"]): WorkoutLevel {
  return (level.charAt(0).toUpperCase() + level.slice(1)) as WorkoutLevel;
}

function typeLabel(loc: WorkoutTrack["location"]): WorkoutType {
  return loc === "gym" ? "Gym" : "Home";
}

function trackToFlat(track: WorkoutTrack): WorkoutEntry[] {
  const type  = typeLabel(track.location);
  const level = levelLabel(track.level);
  const fallback = track.cycle[0]?.target[0] ?? "Whole body";
  return track.cycle.map((d) => ({
    day:           d.day,
    type,
    level,
    title:         d.title,
    targetMuscles: d.target,
    strategy:      d.strategy,
    exercises:     d.exercises.map((ex) => ({
      name:   ex.name,
      target: inferTarget(ex.name, d.target[0] ?? fallback),
      sets:   ex.sets,
      reps:   ex.reps,
      rest:   ex.rest,
      notes:  ex.notes ?? ""
    })),
    recovery:   d.recovery,
    discipline: d.motivation
  }));
}

/* ---------- The 6 canonical exports ---------- */

export const homeWorkoutBeginner:     WorkoutEntry[] = trackToFlat(homeBeginner);
export const homeWorkoutIntermediate: WorkoutEntry[] = trackToFlat(homeIntermediate);
export const homeWorkoutAdvanced:     WorkoutEntry[] = trackToFlat(homeAdvanced);

export const gymWorkoutBeginner:      WorkoutEntry[] = trackToFlat(gymBeginner);
export const gymWorkoutIntermediate:  WorkoutEntry[] = trackToFlat(gymIntermediate);
export const gymWorkoutAdvanced:      WorkoutEntry[] = trackToFlat(gymAdvanced);

/* ---------- Convenience registry + selector ---------- */

export const WORKOUT_DATA: Record<WorkoutType, Record<WorkoutLevel, WorkoutEntry[]>> = {
  Home: {
    Beginner:     homeWorkoutBeginner,
    Intermediate: homeWorkoutIntermediate,
    Advanced:     homeWorkoutAdvanced
  },
  Gym: {
    Beginner:     gymWorkoutBeginner,
    Intermediate: gymWorkoutIntermediate,
    Advanced:     gymWorkoutAdvanced
  }
};

/**
 * Get a single day's entry for the (type, level, dayNumber) tuple.
 * `dayNumber` wraps across the 7-day cycle, so day 8 → cycle position 1
 * and so on across the 30-day program.
 */
export function getWorkoutForDay(
  type: WorkoutType,
  level: WorkoutLevel,
  dayNumber: number
): WorkoutEntry | null {
  const cycle = WORKOUT_DATA[type]?.[level];
  if (!cycle || cycle.length === 0) return null;
  const pos = ((Math.max(1, dayNumber) - 1) % cycle.length);
  return cycle[pos] ?? null;
}

/**
 * Flatten ALL 6 cycles into one big array — useful for analytics
 * exports, admin views, or bulk dataset checks.
 */
export const ALL_WORKOUTS: WorkoutEntry[] = [
  ...homeWorkoutBeginner,
  ...homeWorkoutIntermediate,
  ...homeWorkoutAdvanced,
  ...gymWorkoutBeginner,
  ...gymWorkoutIntermediate,
  ...gymWorkoutAdvanced
];
