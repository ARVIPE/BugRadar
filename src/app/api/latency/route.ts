import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createHash } from "crypto";

// Tu patrón de cliente admin
const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// --- Helper de API Key (copiado de /api/logs) ---
async function getProjectIdFromApiKey(
  apiKey: string
): Promise<string | null> {
  if (!apiKey.startsWith("proj_")) return null;
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");
  const { data, error } = await supabase()
    .from("project_api_keys")
    .select("project_id")
    .eq("hashed_key", hashedKey)
    .single();
  
  if (error || !data) {
    console.warn("Invalid API key (latency):", apiKey.substring(0, 10) + "...");
    return null;
  }
  return data.project_id;
}
// --- Fin del Helper ---

// 1. Schema actualizado (sin user_id)
const LatencySchema = z.object({
  endpoint: z.string().min(1),
  method: z.string().min(1),
  latency_ms: z.number().int().min(0), // Aceptamos 0ms
  status_code: z.number().int(),
});

export async function POST(req: Request) {
  try {
    // 2. Autenticación por API Key (para el agente)
    const authHeader = req.headers.get("Authorization");
    const apiKey = authHeader?.split(" ")[1]; // Bearer <key>
    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const projectId = await getProjectIdFromApiKey(apiKey);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = LatencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    // 3. Añadir project_id a los datos
    const latencyData = {
      ...parsed.data,
      project_id: projectId, // <-- AÑADIDO
    };

    // 4. Insertar en la tabla 'latency'
    const { data, error } = await supabase()
      .from("latency")
      .insert(latencyData)
      .select();

    if (error) {
      console.error("Error en insert /api/latency:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/latency:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}