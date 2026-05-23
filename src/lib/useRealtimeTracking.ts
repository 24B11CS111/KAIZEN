"use client";
import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Args {
  userId: string | null | undefined;
  /** Called whenever this user\'s data changes anywhere (progress, streak, xp). */
  onChange: () => void;
  /** Optional: also poll every N ms as a fallback. Default 0 = no poll. */
  pollMs?: number;
}

/**
 * Subscribe to a single user\'s tracking surface in one place. Wires up
 * postgres_changes for user_progress, streaks, and xp_log filtered to the
 * current user. .on() is chained synchronously before .subscribe() per
 * Supabase\'s API contract. Cleanup removes the channel on unmount.
 */
export function useRealtimeTracking({ userId, onChange, pollMs = 0 }: Args) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const supabase = createSupabaseBrowserClient();

    const fire = () => { if (!cancelled) onChange(); };

    if (subscribedRef.current) return;
    subscribedRef.current = true;

    // CRITICAL: chain all .on() calls BEFORE .subscribe()
    const channel = supabase
      .channel("user-track:" + userId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_progress", filter: "user_id=eq." + userId },
        fire
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "streaks", filter: "user_id=eq." + userId },
        fire
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "xp_log", filter: "user_id=eq." + userId },
        fire
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: "id=eq." + userId },
        fire
      )
      .subscribe();

    if (pollMs > 0) {
      timer = setInterval(fire, pollMs);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      supabase.removeChannel(channel);
      subscribedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
