import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const dynamic = "force-dynamic";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

type RouteContext<TParams> = {
  params: Promise<TParams>;
};

export async function GET(_req: NextRequest, { params }: RouteContext<{ id: string }>) {
  const { id } = await params;

  const { data, error } = await supabase()
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}

const PatchSchema = z.object({
  action: z.enum(["resolve", "ignore"]),
  user_id: z.string().uuid().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext<{ id: string }>) {
  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const client = supabase();

    let update: Record<string, unknown>;
    if (parsed.data.action === "resolve") {
      update = {
        status: "resolved",
        resolved_at: now,
        resolved_by: parsed.data.user_id ?? null,
      };
    } else {
      update = {
        status: "ignored",
        ignored_at: now,
        ignored_by: parsed.data.user_id ?? null,
      };
    }

    const { data, error } = await client
      .from("events")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, event: data }, { status: 200 });
  } catch (e) {
    console.error("PATCH /api/logs/[id] error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
