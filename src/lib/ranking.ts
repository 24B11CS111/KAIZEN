/**
 * KAIZEN.SYS - XP, level, and rank system.
 * Derived purely from existing data (completed days + streak), no new
 * DB schema. Tunable thresholds are exported so the UI can show progress
 * to next rank.
 */

export const XP_PER_DAY = 100;
export const STREAK_XP_BONUS = 10;
export const TOTAL_DAYS = 30;

export interface Rank {
  tier: number;
  name: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { tier: 0, name: "Initiate",      minXp: 0 },
  { tier: 1, name: "Disciple",      minXp: 200 },
  { tier: 2, name: "Warrior",       minXp: 700 },
  { tier: 3, name: "Elite",         minXp: 1500 },
  { tier: 4, name: "Ascendant",     minXp: 2200 },
  { tier: 5, name: "Kaizen Master", minXp: 3000 }
];

export interface XpState {
  totalXp: number;
  level: number;
  rank: Rank;
  nextRank: Rank | null;
  xpInRank: number;
  xpToNextRank: number;
  rankProgress: number;
}

export function computeXp(completedDays: number, currentStreak: number): number {
  const dayXp = Math.max(0, completedDays) * XP_PER_DAY;
  const streakBonus = Math.max(0, currentStreak) * STREAK_XP_BONUS;
  return dayXp + streakBonus;
}

export function computeLevel(totalXp: number): number {
  return Math.min(30, 1 + Math.floor(totalXp / 200));
}

export function getRank(totalXp: number): Rank {
  let cur = RANKS[0];
  for (const r of RANKS) {
    if (totalXp >= r.minXp) cur = r;
  }
  return cur;
}

export function getNextRank(totalXp: number): Rank | null {
  for (const r of RANKS) {
    if (r.minXp > totalXp) return r;
  }
  return null;
}

export function computeXpState(completedDays: number, currentStreak: number): XpState {
  const totalXp = computeXp(completedDays, currentStreak);
  const level = computeLevel(totalXp);
  const rank = getRank(totalXp);
  const nextRank = getNextRank(totalXp);

  const bandTop = nextRank ? nextRank.minXp : rank.minXp + 1;
  const bandBottom = rank.minXp;
  const bandSize = Math.max(1, bandTop - bandBottom);
  const xpInRank = totalXp - bandBottom;
  const xpToNextRank = nextRank ? Math.max(0, bandTop - totalXp) : 0;
  const rankProgress = nextRank
    ? Math.min(1, Math.max(0, xpInRank / bandSize))
    : 1;

  return { totalXp, level, rank, nextRank, xpInRank, xpToNextRank, rankProgress };
}

/**
 * Friendly motivational status line — adaptive.
 *
 * `missedDays`:
 *   - 0  = sealed today
 *   - 1  = missed yesterday only
 *   - 2+ = multiple missed days (recovery messaging)
 *   - -1 = never sealed
 */
export function aiStatusMessage(args: {
  completedCount: number;
  streak: number;
  sealedToday: boolean;
  streakBroken: boolean;
  missedDays?: number;
}): string {
  const missed = typeof args.missedDays === "number" ? args.missedDays : -1;

  if (args.completedCount >= TOTAL_DAYS) {
    return "You completed the path. The next 30 days are even quieter and even sharper.";
  }

  if (args.sealedToday) {
    if (args.streak >= 21) return "Three weeks. This is who you are now.";
    if (args.streak >= 14) return "Two weeks of fire. You're rewriting your defaults.";
    if (args.streak >= 7)  return "One week sealed. The rhythm holds you now.";
    return "Day sealed. Recovery is part of the work. Tomorrow is yours.";
  }

  if (missed >= 7) {
    return "A week passed. The dojo is still here. One small mission today — that's it.";
  }
  if (missed >= 3) {
    return "You're back. The path waits. Walk three days, the rhythm returns.";
  }
  if (missed === 2) {
    return "Two missed days. Recovery is one mission away. Start small.";
  }
  if (args.streakBroken) {
    return "Reset the line. Discipline is rebuilt by showing up — today.";
  }
  if (missed === 1) {
    return "Yesterday slipped. Today is yours. Begin again.";
  }

  if (args.streak >= 21) return "21-day momentum. Don't break it now — seal today.";
  if (args.streak >= 14) return "Two weeks in. Today's mission keeps the line alive.";
  if (args.streak >= 7)  return "The fire is steady. Hold it — seal today.";
  if (args.streak >= 3)  return "Consistency is forming. Keep it boring, keep it daily.";

  if (args.completedCount === 0) return "Begin. Day one is the only hard one.";
  return "Reps over motivation. Show up today.";
}
