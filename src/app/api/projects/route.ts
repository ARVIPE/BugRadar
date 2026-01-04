import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config"; // Usando tu authConfig
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto"; 
import { z } from "zod";

const supabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

const CreateProjectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  monitored_endpoints: z.array(z.string()).optional().default([]),
});

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin(); 
  const { data, error } = await db
    .from("projects")
    .select("id, name, created_at")
    .eq("user_id", session.user.id) 
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig); 
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { name, monitored_endpoints } = parsed.data;

    const { data: projectData, error: projectError } = await supabaseAdmin()
      .from("projects")
      .insert({
        name: name,
        user_id: userId,
        monitored_endpoints: monitored_endpoints,
      })
      .select("id, name")
      .single();

    if (projectError) {
        console.error("Error creando proyecto:", projectError);
        throw new Error(projectError.message);
    }

    const apiKey = `proj_${randomBytes(16).toString("hex")}`;
    const hashedKey = createHash("sha256").update(apiKey).digest("hex");

    const { error: keyError } = await supabaseAdmin()
      .from("project_api_keys")
      .insert({
        project_id: projectData.id,
        hashed_key: hashedKey,
        key_hint: apiKey.substring(apiKey.length - 4),
      });

    if (keyError) {
        console.error("Error creando API key:", keyError);
        throw new Error(keyError.message);
    }

    return NextResponse.json({ ...projectData, apiKey }, { status: 201 });
    
  } catch (error: unknown) {
    console.error("Error en POST /api/projects:", error);
    return NextResponse.json({ error: (error as Error).message || "Error interno del servidor" }, { status: 500 });
  }
}