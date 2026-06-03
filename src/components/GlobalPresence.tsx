"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GlobalPresence() {
  const pathname = usePathname();

  useEffect(() => {
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

      channel.subscribe(async (status: string) => {
        if (status !== "SUBSCRIBED") return;
        await channel?.track(payload);
        await supabase.rpc("upsert_online_session", {
          p_channel_key: user.id,
          p_pathname: pathname,
          p_metadata: payload
        } as any).catch(() => null);
      });
    }

    boot();

    return () => {
      cancelled = true;
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, [pathname]);

  return null;
}
