"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          setNotifications(data as AppNotification[]);
        }
      } catch (e) {
        console.error("Error fetching notifications", e);
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

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "reminder": return <CheckCircle2 className="h-4 w-4 text-white/70" />;
      case "streak": return <Flame className="h-4 w-4 text-orange-500" />;
      case "alert": return <AlertTriangle className="h-4 w-4 text-blood-500" />;
      case "upgrade": return <ShieldCheck className="h-4 w-4 text-blood-500" />;
      default: return <Bell className="h-4 w-4 text-white/70" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 grid place-items-center rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-colors btn-tap"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blood-500 shadow-[0_0_8px_rgba(208,0,0,0.8)]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto glass border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-obsidian/90 backdrop-blur-md z-10">
              <h3 className="text-sm font-semibold tracking-wide">Command Alerts</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-blood-500 font-medium bg-blood-500/10 px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  No new directives.
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-white/5">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`relative p-3 hover:bg-white/[0.04] transition-colors cursor-pointer ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                    >
                      {!n.is_read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-blood-500 rounded-r-full" />
                      )}
                      <div className="flex gap-3">
                        <div className={`mt-0.5 grid place-items-center h-8 w-8 rounded-md border ${!n.is_read ? 'border-blood-500/30 bg-blood-500/10' : 'border-white/10 bg-white/5'}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          {n.action_url && (
                            <Link href={n.action_url} className="mt-2 inline-flex items-center gap-1 text-[11px] text-blood-500 hover:text-blood-400 uppercase tracking-widest font-semibold transition-colors">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
