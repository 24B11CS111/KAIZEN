"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GlobalPresence() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/sensei")) return;

    let cancelled = false;
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

      channel = (supabase as any).channel("kaizen-presence", {
        config: { presence: { key: user.id } }
      });

      channel.on("presence", { event: "sync" }, () => {
        // Listener is intentionally registered before subscribe. Tracking
        // happens after SUBSCRIBED so Supabase accepts the presence payload.
      });

      channel.subscribe(async (status: string) => {
        if (status !== "SUBSCRIBED") return;
        try {
          await channel?.track(payload);
        } catch {
          // Presence is best-effort and must never crash app rendering.
        }

        try {
          const { error } = await supabase.rpc("upsert_online_session", {
            p_channel_key: user.id,
            p_pathname: pathname,
            p_metadata: payload
          } as any);
          if (error) console.warn("[presence] online session rpc failed:", error.message);
        } catch (error) {
          console.warn("[presence] online session rpc threw:", error);
        }
      });
    }

    boot();

    return () => {
      cancelled = true;
      if (channel) {
        try { channel.untrack(); } catch {}
        try { channel.unsubscribe(); } catch {}
        try { supabase.removeChannel(channel); } catch {}
      }
    };
  }, [pathname]);

  return null;
}
