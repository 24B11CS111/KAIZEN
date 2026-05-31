import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns { supabase } if the request is from a verified admin;
 * otherwise returns a NextResponse to short-circuit the route handler.
 *
 * Admin = profiles.is_admin === true
 */
export async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const p: any = profile;
  const ok = p && p.is_admin === true;
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { supabase, user, profile: p };
}
