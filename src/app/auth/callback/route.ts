import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

/**
 * Auth callback.
 *
 * Handles server-side auth code exchange and redirects to a safe `next`
 * destination. This remains as a generic auth completion route, even though
 * KAIZEN now uses email/password auth only.
 */
export async function GET(request: NextRequest) {
  let origin: string;
  let searchParams: URLSearchParams;

  try {
    const url = new URL(request.url);
    origin = url.origin;
    searchParams = url.searchParams;
  } catch {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next") || "/dojo");

  const errorParam =
    searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    console.error("[auth/callback] provider returned error", {
      error: errorParam,
      next
    });
    try {
      const url = new URL("/auth/login", origin);
      url.searchParams.set("error", errorParam);
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(next)}`, origin));
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession returned error", {
        message: error.message,
        status: (error as { status?: number }).status,
        code: (error as { code?: string }).code,
        next
      });
      try {
        const url = new URL("/auth/login", origin);
        url.searchParams.set("error", error.message || "Sign-in failed.");
        return NextResponse.redirect(url);
      } catch {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
    }
  } catch (e) {
    console.error("[auth/callback] exchangeCodeForSession threw:", e);
    try {
      const url = new URL("/auth/login", origin);
      url.searchParams.set(
        "error",
        e instanceof Error ? e.message : "Sign-in failed. Please try again."
      );
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  try {
    return NextResponse.redirect(new URL(next, origin));
  } catch {
    return NextResponse.redirect(new URL("/dojo", origin));
  }
}
