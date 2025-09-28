// src/app/api/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

const BodySchema = z.object({
  container_name: z.string().min(1),
  status: z.enum(["up","down","heartbeat"]),
  user_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const payload = parsed.data;

    // 1) Guarda status_event
    const { data: statusRow, error: statusErr } = await supabase()
      .from("status_events")
      .insert([payload])
      .select("*")
      .single();
    if (statusErr) return NextResponse.json({ error: statusErr.message }, { status: 500 });

    // 2) Genera evento sintético para el stream (sin tocar UI)
    if (payload.status === "down") {
      await supabase().from("events").insert([{
        log_message: `Container '${payload.container_name}' is DOWN`,
        container_name: payload.container_name,
        severity: "error",
        user_id: payload.user_id ?? null,
        status: "open",
      }]);
    } else if (payload.status === "up") {
      await supabase().from("events").insert([{
        log_message: `Container '${payload.container_name}' is back UP`,
        container_name: payload.container_name,
        severity: "warning",
        user_id: payload.user_id ?? null,
        status: "open",
      }]);
    }

    return NextResponse.json({ ok: true, event: statusRow }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const container = searchParams.get("container_name") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 100);

    let q = supabase().from("status_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (container) q = q.eq("container_name", container);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
