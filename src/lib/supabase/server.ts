import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv, readAdminSupabaseEnv } from "./env";
import type { Database } from "@/types/database";

/**
 * Server client bound to the user's request cookies (RLS-respecting).
 *
 * Return type is explicitly annotated as SupabaseClient<Database> from
 * @supabase/supabase-js so that the full typed schema (Tables, Functions …)
 * is available on every caller.  Without the annotation, @supabase/ssr
 * v0.5.x passes generics in a different order than supabase-js v2.45+ expects,
 * causing Schema to resolve as `never` and collapsing all RPC / table types.
 */
export function createSupabaseServerClient(): SupabaseClient<Database> {
  const { url, anonKey } = readPublicSupabaseEnv();
  const cookieStore = cookies();
  return createServerClient<Database>(url, anonKey, {
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
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Service-role Supabase client. Bypasses RLS.
 * USE ONLY in trusted server code (API routes, server actions, RSC).
 * NEVER expose this client or its key to the browser.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { url, serviceRoleKey } = readAdminSupabaseEnv();
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
