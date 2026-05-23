/**
 * Env validation for Supabase clients.
 *
 * Throws a single, actionable error message when required vars are
 * missing - so devs see "fix .env.local" instead of the cryptic
 * "Your project URL and Key are required" from supabase-js.
 *
 * Used by:
 *   - src/lib/supabase/client.ts (browser)
 *   - src/lib/supabase/server.ts (RSC + route handlers)
 *   - src/lib/supabase/middleware.ts (Edge middleware)
 */

interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/** Public (browser-safe) env. Throws if URL or anon key are missing. */
export function readPublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ].filter(Boolean).join(", ");

    throw new Error(
      "[Supabase] Missing env: " + missing + ". " +
      "Add them to .env.local at the project root, then RESTART `npm run dev` " +
      "(Next.js only reads env at startup). " +
      "If your project is linked to Vercel, run `vercel env pull .env.local`. " +
      "Get your keys from Supabase Dashboard -> Project -> Settings -> API."
    );
  }

  return { url, anonKey };
}

/** Server-only env (includes service role). Never call from a Client Component. */
export function readServerSupabaseEnv(): SupabaseEnv {
  const pub = readPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { ...pub, serviceRoleKey };
}

/** Strict variant - throws if service role is also missing. */
export function readAdminSupabaseEnv(): Required<SupabaseEnv> {
  const env = readServerSupabaseEnv();
  if (!env.serviceRoleKey) {
    throw new Error(
      "[Supabase] Missing env: SUPABASE_SERVICE_ROLE_KEY. " +
      "Required for admin operations. Add it to .env.local (server-only - " +
      "do NOT prefix with NEXT_PUBLIC_)."
    );
  }
  return env as Required<SupabaseEnv>;
}
