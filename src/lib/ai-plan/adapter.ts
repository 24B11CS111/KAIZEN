/**
 * Bridge between the AI planner's output (PlanDay) and the existing
 * dashboard shape (BranchDay used by MissionCard).
 *
 * The dashboard already knows how to render a BranchDay. We map onto
 * that shape so no UI redesign is needed; the two extra habit fields
 * (exercise + productivity) get appended into the discipline field so
 * the user still sees them.
 */

import type { BranchDay } from "@/data/days";
import type { PlanDay } from "./types";

export function planDayToBranchDay(p: PlanDay): BranchDay {
  // Combine the three habit lines into a single discipline string so the
  // MissionCard renders them together in the Discipline row.
  const discipline = [
    p.discipline,
    "Move: " + p.exercise,
    "Focus: " + p.productivity
  ].join(" • ");

  return {
    day:        p.day,
    title:      p.title,
    concept:    p.study,
    prepare:    p.practice,
    learn:      "",          // BranchDay.learn is normally a video URL; the AI plan has none.
    practice:   [p.practice],
    build:      p.build,
    discipline
  };
}

export function planToBranchDays(plan: PlanDay[]): BranchDay[] {
  return plan.map(planDayToBranchDay);
}
