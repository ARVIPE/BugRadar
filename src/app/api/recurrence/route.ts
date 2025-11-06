import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

// Tu patrón de cliente admin
const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

export async function GET(req: Request) {
  // 1. Autenticación
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
    // 4. --- CAMBIO CLAVE ---
    // Llamamos a la función RPC que acabamos de crear
    const { data, error } = await db.rpc('get_project_recurrence', {
      project_id_param: projectId
    });
    // --- FIN DEL CAMBIO ---

    if (error) {
      console.error("Error llamando a RPC get_project_recurrence:", error);
      throw error;
    }

    // Los datos ya vienen en el formato correcto
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching recurrence stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}