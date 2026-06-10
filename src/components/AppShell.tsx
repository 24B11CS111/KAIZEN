"use client";

import { usePathname } from "next/navigation";
import { isAdminRoute } from "@/lib/routes";
import { IntroLoader } from "@/components/IntroLoader";
import { BottomNavGate } from "@/components/BottomNavGate";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { DevBypassBanner } from "@/components/DevBypassBanner";
import { GlobalPresence } from "@/components/GlobalPresence";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = isAdminRoute(pathname);

  return (
    <div className={isAdmin ? "app-shell-admin" : "app-shell"}>
      <DevBypassBanner />
      {!isAdmin && <IntroLoader />}
      <GlobalPresence />
      <div
        className={isAdmin ? "app-scroll-container-admin" : "app-scroll-container"}
        id="app-scroll-container"
      >
        {children}
      </div>
      {!isAdmin && <BottomNavGate />}
      {!isAdmin && <InstallPrompt />}
      <ServiceWorkerRegistrar />
    </div>
  );
}
