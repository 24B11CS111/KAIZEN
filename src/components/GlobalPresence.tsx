"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeRpc } from "@/lib/safeRpc";
import { cleanupChannel, createFreshChannel } from "@/lib/realtime";

export function GlobalPresence() {
  const pathname = usePathname();
  const activeRef = useRef(false);

  useEffect(() => {
    if (pathname.startsWith("/sensei")) return;

    let cancelled = false;
    activeRef.current = true;
    const supabase = createSupabaseBrowserClient();
    let channel: any = null;

    async function boot() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      const p = profile as { full_name?: string | null; email?: string | null } | null;
      const onlineAt = new Date().toISOString();
      const payload = {
        user_id: user.id,
        email: p?.email ?? user.email ?? null,
        full_name: p?.full_name ?? user.user_metadata?.full_name ?? null,
        pathname,
        online_at: onlineAt,
        last_seen_at: onlineAt
      };

      channel = createFreshChannel(supabase, "kaizen-presence", {
        config: { presence: { key: user.id } }
      });

      // All listeners MUST be registered before subscribe().
      channel.on("presence", { event: "sync" }, () => {
        /* sync handled by track() after SUBSCRIBED */
      });

      channel.subscribe(async (status: string) => {
        if (cancelled || status !== "SUBSCRIBED") return;
        try {
          await channel?.track(payload);
        } catch (err) {
          console.warn("[presence] track failed:", err);
        }

        await safeRpc(
          supabase,
          "upsert_online_session",
          {
            p_channel_key: user.id,
            p_pathname: pathname,
            p_metadata: payload
          },
          "presence/upsert_online_session"
        );
      });
    }

    boot();

    return () => {
      cancelled = true;
      activeRef.current = false;
      if (channel) {
        try { void channel.untrack(); } catch { /* best-effort */ }
        cleanupChannel(supabase, channel);
        channel = null;
      }
    };
  }, [pathname]);

  return null;
}
