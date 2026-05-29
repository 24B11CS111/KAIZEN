/**
 * KAIZEN.SYS — Canonical site URL utility.
 *
 * The site URL must be ABSOLUTE for Supabase auth redirects (redirectTo,
 * emailRedirectTo). GoTrue validates these against the Redirect URL allowlist
 * configured in Supabase Dashboard -> Authentication -> URL Configuration.
 *
 * Priority order:
 *   1. NEXT_PUBLIC_SITE_URL        -- explicit override; set in Vercel env vars (Production)
 *   2. NEXT_PUBLIC_VERCEL_URL      -- optional public override
 *   3. VERCEL_URL                  -- auto-injected by Vercel for server runtimes
 *   4. window.location.origin      -- browser fallback (local dev)
 *   5. Hard-coded production URL   -- last resort for server-side code
 *
 * Production domain: https://kaizen-ikyw.vercel.app
 *
 * Supabase Dashboard -> Auth -> URL Configuration -> Redirect URLs MUST include:
 *   https://kaizen-ikyw.vercel.app/auth/callback?*
 *   https://*.vercel.app/auth/callback?*      (covers all preview deployments)
 *   http://localhost:3000/auth/callback?*     (local dev)
 * The ?* wildcard is REQUIRED -- GoTrue rejects any URL with query params otherwise.
 */

/**
 * Returns the canonical site URL -- always without a trailing slash.
 * Safe to call from both browser and server/edge contexts.
 */
export function getSiteUrl(): string {
  // 1. Explicit production override -- highest priority.
  //    Set NEXT_PUBLIC_SITE_URL=https://kaizen-ikyw.vercel.app in Vercel env vars.
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // 2. Optional public Vercel override.
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    return "https://" + vercelUrl;
  }

  // 3. Vercel server runtime host. This is the canonical built-in env var.
  const serverVercelUrl = process.env.VERCEL_URL;
  if (serverVercelUrl) {
    return "https://" + serverVercelUrl;
  }

  // 4. Browser origin -- works for local dev and any non-Vercel host.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 5. Hard-coded production fallback -- last resort so server-side code
  //    (e.g. callback route) always has an absolute base URL.
  return "https://kaizen-ikyw.vercel.app";
}

/**
 * Build the absolute callback URL used in Supabase redirectTo /
 * emailRedirectTo options. Always absolute, always sanitized.
 *
 * Example: buildCallbackUrl("/dojo")
 *   -> "https://kaizen-ikyw.vercel.app/auth/callback?next=%2Fdojo"
 */
export function buildCallbackUrl(next: string): string {
  const safeNext = sanitizeNextPath(next);
  return getSiteUrl() + "/auth/callback?next=" + encodeURIComponent(safeNext);
}

/**
 * Sanitize a `next` redirect path so it is always a safe relative path.
 *
 * Guards against:
 *   - Open redirects: "//evil.com/steal" -> "/dojo"
 *   - Absolute URLs: "https://evil.com" -> "/dojo"
 *   - Empty / non-string values -> "/dojo"
 *   - Paths starting with "/_next/" (internal Next.js asset paths) -> "/dojo"
 *
 * Returns a path that Next.js router.replace() and router.push() will accept.
 */
export function sanitizeNextPath(raw: unknown): string {
  if (typeof raw !== "string" || raw === "") return "/dojo";
  // Must start with "/" but NOT with "//" (protocol-relative open redirect)
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dojo";
  // Must not contain a protocol -- catches "data:", "javascript:", etc.
  if (raw.includes("://")) return "/dojo";
  // Block internal Next.js paths -- users should never land on these.
  if (raw.startsWith("/_next/")) return "/dojo";
  return raw;
}
