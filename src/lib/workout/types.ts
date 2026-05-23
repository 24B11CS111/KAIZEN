/**
 * KAIZEN.SYS — Workout module types.
 *
 * Mirrors the AI Plan architecture: deterministic, composable, no LLM.
 * 6 tracks (home/gym × beginner/intermediate/advanced) defined as
 * 7-day cycles that repeat across the 30-day program.
 */

export type WorkoutLocation = "home" | "gym";
export type FitnessLevel    = "beginner" | "intermediate" | "advanced";

/** A single exercise inside a workout block. */
export interface Exercise {
  name: string;
  sets: number;
  reps: string;          // e.g. "8-10", "AMRAP", "30 sec"
  rest: string;          // e.g. "60 sec", "90-120 sec"
  notes?: string;        // optional cue (form / tempo / RIR)
}

/** Type of workout day — drives the card visual + dashboard label. */
export type WorkoutKind =
  | "push" | "pull" | "legs"
  | "upper" | "lower" | "full_body"
  | "mobility" | "active_recovery" | "rest"
  | "chest" | "back" | "shoulders" | "arms" | "weak_point";

export interface WorkoutDay {
  day:        number;       // 1..7 (cycle position)
  title:      string;       // "Push Day" / "Mobility Flow"
  kind:       WorkoutKind;
  target:     string[];     // muscle groups
  strategy:   string;       // one-line focus
  exercises:  Exercise[];
  rest:       string;       // overall session rest guidance
  recovery:   string;       // post-session note
  motivation: string;       // one-line cue
  duration_min: number;     // estimated session length
}

/** A full track — a 7-day cycle that the picker rotates through. */
export interface WorkoutTrack {
  id:        string;        // e.g. "home_beginner"
  label:     string;        // e.g. "Home · Beginner"
  location:  WorkoutLocation;
  level:     FitnessLevel;
  cycle:     WorkoutDay[];  // length 7
  weeklyFocus: string;      // 1-line summary
}

export interface WorkoutInput {
  location:     WorkoutLocation;
  level:        FitnessLevel;
  daily_min:    number;          // user's daily commitment
  day_number:   number;          // 1..30 — current dojo day
}

/** The shape returned to the dashboard for "today's workout". */
export interface WorkoutMission {
  track_id:     string;
  track_label:  string;
  cycle_day:    number;          // 1..7
  day:          WorkoutDay;
}
