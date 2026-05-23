"use client";

/**
 * KAIZEN.SYS — ProfileMenu
 *
 * Compact, mobile-first auth dropdown for the navbar.
 * Trigger: profile avatar + first name + subscription pill.
 * Panel:   profile / progress / subscription / sign out.
 *
 * Hides on outside click, Escape, or route change.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, User as UserIcon, BarChart3, CreditCard, LogOut,
  Crown, Hourglass, AlertTriangle, Sparkles
} from "lucide-react";
import {
  type AuthProfile, subscriptionBadge, signOutAndRedirect
} from "@/lib/useAuthSession";

interface Props {
  firstName: string;
  profile: AuthProfile | null;
}

export function ProfileMenu({ firstName, profile }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const badge = subscriptionBadge(profile);

  // Close on route change.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click + escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = firstName.slice(0, 1).toUpperCase();

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-tap inline-flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid place-items-center h-7 w-7 rounded-full bg-blood-500/15 border border-blood-500/40 text-[11px] font-semibold text-blood-500 shrink-0">
          {initials}
        </span>
        <span className="hidden sm:inline text-[12px] font-medium text-white leading-none">
          {firstName}
        </span>
        {badge && <BadgePill tone={badge.tone} label={badge.label} />}
        <ChevronDown
          className={"h-3.5 w-3.5 text-white/45 transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-obsidian/95 backdrop-blur-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] overflow-hidden"
          >
            {/* Header — name + email */}
            <div className="px-3.5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center h-9 w-9 rounded-full bg-blood-500/15 border border-blood-500/40 text-sm font-semibold text-blood-500">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white truncate">{firstName}</div>
                  <div className="text-[11px] text-white/55 truncate">
                    {profile?.email ?? ""}
                  </div>
                </div>
              </div>
              {badge && (
                <div className="mt-3">
                  <BadgePill tone={badge.tone} label={badge.label} large />
                </div>
              )}
            </div>

            {/* Items */}
            <nav className="py-1.5">
              <Item href="/dojo"     icon={Sparkles}    label="Dashboard" />
              <Item href="/profile"  icon={UserIcon}    label="My Profile" />
              <Item href="/progress" icon={BarChart3}   label="Progress" />
              <Item href="/enroll"   icon={CreditCard}  label="Subscription" />
            </nav>

            <div className="border-t border-white/[0.06] py-1.5">
              <button
                type="button"
                onClick={() => signOutAndRedirect("/")}
                role="menuitem"
                className="w-full inline-flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-blood-500 hover:bg-blood-500/[0.08] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Item({
  href, icon: Icon, label
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/85 hover:bg-white/[0.04] hover:text-white transition-colors"
    >
      <Icon className="h-4 w-4 text-white/55" />
      {label}
    </Link>
  );
}

function BadgePill({
  tone, label, large
}: {
  tone: "active" | "pending" | "expired" | "free";
  label: string;
  large?: boolean;
}) {
  const cls = TONE[tone];
  const Icon = ICON[tone];
  const size = large ? "px-2.5 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9.5px]";
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-[0.12em] " +
        cls + " " + size
      }
    >
      <Icon className={large ? "h-3 w-3" : "h-2.5 w-2.5"} />
      {label}
    </span>
  );
}

const TONE: Record<string, string> = {
  active:  "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
  pending: "text-amber-300 border-amber-300/40 bg-amber-300/10",
  expired: "text-blood-500 border-blood-500/40 bg-blood-500/10",
  free:    "text-white/65 border-white/15 bg-white/[0.04]"
};

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  active:  Crown,
  pending: Hourglass,
  expired: AlertTriangle,
  free:    Sparkles
};
