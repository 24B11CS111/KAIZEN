"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dojo", label: "Dashboard" },
  { href: "/#pricing", label: "Pricing" }
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 inset-x-0 z-40 transition-colors " +
        (scrolled
          ? "bg-obsidian/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent border-b border-transparent")
      }
    >
      <nav className="container-page h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center h-7 w-7 rounded-md bg-blood-500/15 border border-blood-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-blood-500 pulse-dot" />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            KAIZEN<span className="text-blood-500">.</span>SYS
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-white/70 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex text-sm text-white/70 hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <Link href="/register" className="btn-primary btn-sm">
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}
