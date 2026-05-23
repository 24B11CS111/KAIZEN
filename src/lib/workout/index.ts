/**
 * KAIZEN.SYS — Workout module entry point.
 *
 * pickWorkoutTrack()  — chooses one of 6 tracks from user preferences
 * generateWorkout()   — returns today's WorkoutMission given the dojo day
 *
 * Deterministic, no LLM, fully testable.
 */

import type {
  WorkoutInput, WorkoutMission, WorkoutTrack
} from "./types";
import { homeBeginner }      from "./tracks/home-beginner";
import { homeIntermediate }  from "./tracks/home-intermediate";
import { homeAdvanced }      from "./tracks/home-advanced";
import { gymBeginner }       from "./tracks/gym-beginner";
import { gymIntermediate }   from "./tracks/gym-intermediate";
import { gymAdvanced }       from "./tracks/gym-advanced";

export type {
  WorkoutInput, WorkoutMission, WorkoutTrack,
  WorkoutDay, Exercise, WorkoutLocation, FitnessLevel, WorkoutKind
} from "./types";

export const TRACKS: Record<string, WorkoutTrack> = {
  home_beginner:     homeBeginner,
  home_intermediate: homeIntermediate,
  home_advanced:     homeAdvanced,
  gym_beginner:      gymBeginner,
  gym_intermediate:  gymIntermediate,
  gym_advanced:      gymAdvanced
};

/**
 * Pick the right WorkoutTrack for this user.
 *
 * Falls back to home + beginner if anything is missing — safe default
 * for new users who haven't filled the new profile columns yet.
 */
export function pickWorkoutTrack(input: WorkoutInput): WorkoutTrack {
  const id = (input.location ?? "home") + "_" + (input.level ?? "beginner");
  return TRACKS[id] ?? TRACKS.home_beginner;
}

/**
 * Return today's workout for a given dojo-day (1..30).
 *
 * Cycle position is `((day - 1) % 7) + 1`. So day 1 → cycle day 1,
 * day 8 → cycle day 1 again (next week), and so on. This produces
 * a clean Mon-Sun-style rhythm without per-day handcrafted programming.
 */
export function generateWorkout(input: WorkoutInput): WorkoutMission {
  const track = pickWorkoutTrack(input);
  const cyclePos = ((input.day_number - 1) % track.cycle.length) + 1;
  const day = track.cycle[cyclePos - 1];

  return {
    track_id:    track.id,
    track_label: track.label,
    cycle_day:   cyclePos,
    day
  };
}

/** Convenience: read WorkoutInput from a raw (untyped) profile + day. */
export function workoutInputFromProfile(p: any, dayNumber: number): WorkoutInput {
  return {
    location:   (p?.workout_location as any) ?? "home",
    level:      (p?.fitness_level    as any) ?? "beginner",
    daily_min:  Number(p?.daily_time_min ?? 60),
    day_number: Math.max(1, Math.min(30, dayNumber))
  };
}
