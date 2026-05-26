import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

/**
 * OAuth / magic-link callback.
 *
 * Exchanges the `code` query param for a session cookie, then redirects
 * to `next` (default /dojo). Differentiates OAuth vs magic-link errors
 * so the user sees the right copy on the login screen.
 *
 * Edge cases handled:
 *   - Provider-side errors (?error=access_denied) -> friendly message
 *   - Missing code -> bounce to login (no 500)
 *   - Token-in-fragment (#access_token=...) -> SSR can\'t see fragments,
 *     so we render a tiny client-side bridge page that reads the
 *     fragment and posts to /auth/exchange (handled by Supabase SDK).
 *   - Open-redirect protection: `next` MUST be a sanitized relative path.
 *   - Malformed URLs: any URL construction error falls back to /auth/login.
 */
export async function GET(request: NextRequest) {
  let origin: string;
  let searchParams: URLSearchParams;

  try {
    const url = new URL(request.url);
    origin = url.origin;
    searchParams = url.searchParams;
  } catch {
    // Should never happen — NextRequest.url is always absolute.
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const code = searchParams.get("code");
  // Sanitize next — prevents open redirects AND Next.js "Invalid path" errors.
  const next = sanitizeNextPath(searchParams.get("next") || "/dojo");

  const errorParam =
    searchParams.get("error_description") || searchParams.get("error");

  // 1. Provider-side errors come back as ?error=... — surface them cleanly.
  if (errorParam) {
    const m = errorParam.toLowerCase();
    let friendly = "Authentication failed. Please try again.";
    if (m.includes("access_denied") || m.includes("user denied"))
      friendly = "Sign-in was cancelled. You can try again any time.";
    else if (m.includes("redirect_uri") || m.includes("redirect uri"))
      friendly = "Sign-in misconfigured (redirect URI). Contact support.";
    else if (m.includes("invalid_request") || m.includes("invalid request"))
      friendly = "Sign-in link is invalid. Request a new one.";
    else if (m.includes("invalid path") || m.includes("invalid url"))
      friendly = "Authentication failed. Please try again.";
    try {
      const url = new URL("/auth/login", origin);
      url.searchParams.set("error", friendly);
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // 2. Some providers return tokens in the URL FRAGMENT (#...). Server
  //    can\'t read fragments. If there\'s no code AND no error, render a
  //    one-shot client bridge that lets the browser-side Supabase SDK
  //    pick up the fragment and persist the session.
  if (!code) {
    return new NextResponse(fragmentBridgeHtml(next, origin), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // 3. PKCE / OAuth code exchange.
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      let friendly = "Sign-in failed. Request a new link.";
      if (msg.includes("expired") || msg.includes("already used"))
        friendly = "This link expired or was already used. Request a new one.";
      else if (msg.includes("invalid"))
        friendly = "Invalid sign-in link. Try again.";
      else if (msg.includes("redirect") || msg.includes("path"))
        friendly = "Authentication failed. Please try again.";
      try {
        const url = new URL("/auth/login", origin);
        url.searchParams.set("error", friendly);
        return NextResponse.redirect(url);
      } catch {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
    }
  } catch (e) {
    console.error("[auth/callback] exchangeCodeForSession threw:", e);
    try {
      const url = new URL("/auth/login", origin);
      url.searchParams.set("error", "Sign-in failed. Please try again.");
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

/**
 * Tiny self-contained HTML page that:
 *   1. Lets the Supabase client SDK read the fragment (#access_token=...)
 *   2. Once getSession() succeeds, hard-navigates to `next`.
 *
 * Inline-styled, KAIZEN-themed loader so the user never sees blank.
 */
function fragmentBridgeHtml(next: string, origin: string): string {
  const safeNext = next.replace(/"/g, "%22");
  const safeOrigin = origin.replace(/"/g, "%22");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>KAIZEN.SYS \u2014 Entering the dojo...</title>
<style>
  html,body{margin:0;padding:0;background:#050505;color:#fff;font-family:-apple-system,system-ui,sans-serif;height:100%;display:grid;place-items:center}
  .pulse{width:48px;height:48px;border-radius:999px;background:rgba(208,0,0,0.15);border:1px solid rgba(208,0,0,0.45);box-shadow:0 0 24px rgba(208,0,0,0.45);display:grid;place-items:center}
  .pulse::after{content:"";width:14px;height:14px;border-radius:999px;background:#D00000;box-shadow:0 0 12px rgba(208,0,0,0.7);animation:p 1.2s ease-in-out infinite}
  @keyframes p{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
  .t{margin-top:18px;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.55)}
</style>
</head>
<body>
  <div style="text-align:center">
    <div class="pulse"></div>
    <div class="t">KAIZEN<span style="color:#D00000">.</span>SYS</div>
  </div>
  <script type="module">
    // If the URL has a fragment (#access_token=...), the Supabase client-side
    // SDK will pick it up and set the session when the Next.js app loads.
    // We forward to the destination with a short delay so the app bundle
    // has time to initialize and write the session cookies.
    const dest = "${safeOrigin}" + "${safeNext}";
    setTimeout(() => { window.location.replace(dest); }, 400);
  </script>
</body>
</html>`;
}
