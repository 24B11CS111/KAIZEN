import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns null if the request is from a verified admin; otherwise returns
 * a NextResponse to short-circuit the route handler.
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

  const ok =
    profile?.role === "admin" &&
    process.env.ADMIN_EMAIL &&
    profile.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { supabase };
}
