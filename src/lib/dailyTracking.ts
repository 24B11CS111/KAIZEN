/**
 * KAIZEN.SYS - Daily tracking helpers.
 *
 * Reads from the persistence layer (post-0006 migration):
 *   - user_progress         (summary, one row per user)
 *   - user_progress_days    (per-day log, legacy / analytics)
 *   - streaks               (kept for back-compat; mirrored in user_progress)
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const TOTAL_DAYS = 30;

export interface UserProgressRow {
  id: string;
  user_id: string;
  day: number;
  completed: boolean;
  completed_at: string;
}

/** Pull all of a user's per-day completion records, ordered by day. */
export async function fetchUserProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProgressRow[]> {
  const { data, error } = await supabase
    .from("user_progress_days")
    .select("id, user_id, day, completed, completed_at")
    .eq("user_id", userId)
    .order("day", { ascending: true });
  if (error) throw error;
  return (data ?? []) as UserProgressRow[];
}

/** Set of completed day numbers (1..30). */
export function completedDaySet(rows: UserProgressRow[]): Set<number> {
  return new Set(rows.filter((r) => r.completed).map((r) => r.day));
}

/** First incomplete day in 1..30. Caps at TOTAL_DAYS when fully done. */
export function getCurrentDay(rows: UserProgressRow[]): number {
  const set = completedDaySet(rows);
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    if (!set.has(d)) return d;
  }
  return TOTAL_DAYS;
}

/** Has the user already sealed a day on today's calendar date? */
export function hasCompletedToday(rows: UserProgressRow[]): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return rows.some(
    (r) => r.completed && (r.completed_at ?? "").slice(0, 10) === today
  );
}

/**
 * Summary-table shape (one row per user) from the new user_progress table.
 * Provides everything the dashboard needs for fast first-paint.
 */
export interface UserProgressSummary {
  user_id: string;
  current_day: number;
  completed_days: number[];
  streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

/** Streak record pulled from the streaks table (back-compat). */
export interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at?: string;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(dateStr: string): number {
  const today = new Date(todayUtc() + "T00:00:00Z").getTime();
  const then = new Date(dateStr.slice(0, 10) + "T00:00:00Z").getTime();
  return Math.floor((today - then) / (1000 * 60 * 60 * 24));
}

/**
 * Returns true when the user previously had a streak but missed
 * one or more calendar days.
 */
export function isStreakBroken(streak: StreakRow | null | undefined): boolean {
  if (!streak) return false;
  if (!streak.last_completed_date) return false;
  if ((streak.longest_streak ?? 0) === 0) return false;
  return daysSince(streak.last_completed_date) > 1;
}

/**
 * Number of full calendar days since the user's last sealed day.
 * 0 = sealed today, 1 = sealed yesterday, 2+ = missed days. -1 = never.
 */
export function daysSinceLastCompletion(
  lastDate: string | null | undefined
): number {
  if (!lastDate) return -1;
  return daysSince(lastDate);
}

export type StreakStatus = "active" | "broken" | "fresh";

export function streakStatus(streak: StreakRow | null | undefined): StreakStatus {
  if (!streak || !streak.last_completed_date) return "fresh";
  if ((streak.longest_streak ?? 0) === 0) return "fresh";
  return daysSince(streak.last_completed_date) > 1 ? "broken" : "active";
}

/** Server-side helper: ask Supabase to reset a stale streak and return state. */
export async function resetStaleStreak(supabase: SupabaseClient): Promise<{
  was_reset: boolean;
  current_streak: number;
  longest_streak: number;
}> {
  const { data, error } = await supabase.rpc("reset_stale_streak").single();
  if (error || !data) return { was_reset: false, current_streak: 0, longest_streak: 0 };
  const row = data as { was_reset: boolean; current_streak: number; longest_streak: number };
  return {
    was_reset: !!row.was_reset,
    current_streak: row.current_streak ?? 0,
    longest_streak: row.longest_streak ?? 0
  };
}

/** Friendly mapping of server / RPC errors. */
export function mapDailyTrackingError(raw: string): string {
  const r = (raw ?? "").toLowerCase();
  if (r.includes("daily limit")) return "You already sealed a day today. Come back tomorrow.";
  if (r.includes("already completed")) return "That day is already sealed.";
  if (r.includes("subscription")) return "Your subscription is not active.";
  if (r.includes("invalid day")) return "That day isn't available yet.";
  if (r.includes("unauthorized")) return "Please sign in again.";
  if (r.includes("network") || r.includes("fetch")) return "Couldn't reach the server. Check your connection.";
  return "Couldn't seal this day. Try again.";
}
