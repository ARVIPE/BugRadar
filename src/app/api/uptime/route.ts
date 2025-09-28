// src/app/api/uptime/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// Consideramos "reciente" el último ping si no es más viejo que este umbral:
const FRESH_SEC = Number(process.env.UPTIME_FRESH_SEC ?? "120");

type Row = { container_name: string; status: "up"|"down"|"heartbeat"; created_at: string };

function isFresh(iso: string) {
  const ts = new Date(iso).getTime();
  return Date.now() - ts <= FRESH_SEC * 1000;
}

function rowToUptime(r?: Row): number {
  if (!r) return 0;
  if (!isFresh(r.created_at)) return 0;
  return (r.status === "up" || r.status === "heartbeat") ? 100 : 0;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const container = (searchParams.get("container_name") ?? undefined) as string | undefined;

    if (container) {
      const { data, error } = await supabase()
        .from("status_events")
        .select("container_name,status,created_at")
        .eq("container_name", container)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const last = (data ?? [])[0] as Row | undefined;
      return NextResponse.json({ container_name: container, uptime: rowToUptime(last) }, { status: 200 });
    }

    // Sin contenedor: calculamos por cada servicio (último evento de cada uno) y promediamos.
    // Estrategia simple: pedimos los últimos N y nos quedamos con el primero por container.
    const { data, error } = await supabase()
      .from("status_events")
      .select("container_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const seen = new Set<string>();
    const latestPer: Record<string, Row> = {};
    for (const r of (data ?? []) as Row[]) {
      if (!seen.has(r.container_name)) {
        latestPer[r.container_name] = r;
        seen.add(r.container_name);
      }
    }

    const entries = Object.entries(latestPer);
    if (entries.length === 0) return NextResponse.json({ uptime: 0, perContainer: {} }, { status: 200 });

    const perContainer: Record<string, number> = {};
    for (const [name, row] of entries) {
      perContainer[name] = rowToUptime(row);
    }
    const values = Object.values(perContainer);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return NextResponse.json({ uptime: avg, perContainer }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
