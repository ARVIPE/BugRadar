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
  // 1. Obtener sesión del usuario
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Obtener el project_id
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
  // --- Fin de Comprobación ---

  try {
    // 4. LLAMAR A LA FUNCIÓN RPC (sigue llamándose igual)
    const { data, error } = await db.rpc('get_project_recovery_stats', {
      project_id_param: projectId
    });

    if (error) {
      console.error("Error llamando a RPC get_project_recovery_stats:", error);
      throw error;
    }

    // 5. Formatear los datos para la gráfica
    // --- CAMBIO AQUÍ ---
    const chartData = data.map((d: { date: string, avg_recovery_minutes: number }) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      // Leemos la nueva columna 'avg_recovery_minutes'
      value: parseFloat(d.avg_recovery_minutes.toFixed(2)) 
    }));
    // --- FIN DEL CAMBIO ---

    if (chartData.length === 0) {
       return NextResponse.json([]);
    }

    return NextResponse.json(chartData);

  } catch (error: any) {
    console.error("Error en API recovery-times-series:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}