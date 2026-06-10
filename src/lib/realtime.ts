"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve the Supabase internal topic string for a channel name. */
function channelTopic(channelName: string): string {
  return channelName.startsWith("realtime:") ? channelName : `realtime:${channelName}`;
}

/**
 * Remove an existing channel with the same name before creating a new one.
 * Prevents "cannot add presence callbacks after subscribe()" when React
 * Strict Mode or route changes re-mount subscription effects.
 */
export function removeChannelByName(supabase: SupabaseClient, channelName: string): void {
  const topic = channelTopic(channelName);
  const existing = supabase.getChannels().find((ch) => ch.topic === topic);
  if (!existing) return;
  try {
    void existing.unsubscribe();
  } catch {
    /* best-effort */
  }
  try {
    void supabase.removeChannel(existing);
  } catch (err) {
    console.warn(`[realtime] removeChannel failed (${channelName}):`, err);
  }
}

/**
 * Create a fresh channel after tearing down any prior instance with the same name.
 */
export function createFreshChannel(
  supabase: SupabaseClient,
  channelName: string,
  config?: Record<string, unknown>
) {
  removeChannelByName(supabase, channelName);
  return (supabase as { channel: (name: string, opts?: object) => ReturnType<SupabaseClient["channel"]> })
    .channel(channelName, config);
}

export function cleanupChannel(supabase: SupabaseClient, channel: { unsubscribe: () => unknown } | null): void {
  if (!channel) return;
  try {
    void channel.unsubscribe();
  } catch {
    /* best-effort */
  }
  try {
    void supabase.removeChannel(channel as Parameters<SupabaseClient["removeChannel"]>[0]);
  } catch {
    /* best-effort */
  }
}
