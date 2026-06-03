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
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!userId) return;

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

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: userId,
          email: email,
          full_name: fullName,
          pathname: pathname,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId, email, fullName, pathname, supabase]);

  return null; // Silent component
}
