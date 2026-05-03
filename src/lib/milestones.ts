/**
 * Tiny milestone helpers. Tiers are crossed by total completed days.
 * Tone: minimal, not childish - it labels the moment, doesn't celebrate.
 */
export interface Milestone {
  tier: 0 | 1 | 2 | 3;
  /** Short label - single line, sentence case. */
  label: string;
  /** Sub-line displayed once when the tier is just crossed. */
  message: string;
  /** Day count required to reach this tier. */
  threshold: number;
}

export const MILESTONES: Milestone[] = [
  { tier: 0, label: "Begin",                threshold: 0,  message: "" },
  { tier: 1, label: "Consistency started",  threshold: 3,  message: "Three days. The pattern is forming." },
  { tier: 2, label: "Warrior Rising",       threshold: 7,  message: "Seven days. The habit has weight." },
  { tier: 3, label: "Ascended",             threshold: 30, message: "Thirty days. The path is yours." }
];

/** Return the highest milestone whose threshold is <= completedCount. */
export function getMilestone(completedCount: number): Milestone {
  let m = MILESTONES[0];
  for (const cand of MILESTONES) {
    if (completedCount >= cand.threshold) m = cand;
  }
  return m;
}

/** True if completedCount exactly equals a tier's threshold (the crossing). */
export function isMilestoneJustReached(completedCount: number): boolean {
  return MILESTONES.some((m) => m.tier > 0 && completedCount === m.threshold);
}

/** Motivation line shown after a successful completion. */
export function motivationLine(completedCount: number): string {
  if (completedCount >= 30) return "Path complete. Discipline wins.";
  if (completedCount >= 7)  return "Day sealed. The fire steadies.";
  if (completedCount >= 3)  return "Day sealed. The pattern holds.";
  return "Day sealed. Continue tomorrow.";
}
