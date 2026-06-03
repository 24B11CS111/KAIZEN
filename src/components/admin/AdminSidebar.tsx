"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  CreditCard, 
  Home, 
  Settings, 
  ShieldCheck, 
  Users, 
  Activity,
  LogOut,
  ChevronRight
} from "lucide-react";

export const ADMIN_NAV_LINKS = [
  { name: "Overview", href: "/sensei", icon: Home },
  { name: "Approvals", href: "/sensei/approvals", icon: ShieldCheck },
  { name: "Users", href: "/sensei/users", icon: Users },
  { name: "Analytics", href: "/sensei/analytics", icon: BarChart3 },
  { name: "Payments", href: "/sensei/payments", icon: CreditCard },
  { name: "Live Activity", href: "/sensei/activity", icon: Activity },
  { name: "Settings", href: "/sensei/settings", icon: Settings },
];

export function AdminSidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-3 mb-8 px-2 mt-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blood-500/25 bg-blood-500/[0.08] shadow-[0_0_24px_-12px_rgba(208,0,0,0.6)]">
          <ShieldCheck className="h-5 w-5 text-blood-500" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-white truncate">KAIZEN.SYS</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-blood-400">Admin Control</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 scrollbar-none">
        {ADMIN_NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/sensei" && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-blood-500/10 text-white border border-blood-500/20 shadow-inner"
                  : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? "text-blood-400" : "text-white/40 group-hover:text-white/70"}`} />
                <span className="text-sm font-medium">{link.name}</span>
              </div>
              {isActive && <ChevronRight className="h-3 w-3 text-blood-500/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <Link 
          href="/dojo" 
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Exit Admin</span>
        </Link>
      </div>
    </div>
  );
}
