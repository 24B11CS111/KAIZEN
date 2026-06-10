/**
 * Server-side logging for Sensei dashboard operations.
 * All failures are logged; none should crash the dashboard.
 */

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export function logSenseiFetch(context: string, error: unknown): void {
  console.error(`[sensei] fetch failed (${context}):`, formatError(error));
}

export function logSenseiRpc(context: string, error: unknown): void {
  console.error(`[sensei] rpc failed (${context}):`, formatError(error));
}

export function logSenseiRealtime(context: string, error: unknown): void {
  console.error(`[sensei] realtime failed (${context}):`, formatError(error));
}
