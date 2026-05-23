/**
 * Time-budget + skill-level scaling for the planner.
 *
 * Every track defines its mission template in three tiers (light / mid / deep).
 * The planner picks the tier based on the user's daily_time_min, and the
 * suffix is optionally appended for the skill level so the same content
 * reads age-appropriate.
 */

import type { SkillLevel } from "./types";

export type TimeTier = "light" | "mid" | "deep";

export function pickTier(dailyMin: number): TimeTier {
  if (dailyMin <= 45) return "light";
  if (dailyMin <= 90) return "mid";
  return "deep";
}

/**
 * Trims a deep task to fit a lighter time budget. Used by tracks that
 * only define one canonical task per day — light tier strips the
 * "build" suffix down to a "review" or "draft" version.
 */
export function trimBuild(deepBuild: string, tier: TimeTier): string {
  if (tier === "deep") return deepBuild;
  if (tier === "mid") {
    // Mid budget: keep the build but ask for a smaller artifact.
    return deepBuild.replace(/^Build /, "Sketch ").replace(/^Ship /, "Draft ");
  }
  // Light budget: skip the heavy build — just take notes / read.
  return "Review what you learned and write 3 bullet takeaways.";
}

export function levelHint(level: SkillLevel): string {
  switch (level) {
    case "beginner":     return "Go slow. Repeat what's unclear.";
    case "intermediate": return "Push edge-of-comfort. Don't skip drills.";
    case "advanced":     return "Optimize, refactor, teach back.";
  }
}
