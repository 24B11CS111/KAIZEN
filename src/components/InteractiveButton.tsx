"use client";

import { useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface InteractiveButtonProps extends Omit<HTMLMotionProps<"button">, "onClick" | "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  requireConfirm?: boolean;
}

export function InteractiveButton({
  children,
  className,
  variant = "primary",
  size = "default",
  onClick,
  successMessage,
  errorMessage,
  disabled,
  requireConfirm = false,
  ...props
}: InteractiveButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "confirm">("idle");

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || status === "loading") return;

    if (requireConfirm && status !== "confirm") {
      setStatus("confirm");
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setStatus((prev) => (prev === "confirm" ? "idle" : prev));
      }, 3000);
      return;
    }

    if (!onClick) return;

    try {
      setStatus("loading");
      const result = onClick(e);
      if (result instanceof Promise) {
        await result;
      }
      setStatus("success");
      if (successMessage) toast.success(successMessage);
      
      // Return to idle after a short delay
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const msg = errorMessage || err?.message || "Action failed";
      toast.error(msg);
      
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian disabled:opacity-50 disabled:pointer-events-none overflow-hidden btn-tap";
  
  const variants = {
    primary: "bg-blood-500 text-white hover:bg-blood-600 focus:ring-blood-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_12px_rgba(208,0,0,0.2)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_6px_16px_rgba(208,0,0,0.3)] border border-transparent",
    secondary: "bg-[var(--bg-elevated)] text-white hover:bg-white/[0.08] focus:ring-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_2px_4px_rgba(0,0,0,0.2)] border border-white/10 hover:border-white/20",
    danger: "bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300 focus:ring-red-500/40 border border-red-500/20 hover:border-red-500/40",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/[0.05] focus:ring-white/20",
  };

  const sizes = {
    default: "h-11 px-5 text-sm rounded-xl",
    sm: "h-9 px-4 text-xs rounded-lg",
    lg: "h-14 px-8 text-base rounded-2xl",
    icon: "h-11 w-11 rounded-xl",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || status === "loading" ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={handleClick}
      disabled={disabled || status === "loading"}
      {...props}
    >
      {/* Background Ripple Effect on Tap (handled by framer motion scale but could be enhanced) */}
      
      {/* Content wrapper to maintain button width while switching states */}
      <div className="flex items-center justify-center gap-2">
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === "success" && <Check className="h-4 w-4 text-emerald-400" />}
        {status === "error" && <X className="h-4 w-4 text-red-400" />}
        {status === "confirm" && <span className="text-amber-400">Confirm?</span>}
        
        {status === "idle" && children}
        {status === "loading" && <span className="opacity-70">Processing...</span>}
        {status === "success" && <span>Success</span>}
        {status === "error" && <span>Failed</span>}
      </div>
    </motion.button>
  );
}
