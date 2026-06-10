import type { SupabaseClient } from "@supabase/supabase-js";
import { logSenseiRpc } from "@/lib/senseiLog";

type RpcResult<T> = { data: T | null; error: string | null };

/**
 * Safely invoke a Supabase RPC. Always awaits the Postgrest builder —
 * never chains .catch() on rpc() directly (it is thenable, not a Promise).
 */
export async function safeRpc<T = unknown>(
  supabase: SupabaseClient,
  fn: string,
  params?: Record<string, unknown>,
  context?: string
): Promise<RpcResult<T>> {
  const label = context ?? fn;
  try {
    const builder = supabase.rpc(fn, params as never);
    const { data, error } = await builder;
    if (error) {
      logSenseiRpc(label, error);
      return { data: null, error: error.message };
    }
    return { data: (data as T) ?? null, error: null };
  } catch (err) {
    logSenseiRpc(label, err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}
