import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/adminEmail";

/**
 * Route protection:
 *   /dojo       -> requires logged-in user; dashboard handles status states
 *   /sensei     -> requires admin
 *   /admin      -> requires admin
 *   /dashboard  -> alias that bounces to /dojo (server-side redirect happens
 *                  in src/app/dashboard/page.tsx; middleware just lets it through)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDojo = pathname.startsWith("/dojo");
  const isSensei = pathname.startsWith("/sensei");
  const isAdmin = pathname.startsWith("/admin");

  if (!isDojo && !isSensei && !isAdmin) return NextResponse.next();

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

  const p: any = profile;

  if (isSensei || isAdmin) {
    const ok = p.role === "admin" && isAdminEmail(user.email);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
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
  matcher: ["/dojo/:path*", "/sensei/:path*", "/admin/:path*"]
};
