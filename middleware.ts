import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/middleware";

/**
 * Route protection — defensive, cookie-propagating edition.
 *
 * Critical invariants:
 *
 *   1. NEVER throw. Any unexpected error results in `NextResponse.next()` so
 *      we'd rather render the page and let the server component handle auth
 *      than show a blank 500.
 *
 *   2. NEVER infinite-redirect. Profile lookup failures fall through.
 *
 *   3. ALWAYS carry refreshed cookies on every response — including redirects.
 *      `getUserFromRequest` may have refreshed the access token (if it was
 *      expiring). The new Set-Cookie headers live on `response`. If we return
 *      a brand-new `NextResponse.redirect()` we LOSE those headers, meaning
 *      the next request arrives with a stale/expired token and Supabase
 *      refuses it → infinite redirect loop in production.
 *
 *      Fix: `withAuthCookies(response, redirect)` copies the Set-Cookie
 *      header from the auth-aware response onto every redirect we return.
 */

/** Copy refreshed-session Set-Cookie headers from `src` into `dst`. */
function withAuthCookies(src: NextResponse, dst: NextResponse): NextResponse {
  const setCookie = src.headers.get("set-cookie");
  if (setCookie) {
    dst.headers.set("set-cookie", setCookie);
  }
  return dst;
}

export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isDojo       = pathname.startsWith("/dojo");
  const isSensei     = pathname.startsWith("/sensei");
  const isAdmin      = pathname.startsWith("/admin");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isProfile    = pathname.startsWith("/profile");
  const isProgress   = pathname.startsWith("/progress");

  if (!isDojo && !isSensei && !isAdmin && !isOnboarding && !isProfile && !isProgress) {
    return NextResponse.next();
  }

  let ctx;
  try {
    ctx = await getUserFromRequest(request);
  } catch (e) {
    console.error("[middleware] auth fetch failed:", e);
    // If we can't reach Supabase, let the page render — the server component
    // handles unauth and will redirect cleanly instead of giving a 500.
    return NextResponse.next();
  }
  const { response, supabase, user } = ctx;

  // Unauthenticated: redirect to login, no cookies to carry.
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Defensive profile fetch — try the rich shape first, fall back to
  // a minimal one if the schema hasn't been migrated yet.
  let profileRow: any = null;
  try {
    const res = await supabase
      .from("profiles")
      .select("role,is_admin,email,subscription_status,expiry_date,onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    profileRow = res.data;

    if (res.error) {
      // Likely `onboarded_at` column doesn't exist yet — retry without it.
      const fb = await supabase
        .from("profiles")
        .select("role,is_admin,email,subscription_status,expiry_date")
        .eq("id", user.id)
        .maybeSingle();
      profileRow = fb.data;
    }
  } catch (e) {
    console.error("[middleware] profile fetch threw:", e);
  }

  // If we couldn't load a profile at all, let the page render.
  if (!profileRow) {
    return response;
  }

  const p: any = profileRow;

  // --- Admin / Sensei gate ---
  if (isSensei || isAdmin) {
    const ok = p.is_admin === true;
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return withAuthCookies(response, NextResponse.redirect(url));
    }
    return response;
  }

  // --- Onboarding gate ---
  // Only logged-in users reach here. If already onboarded, send them on.
  // If the column doesn't exist, treat as "not onboarded" and allow.
  if (isOnboarding) {
    if (p.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/dojo";
      return withAuthCookies(response, NextResponse.redirect(url));
    }
    return response;
  }

  // --- Onboarding required gate (dojo / profile / progress) ---
  // Only redirect if the column exists and is null. If it's `undefined`
  // (not yet migrated), skip so old accounts can reach their dashboard.
  const onboardedAtPresent = Object.prototype.hasOwnProperty.call(p, "onboarded_at");
  if (onboardedAtPresent && !p.onboarded_at) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return withAuthCookies(response, NextResponse.redirect(url));
  }

  // --- Dojo ban gate ---
  if (isDojo) {
    const blocked =
      p.subscription_status === "banned" ||
      p.subscription_status === "rejected";
    if (blocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return withAuthCookies(response, NextResponse.redirect(url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dojo/:path*",
    "/sensei/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/progress/:path*"
  ]
};
