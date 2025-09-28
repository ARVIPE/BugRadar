// src/app/api/logs/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabase()
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data, { status: 200 });
}

const PatchSchema = z.object({
  action: z.enum(["resolve", "ignore"]),
  user_id: z.string().uuid().optional(), // opcional: quién lo hace
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date().toISOString();
    const client = supabase();

    let update: Record<string, any> = {};
    if (parsed.data.action === "resolve") {
      update = { status: "resolved", resolved_at: now, resolved_by: parsed.data.user_id ?? null };
    } else if (parsed.data.action === "ignore") {
      update = { status: "ignored", ignored_at: now, ignored_by: parsed.data.user_id ?? null };
    }

    const { data, error } = await client
      .from("events")
      .update(update)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, event: data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
