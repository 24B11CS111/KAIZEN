"use client";
import { createBrowserClient } from "@supabase/ssr";
import { readPublicSupabaseEnv } from "./env";

/**
 * Browser-side Supabase client. Untyped at the schema level - the
 * project doesn't ship Supabase-generated types, so the typed client
 * would collapse every query result to `never`. Runtime is unchanged.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = readPublicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
