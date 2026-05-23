/**
 * Rotating pools for the three "habit" fields that every day in the
 * plan must include:
 *   - exercise     (a quick body cue)
 *   - discipline   (a daily principle to enforce)
 *   - productivity (a small focus / workflow habit)
 *
 * Pools are sized so the rotation across 30 days never feels repetitive
 * (each pool is co-prime with 30 or has > 6 items, so the same triple
 * never recurs back-to-back).
 */

const DISCIPLINE_POOL: string[] = [
  "Wake up by 7 AM. No snooze button.",
  "Phone in another room while you work.",
  "No social media before 10 AM.",
  "10 minutes of silent sitting before you start.",
  "Plan tomorrow's missions tonight before bed.",
  "Cold water on your face right after waking.",
  "No food after 9 PM. Hydrate instead.",
  "Write 3 wins from today before sleep.",
  "15-minute walk after dinner. No phone.",
  "Do the hardest task FIRST today.",
  "One full hour of focused work. No tab-switching.",
  "Re-read your main_goal out loud before you start.",
  "No YouTube / Reels until today's mission is sealed."
];

const EXERCISE_POOL: string[] = [
  "20 pushups. Stop only at failure.",
  "50 jumping jacks. Fast and clean.",
  "Two 30-second planks with 30-second rest.",
  "15-minute brisk walk outside.",
  "10-minute full-body stretch routine.",
  "30 bodyweight squats.",
  "10 stair climbs (up + down = 1).",
  "Three rounds of sun salutation (or 5 burpees).",
  "Sprint 30s, walk 60s. Repeat 5 times.",
  "Mobility flow: neck, shoulders, hips.",
  "100 skipping rope (or 2-minute jogging in place).",
  "Wall-sit for 60 seconds.",
  "Pushups + squats: 3 rounds of 10 each."
];

const PRODUCTIVITY_POOL: string[] = [
  "Pomodoro mode: 25 minutes on, 5 off, x4.",
  "Single-tab rule. Close everything but the one tab.",
  "Inbox zero in under 10 minutes.",
  "Time-block tomorrow into 3 focused hour-blocks.",
  "Define your ONE most important thing for today.",
  "Take notes by hand for at least one session.",
  "Track time on one task for 1 full hour.",
  "Eliminate one distraction permanently today.",
  "Review yesterday's progress in 2 minutes. Adjust.",
  "Read 10 pages of a non-fiction book.",
  "Reply to no message for the first 2 hours of work.",
  "Use a 'parking lot' note for new ideas — finish first.",
  "End the day by clearing your desk + browser tabs."
];

/**
 * Hash a (pool length, day) into a 0..len-1 index. Uses a small prime
 * offset so triples don't line up on repeat patterns.
 */
function rotate(len: number, day: number, salt: number): number {
  return (day * 7 + salt * 11) % len;
}

export function pickDiscipline(day: number): string {
  return DISCIPLINE_POOL[rotate(DISCIPLINE_POOL.length, day - 1, 1)];
}

export function pickExercise(day: number): string {
  return EXERCISE_POOL[rotate(EXERCISE_POOL.length, day - 1, 2)];
}

export function pickProductivity(day: number): string {
  return PRODUCTIVITY_POOL[rotate(PRODUCTIVITY_POOL.length, day - 1, 3)];
}
