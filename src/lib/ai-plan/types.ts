/**
 * KAIZEN AI Planning System — public types.
 *
 * The planner is deterministic (no LLM). It composes a personalized
 * 30-day plan from a track library + rotating habit pools, scaled by
 * the user's daily time budget and skill level.
 */

export type Occupation =
  | "school_student"
  | "intermediate_student"
  | "college_student"
  | "working_professional"
  | "job_seeker"
  | "self_employed"
  | "other";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type MainGoal =
  | "crack_placements"
  | "full_stack_dev"
  | "improve_discipline"
  | "aiml_mastery"
  | "build_projects"
  | "learn_programming"
  | "prepare_exams"
  | "other";

export type TrackId =
  | "fundamentals"
  | "fullstack"
  | "dsa"
  | "aiml"
  | "productivity"
  | "engineering"
  | "jee"
  | "neet"
  | "discipline";

/**
 * Single day in the generated plan. Matches the user-spec format exactly.
 */
export interface PlanDay {
  day: number;          // 1..30
  title: string;        // short headline for the day
  study: string;        // what to study (concept primer)
  practice: string;     // what to practice (problems / drills)
  build: string;        // what to build (tangible artifact)
  exercise: string;     // small body exercise
  discipline: string;   // discipline / habit task
  productivity: string; // small productivity habit
}

/**
 * Inputs the planner needs to generate a plan. Drawn from the
 * onboarding questionnaire + the existing branch column on profiles.
 */
export interface PlanInput {
  occupation: Occupation;
  field_of_study: string;
  branch?: string | null;          // optional: BTech/Inter branch code (e.g. "CSE")
  main_goal: MainGoal;
  daily_time_min: number;          // 30, 60, 90, 120, 180...
  skill_level: SkillLevel;
}

/**
 * The full generated plan plus a metadata snapshot of inputs (so
 * regenerations can be compared and analytics can group by track).
 */
export interface GeneratedPlan {
  track_id: TrackId;
  track_label: string;
  days: PlanDay[];
  source: PlanInput;
  generated_at: string; // ISO timestamp
}
