import { NextResponse } from "next/server";
import { RegisterPathSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = RegisterPathSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid selection" },
      { status: 400 }
    );
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      path_type: parsed.data.path_type,
      branch: parsed.data.branch
    })
    .eq("id", user.id);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message ?? "Could not save path" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
