"use client";

import { useState, useEffect } from "react";
import { Bell, Flame, ShieldCheck, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type NotificationType = "reminder" | "alert" | "streak" | "upgrade";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          setNotifications(data as AppNotification[]);
        }
      } catch (e) {
        console.error("Error fetching notifications", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const supabase = createSupabaseBrowserClient();
    let sub: any;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      sub = supabase
        .channel(`public:notifications:user_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new as AppNotification, ...prev]);
          }
        )
        .subscribe();
    });

    return () => {
      if (sub) {
        try { sub.unsubscribe(); } catch {}
        try { supabase.removeChannel(sub); } catch {}
      }
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "reminder": return <CheckCircle2 className="h-5 w-5 text-white/70" />;
      case "streak": return <Flame className="h-5 w-5 text-orange-500" />;
      case "alert": return <AlertTriangle className="h-5 w-5 text-blood-500" />;
      case "upgrade": return <ShieldCheck className="h-5 w-5 text-blood-500" />;
      default: return <Bell className="h-5 w-5 text-white/70" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <main className="flex-1 flex flex-col pb-bottom-nav">
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="h2 text-white">Alerts</h1>
            <p className="text-sm text-white/50 mt-1">System directives and updates.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-white/40 hover:text-white/80 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <Bell className="h-6 w-6 opacity-30 text-white" />
            </div>
            <h3 className="text-white font-medium text-lg mb-1">No new directives</h3>
            <p className="text-white/40 text-sm">You are fully caught up.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`relative p-4 card tap-card cursor-pointer transition-colors ${
                  !n.is_read ? 'bg-white/[0.04] border-white/[0.15]' : 'bg-white/[0.01]'
                }`}
              >
                {!n.is_read && (
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-blood-500 rounded-r-full" />
                )}
                <div className="flex gap-4">
                  <div className={`mt-0.5 grid place-items-center h-10 w-10 shrink-0 rounded-xl border ${
                    !n.is_read ? 'border-blood-500/30 bg-blood-500/10' : 'border-white/10 bg-white/5'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base leading-tight ${!n.is_read ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-white/50 mt-1.5 leading-relaxed">
                      {n.message}
                    </p>
                    {n.action_url && (
                      <Link href={n.action_url} className="mt-3 inline-flex items-center gap-1.5 text-xs text-blood-500 hover:text-blood-400 uppercase tracking-widest font-bold transition-colors">
                        Execute <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
