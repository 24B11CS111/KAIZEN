/**
 * Naive in-memory rate limiter (per-IP, sliding window).
 * Adequate for single-region deploys / dev. For production multi-instance,
 * swap for Upstash Redis: see https://upstash.com/docs/oss/sdks/ts/ratelimit
 */

type Bucket = { hits: number[]; };
const buckets = new Map<string, Bucket>();

const MAX = Number(process.env.RATE_LIMIT_MAX ?? 3);
const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 60 * 1000);

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, max = MAX, windowMs = WINDOW): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= max) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0];
    return { ok: false, remaining: 0, resetAt: oldest + windowMs };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: max - bucket.hits.length, resetAt: now + windowMs };
}

/** Best-effort client IP from request headers (works on Vercel + most edges). */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
