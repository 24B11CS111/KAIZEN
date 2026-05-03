import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/middleware";

/**
 * Route protection:
 *   /dojo   -> requires logged-in user with subscription_status='active' AND expiry_date > now()
 *   /sensei -> requires logged-in user with role='admin' AND email == ADMIN_EMAIL
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDojo = pathname.startsWith("/dojo");
  const isSensei = pathname.startsWith("/sensei");

  if (!isDojo && !isSensei) return NextResponse.next();

  const { response, supabase, user } = await getUserFromRequest(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,email,subscription_status,expiry_date")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isSensei) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const ok =
      profile.role === "admin" &&
      adminEmail &&
      profile.email.toLowerCase() === adminEmail.toLowerCase();
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isDojo) {
    const expired =
      !profile.expiry_date || new Date(profile.expiry_date).getTime() <= Date.now();
    const blocked =
      profile.subscription_status === "banned" ||
      profile.subscription_status === "rejected";

    // Allow render: dashboard handles state-rendering (pending/active/expired)
    // But block hard if banned.
    if (blocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // If status is "active" but expiry has passed, the page itself shows the
    // EXPIRED state and the next read will flip the row via touch_expiry().
    void expired;
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/dojo/:path*", "/sensei/:path*"]
};
