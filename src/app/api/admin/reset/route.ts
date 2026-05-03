import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { AdminActionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase } = guard;

  const parsed = AdminActionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !parsed.data.user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { error } = await supabase.rpc("reset_progress", { p_user_id: parsed.data.user_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
