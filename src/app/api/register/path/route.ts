import { NextResponse } from "next/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { RegisterPathSchema } from "@/lib/validation";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient
} from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Save path + branch to the user's profile.
 *
 * Identification - tries in order:
 *   1. Authenticated session cookie (preferred)
 *   2. email + password in body (admin lookup, signs them in then updates)
 *
 * #2 covers the "Supabase email-confirm is ON, signup didn't establish a
 * session" case, so the registration flow never breaks at step 3.
 */
export async function POST(request: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = RegisterPathSchema.safeParse({
    path_type: body?.path_type,
    branch: body?.branch
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid selection" },
      { status: 400 }
    );
  }

  // Path 1 - have a session
  if (user) {
    const { error } = await supabase
      .from("profiles")
      .update({
        path_type: parsed.data.path_type,
        branch: parsed.data.branch,
        // Mark as onboarded so the user can reach /dojo without going
        // through the new /onboarding flow as well (legacy /register users
        // are grandfathered in).
        onboarded_at: new Date().toISOString()
      })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, via: "session" });
  }

  // Path 2 - admin fallback via email lookup
  const email = (body?.email || "").toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "No active session. Please sign in (or include email in body)." },
      { status: 401 }
    );
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured." },
      { status: 500 }
    );
  }

  try {
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list?.users.find(
      (u: any) => (u.email ?? "").toLowerCase() === email
    );
    if (!found) {
      return NextResponse.json(
        { error: "Account not found. Sign up first." },
        { status: 404 }
      );
    }
    const { error } = await admin
      .from("profiles")
      .update({
        path_type: parsed.data.path_type,
        branch: parsed.data.branch,
        // Mark as onboarded so the user can reach /dojo without going
        // through the new /onboarding flow as well (legacy /register users
        // are grandfathered in).
        onboarded_at: new Date().toISOString()
      })
      .eq("id", found.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, via: "admin" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Could not save path" },
      { status: 500 }
    );
  }
}
