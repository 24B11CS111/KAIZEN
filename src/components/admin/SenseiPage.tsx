import type { ReactNode } from "react";

interface SenseiPageProps {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
  /** Use for pages that need a fixed viewport height (tables, split panels). */
  fullHeight?: boolean;
}

/**
 * Shared page wrapper for Sensei routes — full-width SaaS layout, no mobile max-w constraints.
 */
export function SenseiPage({ children, title, description, className = "", fullHeight }: SenseiPageProps) {
  return (
    <div
      className={`w-full animate-in fade-in duration-500 ${
        fullHeight ? "flex flex-col min-h-[calc(100svh-8rem)] lg:min-h-[calc(100svh-9rem)]" : "space-y-6"
      } ${className}`}
    >
      <header className="shrink-0 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-white/50 text-sm mt-1 max-w-3xl">{description}</p>
        )}
      </header>
      <div className={fullHeight ? "flex-1 min-h-0 flex flex-col" : "w-full"}>{children}</div>
    </div>
  );
}
