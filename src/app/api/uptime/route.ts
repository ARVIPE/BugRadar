// src/app/api/uptime/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// Umbral para considerar un ping como "reciente"
const FRESH_SEC = Number(process.env.UPTIME_FRESH_SEC ?? "180");

/**
 * GET /api/uptime
 * Devuelve el último valor de uptime registrado.
 */
export async function GET() {
  try {
    // 1. Pedir el último registro de la tabla de pings
    const { data, error } = await supabase()
      .from("uptime_checks")
      .select("created_at, uptime_percent")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching uptime from Supabase:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const lastCheck = data?.[0];

    // 2. Si no hay datos, devolvemos 0%
    if (!lastCheck) {
      return NextResponse.json({ uptime: 0 });
    }

    // 3. Comprobar si el último ping es reciente
    const isFresh = (new Date().getTime() - new Date(lastCheck.created_at).getTime()) < FRESH_SEC * 1000;

    // Si no es reciente, consideramos que el sistema está caído (0% uptime)
    const uptime = isFresh ? lastCheck.uptime_percent : 0;

    return NextResponse.json({ uptime });

  } catch (e: unknown) {
    console.error("Unexpected error in GET /api/uptime:", (e as Error).message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/uptime
 * Lo llama el agente para reportar el resultado de un ping.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uptime_percent, user_id } = body;

    // Validación básica
    if (typeof uptime_percent !== 'number' || uptime_percent < 0 || uptime_percent > 100) {
      return NextResponse.json({ error: "Invalid 'uptime_percent' value" }, { status: 400 });
    }
    if (!user_id || typeof user_id !== 'string') {
        return NextResponse.json({ error: "'user_id' is required" }, { status: 400 });
    }

    // Insertar en la tabla de pings
    const { error } = await supabase().from("uptime_checks").insert({
      uptime_percent,
      user_id,
    });

    if (error) {
      console.error("Error inserting uptime into Supabase:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (e: unknown) {
    console.error("Unexpected error in POST /api/uptime:", (e as Error).message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}