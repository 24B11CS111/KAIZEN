"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, X, ShieldCheck, Zap } from "lucide-react";
import { AdminSidebar, ADMIN_NAV_LINKS } from "./AdminSidebar";

export function AdminHeader({ adminProfile }: { adminProfile: any }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLink = ADMIN_NAV_LINKS.find(
    (link) => pathname === link.href || (link.href !== "/sensei" && pathname.startsWith(link.href))
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-black/50 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-white/70 hover:text-white lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1 items-center gap-3">
            <h1 className="text-lg font-semibold text-white tracking-tight hidden sm:block">
              {currentLink?.name || "Dashboard"}
            </h1>
            
            <div className="relative ml-auto sm:ml-6 flex w-full max-w-xs items-center">
              <label htmlFor="search-field" className="sr-only">Search</label>
              <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-white/40" aria-hidden="true" />
              <input
                id="search-field"
                className="block h-9 w-full rounded-full border-0 bg-white/5 py-0 pl-10 pr-4 text-white placeholder:text-white/40 focus:ring-1 focus:ring-blood-500 sm:text-sm"
                placeholder="Search users, UTRs..."
                type="search"
                name="search"
              />
            </div>
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hidden md:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400">System Nominal</span>
            </div>

            <button type="button" className="-m-2.5 p-2.5 text-white/60 hover:text-white">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-white/10" aria-hidden="true" />

            <div className="flex items-center gap-x-3">
              <span className="sr-only">Your profile</span>
              <div className="h-8 w-8 rounded-full bg-blood-500/20 border border-blood-500/30 flex items-center justify-center text-blood-400 font-bold text-sm">
                {adminProfile?.full_name?.charAt(0) || "S"}
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="text-sm font-semibold leading-6 text-white" aria-hidden="true">
                  {adminProfile?.full_name || "Sensei"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-obsidian border-r border-white/5 shadow-2xl flex flex-col">
            <div className="absolute right-0 top-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
