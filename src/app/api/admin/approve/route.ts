import { NextResponse } from "next/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { requireAdmin } from "@/lib/admin";
import { AdminActionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase } = guard;

  const parsed = AdminActionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !parsed.data.utr_id) {
    return NextResponse.json({ error: "utr_id required" }, { status: 400 });
  }

  const { error } = await supabase.rpc("approve_utr", { p_utr_id: parsed.data.utr_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
