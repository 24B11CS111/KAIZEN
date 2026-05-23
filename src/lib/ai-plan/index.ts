/**
 * KAIZEN AI Planning System — main entry point.
 *
 * generatePlan(input) returns a personalized 30-day execution plan.
 * The planner is fully deterministic — no LLM call — so it's:
 *   - instant
 *   - free
 *   - reproducible for the same input
 *   - testable
 *
 * Algorithm:
 *   1. pickTrack()  decides which track best matches the profile
 *   2. trackFn()    returns 30 mission cores (study / practice / build)
 *   3. orchestrator layers in the rotating habit pools
 *      (exercise / discipline / productivity) and time-budget scaling
 */

import type {
  GeneratedPlan, PlanDay, PlanInput, TrackId
} from "./types";
import { TRACK_FN, TRACK_LABEL } from "./tracks";
import { pickDiscipline, pickExercise, pickProductivity } from "./pools";

export type { GeneratedPlan, PlanDay, PlanInput, TrackId };
export { TRACK_LABEL };

/**
 * Choose the most appropriate track for this user.
 *
 * Precedence (high → low):
 *   1. main_goal match  (placements → DSA, full_stack_dev → fullstack, ...)
 *   2. branch / field match  (AIML → aiml, MECH → engineering, MPC → jee, ...)
 *   3. occupation match  (working_professional → productivity)
 *   4. skill_level === beginner → fundamentals
 *   5. discipline fallback
 */
export function pickTrack(input: PlanInput): TrackId {
  const goal = input.main_goal;
  const branch = (input.branch ?? "").toUpperCase();
  const field = (input.field_of_study ?? "").toLowerCase();
  const occ = input.occupation;
  const level = input.skill_level;

  // 1. Goal-first routing.
  if (goal === "crack_placements") return "dsa";
  if (goal === "full_stack_dev")   return "fullstack";
  if (goal === "aiml_mastery")     return "aiml";
  if (goal === "improve_discipline") return "discipline";
  if (goal === "prepare_exams") {
    if (branch === "BIPC" || /bio|neet|medical/.test(field)) return "neet";
    return "jee";
  }
  if (goal === "build_projects") {
    if (level === "beginner") return "fundamentals";
    // Non-software branches deserve their own track even with this goal.
    if (branch === "MECH" || branch === "CIVIL" || branch === "EEE" || branch === "ECE") return "engineering";
    if (branch === "AIML" || branch === "DS") return "aiml";
    return "fullstack";
  }
  if (goal === "learn_programming") return "fundamentals";

  // 2. Branch / field routing.
  if (branch === "CSE") return level === "beginner" ? "fundamentals" : "fullstack";
  if (branch === "AIML" || branch === "DS") return "aiml";
  if (branch === "ECE" || branch === "EEE" || branch === "MECH" || branch === "CIVIL") {
    return "engineering";
  }
  if (branch === "MPC") return "jee";
  if (branch === "BIPC") return "neet";

  if (/cse|computer|software/.test(field)) return level === "beginner" ? "fundamentals" : "fullstack";
  if (/ai|ml|machine|data sci/.test(field)) return "aiml";
  if (/mech|civil|electrical|electronic|ece|eee/.test(field)) return "engineering";
  if (/bio|neet|medical/.test(field)) return "neet";
  if (/jee|inter|intermediate|mpc/.test(field)) return "jee";

  // 3. Occupation routing.
  if (occ === "working_professional" || occ === "self_employed") return "productivity";
  if (occ === "intermediate_student") return "jee";
  if (occ === "school_student") return "fundamentals";

  // 4. Skill fallback.
  if (level === "beginner") return "fundamentals";

  // 5. Final fallback.
  return "discipline";
}

/**
 * Generate the full 30-day plan.
 */
export function generatePlan(input: PlanInput): GeneratedPlan {
  const trackId = pickTrack(input);
  const cores = TRACK_FN[trackId](input);

  const days: PlanDay[] = cores.map((m) => ({
    day:          m.day,
    title:        m.title,
    study:        m.study,
    practice:     m.practice,
    build:        m.build,
    exercise:     pickExercise(m.day),
    discipline:   pickDiscipline(m.day),
    productivity: pickProductivity(m.day)
  }));

  return {
    track_id:     trackId,
    track_label:  TRACK_LABEL[trackId],
    days,
    source:       input,
    generated_at: new Date().toISOString()
  };
}

/**
 * Read a PlanInput out of a (raw, untyped) profiles row. Useful when
 * we already have the row in hand and don't want to parse JSON twice.
 *
 * Falls back to safe defaults if some fields are missing — callers
 * should still trust the returned plan, since pickTrack's fallback
 * chain handles thin inputs.
 */
export function planInputFromProfile(p: any): PlanInput {
  return {
    occupation:     (p?.occupation     ?? "other"),
    field_of_study: (p?.field_of_study ?? p?.branch ?? ""),
    branch:         p?.branch ?? null,
    main_goal:      (p?.main_goal      ?? "improve_discipline"),
    daily_time_min: Number(p?.daily_time_min ?? 60),
    skill_level:    (p?.skill_level    ?? "beginner")
  };
}
