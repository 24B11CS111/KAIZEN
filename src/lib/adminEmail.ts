/**
 * Single source of truth for the admin email + check.
 * - Defaults to hrixofficial@gmail.com.
 * - Set ADMIN_EMAIL in .env.local to override (case-insensitive).
 */
export const ADMIN_EMAIL =
  (process.env.ADMIN_EMAIL || "hrixofficial@gmail.com").toLowerCase();

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL;
}
