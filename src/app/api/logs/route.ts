import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

const LogSchema = z.object({
  log_message: z.string().min(1),
  container_name: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  user_id: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase()
      .from("events")
      .insert([parsed.data])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, event: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const containerName = searchParams.get("container_name");
    const severity = searchParams.get("severity");
    const userId = searchParams.get("user_id");
    const limit = Number(searchParams.get("limit") ?? 100);

    let q = supabase()
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (containerName) q = q.eq("container_name", containerName);
    if (severity) q = q.eq("severity", severity);
    if (userId) q = q.eq("user_id", userId);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
