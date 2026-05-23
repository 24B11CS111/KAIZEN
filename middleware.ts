import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/adminEmail";

/**
 * Route protection — defensive edition.
 *
 * Critical invariants (post-refresh blank-screen fix):
 *
 *   1. NEVER throw. Any unexpected error (missing column, network blip)
 *      results in `NextResponse.next()` — we'd rather render the page
 *      and let the server component / client handle the auth boundary
 *      than show a blank 500.
 *
 *   2. NEVER infinite-redirect. If the profile lookup fails we don't
 *      redirect — we let the request through and the page itself
 *      decides what to render.
 *
 *   3. Tolerant of un-migrated schema. If `onboarded_at` doesn't exist
 *      we use a defensive select with fewer columns + fallback.
 */
export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isDojo = pathname.startsWith("/dojo");
  const isSensei = pathname.startsWith("/sensei");
  const isAdmin = pathname.startsWith("/admin");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isProfile = pathname.startsWith("/profile");

  if (!isDojo && !isSensei && !isAdmin && !isOnboarding && !isProfile) {
    return NextResponse.next();
  }

  let ctx;
  try {
    ctx = await getUserFromRequest(request);
  } catch (e) {
    console.error("[middleware] auth fetch failed:", e);
    // If we can't even reach Supabase, let the page render — the server
    // component will handle unauth and redirect cleanly instead of us
    // returning a 500.
    return NextResponse.next();
  }
  const { response, supabase, user } = ctx;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Defensive profile fetch — try the rich shape first, fall back to
  // a minimal one if the schema hasn't been migrated yet.
  let profileRow: any = null;
  let profileFetchErr: any = null;
  try {
    const res = await supabase
      .from("profiles")
      .select("role,email,subscription_status,expiry_date,onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    profileRow = res.data;
    profileFetchErr = res.error;
    if (profileFetchErr) {
      // Most likely the onboarded_at column doesn't exist yet. Retry
      // without it so the rest of the gates still work.
      const fb = await supabase
        .from("profiles")
        .select("role,email,subscription_status,expiry_date")
        .eq("id", user.id)
        .maybeSingle();
      profileRow = fb.data;
      profileFetchErr = fb.error;
    }
  } catch (e) {
    console.error("[middleware] profile fetch threw:", e);
    profileFetchErr = e;
  }

  // If we couldn't load a profile at all, let the page render. The
  // server component for that route can decide whether to redirect.
  if (!profileRow) {
    return response;
  }

  const p: any = profileRow;

  if (isSensei || isAdmin) {
    const ok = p.role === "admin" && isAdminEmail(user.email);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // /onboarding: only logged-in users. If already onboarded, send them on.
  // If the column doesn't exist, treat as "not onboarded" and allow.
  if (isOnboarding) {
    if (p.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/dojo";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Pages below this point assume the user must have onboarded first
  // — BUT only redirect if the column actually exists and is null. If
  // the column is `undefined` (not yet migrated), skip the gate so old
  // accounts can still reach their dashboard.
  const onboardedAtPresent = Object.prototype.hasOwnProperty.call(p, "onboarded_at");
  if (onboardedAtPresent && !p.onboarded_at) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (isDojo) {
    const blocked =
      p.subscription_status === "banned" ||
      p.subscription_status === "rejected";
    if (blocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/dojo/:path*",
    "/sensei/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/profile/:path*"
  ]
};
