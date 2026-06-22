import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminEmail";
import { isSuperAdmin } from "@/lib/superAdmin";

/**
 * Returns { supabase } if the request is from a verified admin;
 * otherwise returns a NextResponse to short-circuit the route handler.
 *
 * Admin = profiles.is_admin === true AND authenticated email matches the owner email.
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
  const ok = isSuperAdmin(user?.email || p?.email) || (p && p.is_admin === true) || isAdminEmail(user?.email || p?.email);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { supabase, user, profile: p };
}

import { redirect } from "next/navigation";

export async function requireAdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sensei");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const p: any = profile;
  const ok = isSuperAdmin(user?.email || p?.email) || (p && p.is_admin === true) || isAdminEmail(user?.email || p?.email);
  
  if (!ok) {
    console.log("[requireAdminPage] Admin Gate Failed:", { 
      userEmail: user?.email, 
      profileEmail: p?.email,
      isAdmin: p?.is_admin 
    });
    redirect("/dojo");
  }
  
  return { supabase, user, profile: p };
}
