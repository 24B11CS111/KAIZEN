"use client";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

const APP_ROUTES = ["/dojo", "/progress", "/notifications", "/profile"];

export function BottomNavGate() {
  const pathname = usePathname() || "";
  const showNav = APP_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!showNav) return null;
  return <BottomNav />;
}
