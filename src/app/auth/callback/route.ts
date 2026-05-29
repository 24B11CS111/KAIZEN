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
 *   - Token-in-fragment (#access_token=...) -> SSR cannot see fragments,
 *     so we render a tiny client-side bridge page that reads the
 *     fragment and forwards it to the destination app page.
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
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next") || "/dojo");

  const errorParam =
    searchParams.get("error_description") || searchParams.get("error");

  // 1. Provider-side errors come back as ?error=... -- surface them cleanly.
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

  // 2. Some providers return tokens in the URL FRAGMENT (#...). Server
  //    cannot read fragments. Render a client bridge that forwards the
  //    hash to the destination page where the Supabase SDK is loaded.
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

/**
 * Tiny self-contained HTML page.
 *
 * Some OAuth providers (implicit flow) return tokens in the URL fragment
 * (#access_token=...). The server can never see fragments, so this bridge
 * forwards the hash to the destination page where the Supabase browser
 * client is loaded and will call onAuthStateChange to persist the session.
 *
 * CRITICAL: window.location.hash must be appended to dest. Without it the
 * implicit-flow tokens are silently dropped and the user gets a blank screen.
 */
function fragmentBridgeHtml(next: string, origin: string): string {
  const safeNext = next.replace(/"/g, "%22");
  const safeOrigin = origin.replace(/"/g, "%22");
  /* eslint-disable no-useless-escape */
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\" />",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />",
    "<title>KAIZEN.SYS \u2014 Entering the dojo...</title>",
    "<style>",
    "  html,body{margin:0;padding:0;background:#050505;color:#fff;font-family:-apple-system,system-ui,sans-serif;height:100%;display:grid;place-items:center}",
    "  .pulse{width:48px;height:48px;border-radius:999px;background:rgba(208,0,0,0.15);border:1px solid rgba(208,0,0,0.45);box-shadow:0 0 24px rgba(208,0,0,0.45);display:grid;place-items:center}",
    "  .pulse::after{content:\"\";width:14px;height:14px;border-radius:999px;background:#D00000;box-shadow:0 0 12px rgba(208,0,0,0.7);animation:p 1.2s ease-in-out infinite}",
    "  @keyframes p{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}",
    "  .t{margin-top:18px;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.55)}",
    "</style>",
    "</head>",
    "<body>",
    "  <div style=\"text-align:center\">",
    "    <div class=\"pulse\"></div>",
    '    <div class="t">KAIZEN<span style="color:#D00000">.</span>SYS</div>',
    "  </div>",
    "  <script type=\"module\">",
    "    const hash = window.location.hash;",
    '    const dest = "' + safeOrigin + '" + "' + safeNext + '";',
    "    window.location.replace(dest + hash);",
    "  <\/script>",
    "</body>",
    "</html>"
  ].join("\n");
}
