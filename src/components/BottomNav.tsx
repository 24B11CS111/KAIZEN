"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sword, BarChart3, User, Bell, ShieldCheck } from "lucide-react";

/**
 * Native-app style bottom tab bar. Fixed position, safe-area aware.
 * Renders only when on app pages (dojo / progress / profile / sensei).
 */
import { useAuthSession } from "@/lib/useAuthSession";

const baseTabs = [
  { href: "/dojo",         label: "Dojo",     icon: Sword },
  { href: "/progress",     label: "Progress", icon: BarChart3 },
  { href: "/notifications",label: "Alerts",   icon: Bell },
  { href: "/profile",      label: "Profile",  icon: User }
];

export function BottomNav() {
  const pathname = usePathname() || "/dojo";
  const { profile } = useAuthSession();
  
  const tabs = [...baseTabs];
  if (profile?.role === "admin" || (profile as any)?.is_admin) {
    tabs.push({ href: "/sensei", label: "Sensei", icon: ShieldCheck });
  }

  return (
    <nav
      className="absolute bottom-0 inset-x-0 z-40 border-t border-white/10 bg-obsidian/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex h-[64px] items-center justify-around px-2">
        {tabs.map((t) => {
          const active =
            t.href === "/"
              ? pathname === "/"
              : pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href} className="relative">
              <Link
                href={t.href}
                className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-wider relative"
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-glow"
                    className="absolute -top-px left-6 right-6 h-px bg-blood-500"
                    style={{ boxShadow: "0 0 12px rgba(208,0,0,0.8)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.08 : 1, color: active ? "#d00000" : "rgba(255,255,255,0.4)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <t.icon className="h-5 w-5" />
                </motion.span>
                <span className={active ? "text-white" : "text-white/40"}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
