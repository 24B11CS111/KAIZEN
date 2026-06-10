/** Routes that keep the centered mobile-app shell (max-w-md). */
export const MOBILE_SHELL_PREFIXES = [
  "/dojo",
  "/progress",
  "/profile",
  "/notifications",
  "/auth",
  "/onboarding",
] as const;

/** Sensei admin dashboard — full-width desktop shell. */
export const ADMIN_SHELL_PREFIX = "/sensei";

export function isAdminRoute(pathname: string): boolean {
  return pathname === ADMIN_SHELL_PREFIX || pathname.startsWith(`${ADMIN_SHELL_PREFIX}/`);
}

export function isMobileShellRoute(pathname: string): boolean {
  return MOBILE_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
