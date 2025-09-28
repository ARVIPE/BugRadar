// src/app/api/latency/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

/**
 * GET /api/latency
 * Devuelve datos de latencia para la página de "insights".
 */
export async function GET() {
  try {
    // Traemos los registros de las últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase()
      .from("latency_checks")
      .select("endpoint, method, latency_ms, status_code, created_at")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching latency data:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (e: any) {
    console.error("Unexpected error in GET /api/latency:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/latency
 * Lo llama el agente para reportar la latencia de un endpoint.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, method, latency_ms, status_code, user_id } = body;

    // Validación
    if (!endpoint || !method || typeof latency_ms !== 'number' || typeof status_code !== 'number') {
      return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
    }
    if (!user_id) {
        return NextResponse.json({ error: "'user_id' is required" }, { status: 400 });
    }

    const { error } = await supabase().from("latency_checks").insert({
      endpoint,
      method,
      latency_ms,
      status_code,
      user_id,
    });

    if (error) {
      console.error("Error inserting latency data:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (e: any) {
    console.error("Unexpected error in POST /api/latency:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
