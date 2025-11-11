import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

async function getProjectIdFromApiKey(
  apiKey: string
): Promise<string | null> {
  if (!apiKey || !apiKey.startsWith("proj_")) {
    return null;
  }
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");
  
  const { data, error }: { data: { project_id: string } | null; error: any } = await supabaseAdmin()
    .from("project_api_keys")
    .select("project_id")
    .eq("hashed_key", hashedKey)
    .single();

  if (error || !data) {
    console.warn("Invalid API key (config):", apiKey.substring(0, 10) + "...");
    return null;
  }
  return data.project_id;
}


export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const apiKey = authHeader?.split(" ")[1];

    if (!apiKey) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const projectId = await getProjectIdFromApiKey(apiKey);
    if (!projectId) {
      return NextResponse.json({ error: "API Key inválida" }, { status: 403 });
    }

    const { data, error }: { data: { monitored_endpoints: string[] | null } | null; error: any } = await supabaseAdmin()
      .from("projects")
      .select("monitored_endpoints")
      .eq("id", projectId)
      .single();

    if (error || !data) {
      console.error("No se pudo encontrar el proyecto para la config:", error);
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Devolvemos la lista de endpoints
    return NextResponse.json({ 
      endpoints: data.monitored_endpoints || [] 
    }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/config:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}