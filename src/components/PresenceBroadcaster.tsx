"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function PresenceBroadcaster({
  userId,
  email,
  fullName,
}: {
  userId: string;
  email: string | null;
  fullName: string | null;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    const channel = (supabase as any).channel("kaizen-presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      // Intentionally silent sync
    });

    try {
      channel.subscribe(async (status: string) => {
        if (cancelled || status !== "SUBSCRIBED") return;
        try {
          await channel.track({
            user_id: userId,
            email: email,
            full_name: fullName,
            pathname: pathname,
            online_at: new Date().toISOString(),
          });
        } catch {
          // Presence tracking is best-effort.
        }
      });
    } catch (error) {
      console.warn("[presence-broadcaster] subscribe failed:", error);
    }

    return () => {
      cancelled = true;
      try { channel.untrack(); } catch {}
      try { channel.unsubscribe(); } catch {}
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [userId, email, fullName, pathname]);

  return null; // Silent component
}
