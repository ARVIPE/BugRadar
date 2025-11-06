import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createHash } from "crypto";
import { getServerSession } from "next-auth/next"; // <-- AÑADIDO
import { authConfig } from "@/app/api/auth/[...nextauth]/route"; // <-- AÑADIDO

// Tu patrón de cliente admin
const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// --- Helper de API Key (para el agente) ---
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
  if (error || !data) return null;
  return data.project_id;
}
// --- Fin del Helper ---

// Schema para el POST
const LatencySchema = z.object({
  endpoint: z.string().min(1),
  method: z.string().min(1),
  latency_ms: z.number().int().min(0),
  status_code: z.number().int(),
});

// --- POST (Para el Agente) ---
export async function POST(req: Request) {
  try {
    // Autenticación por API Key
    const authHeader = req.headers.get("Authorization");
    const apiKey = authHeader?.split(" ")[1];
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
    
    const latencyData = {
      ...parsed.data,
      project_id: projectId,
    };

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

// --- GET (Para el Frontend - useLatency) ---
export async function GET(req: Request) {
  // 1. Autenticación del usuario (next-auth)
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Obtener Project ID
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  if (!projectId) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  const db = supabase();

  // 3. Comprobación de Seguridad
  const { data: projectData, error: projectError } = await db
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", session.user.id)
    .single();

  if (projectError || !projectData) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
  }
  // --- Fin Comprobación ---

  try {
    // 4. Obtener datos de latencia (últimas 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await db
      .from('latency')
      .select('created_at, endpoint, method, status_code, latency_ms')
      .eq('project_id', projectId)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Devolvemos como 'items' (como espera useLatency)
    return NextResponse.json({ items: data });

  } catch (error: any) {
    console.error("Error in GET /api/latency:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}