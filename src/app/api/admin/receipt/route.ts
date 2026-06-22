import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Admin
    await requireAdmin();

    // 2. Extract path
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    
    if (!path) {
      return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    
    // 3. Generate Signed URL
    const { data, error } = await (supabase as any).storage
      .from("receipts")
      .createSignedUrl(path, 60 * 60); // 1 hour validity

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not generate URL" }, { status: 500 });
    }

    // Redirect the admin's browser to the actual image URL
    return NextResponse.redirect(data.signedUrl);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
