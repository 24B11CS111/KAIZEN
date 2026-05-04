import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminEmail";

/**
 * Returns { supabase } if the request is from a verified admin;
 * otherwise returns a NextResponse to short-circuit the route handler.
 *
 * Admin = profiles.role === "admin" AND email matches ADMIN_EMAIL
 * (defaults to hrixofficial@gmail.com).
 */
export async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .maybeSingle();

  const p: any = profile;
  const ok = p && p.role === "admin" && isAdminEmail(p.email);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { supabase };
}
