import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv, readAdminSupabaseEnv } from "./env";

/** Server client bound to the user's request cookies (RLS-respecting). */
export function createSupabaseServerClient() {
  const { url, anonKey } = readPublicSupabaseEnv();
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: any) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* RSC: ignore - happens when called from a Server Component
             outside an action; cookie mutation is not allowed there. */
        }
      },
      remove: (name: string, options: any) => {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          /* RSC: ignore */
        }
      }
    }
  });
}

/**
 * Service-role Supabase client. Bypasses RLS.
 * USE ONLY in trusted server code (API routes, server actions, RSC).
 * NEVER expose this client or its key to the browser.
 */
export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = readAdminSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
