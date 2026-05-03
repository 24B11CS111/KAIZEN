"use client";
import { useEffect, useState, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "kaizen.install.dismissedAt";
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore - iOS Safari
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Recently dismissed?
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400000) return;

    // iOS doesn't support beforeinstallprompt - show its own helper.
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !/Android/.test(ua);
    setIsIOS(ios);

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setDeferred(null);
      setVisible(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBefore as any);
    window.addEventListener("appinstalled", onInstalled);

    if (ios) {
      // Show iOS guidance after a short delay.
      const t = setTimeout(() => setVisible(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBefore as any);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore as any);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        dismiss();
      }
      setDeferred(null);
    } catch {
      dismiss();
    }
  }, [deferred, dismiss]);

  if (isStandalone || !visible) return null;

  return (
    <div className="fixed left-3 right-3 bottom-[calc(76px+env(safe-area-inset-bottom)+8px)] z-40 mx-auto max-w-md">
      <div className="card p-3 flex items-center gap-3 border-blood-500/40" style={{ backdropFilter: "blur(12px)" }}>
        <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40 shrink-0">
          <Smartphone className="h-4 w-4 text-blood-500" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Install KAIZEN</div>
          <div className="text-[11px] text-white/60 mt-0.5 truncate">
            {isIOS && !deferred
              ? "Share -> Add to Home Screen"
              : "Get the app-like experience on your home screen"}
          </div>
        </div>
        {!isIOS && deferred && (
          <button onClick={install} className="btn-primary btn-sm inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="grid place-items-center h-8 w-8 rounded-md border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
