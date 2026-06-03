"use client";

/**
 * KAIZEN.SYS — Navbar
 *
 * Premium, auth-aware, hydration-safe.
 *
 * Three render states:
 *   - loading           → skeleton avatar (no flash of sign-in CTAs)
 *   - unauthenticated   → "Sign in" + "Sign up" CTAs
 *   - authenticated     → ProfileMenu (avatar + name + badge + dropdown)
 *
 * Behavior:
 *   - sticky with glassmorphism that intensifies on scroll
 *   - subtle blood-red glow at scroll-top edge
 *   - mobile hamburger reveals the link list
 *   - tap targets ≥ 40px high
 */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuthSession } from "@/lib/useAuthSession";
import { ProfileMenu } from "./ProfileMenu";

const KAIZEN_LOGO = "https://res.cloudinary.com/dsvfrlwt1/image/upload/v1780421879/cb8239e9-c357-4ef2-bf15-693a52b91803_vzjrb3.png";

const GUEST_LINKS = [
  { href: "/",          label: "Home" },
  { href: "/#pricing",  label: "Pricing" },
  { href: "/#how",      label: "How it works" }
];

const AUTH_LINKS = [
  { href: "/dojo",     label: "Dashboard" },
  { href: "/progress", label: "Progress" },
  { href: "/profile",  label: "Profile" }
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status, profile, firstName } = useAuthSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAuthed = status === "authenticated";
  const links = isAuthed ? AUTH_LINKS : GUEST_LINKS;

  return (
    <header
      className={
        "fixed top-0 inset-x-0 z-40 transition-all duration-300 " +
        (scrolled
          ? "bg-obsidian/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]"
          : "bg-gradient-to-b from-obsidian/60 to-transparent backdrop-blur-md border-b border-transparent")
      }
    >
      {/* hairline accent — subtle red glow at the bottom edge when scrolled */}
      {scrolled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(208,0,0,0.45) 50%, transparent 100%)"
          }}
        />
      )}

      <nav className="container-page h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link
          href={isAuthed ? "/dojo" : "/"}
          className="flex items-center gap-2 group shrink-0 btn-tap"
        >
          <span className="relative grid place-items-center h-8 w-8 transition-all duration-300">
            <Image
              src={KAIZEN_LOGO}
              alt="KAIZEN.SYS"
              width={32}
              height={32}
              className="object-contain w-full h-full"
              style={{ filter: "drop-shadow(0 0 0px rgba(208,0,0,0))", transition: "filter 0.3s" }}
              priority
            />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            KAIZEN<span className="text-blood-500">.</span>SYS
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-7 text-[13px]">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-white/70 hover:text-white transition-colors btn-tap"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {status === "loading" && <AuthSkeleton />}
          {status === "unauthenticated" && <GuestCta />}
          {status === "authenticated" && (
            <ProfileMenu firstName={firstName} profile={profile} />
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden btn-tap h-9 w-9 grid place-items-center rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] bg-obsidian/95 backdrop-blur-xl"
          >
            <ul className="container-page py-3 space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 px-2 text-[14px] text-white/85 hover:text-white hover:bg-white/[0.04] rounded-md transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {!isAuthed && status === "unauthenticated" && (
                <li className="pt-2 flex gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 btn-secondary text-center btn-tap py-3"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 btn-primary text-center btn-tap py-3"
                  >
                    Sign up
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ----- Auth area subcomponents ----- */

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="h-7 w-7 rounded-full bg-white/[0.04] border border-white/[0.06] animate-pulse" />
      <span className="hidden sm:block h-3 w-14 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function GuestCta() {
  return (
    <>
      <Link
        href="/auth/login"
        className="hidden sm:inline-flex text-[13px] text-white/75 hover:text-white px-3 py-1.5 rounded-md transition-colors btn-tap"
      >
        Sign in
      </Link>
      <Link
        href="/auth/signup"
        className="btn-primary btn-sm btn-tap shadow-[0_0_18px_-4px_rgba(208,0,0,0.55)] hover:shadow-[0_0_24px_-2px_rgba(208,0,0,0.75)] transition-shadow"
      >
        Sign up
      </Link>
    </>
  );
}
