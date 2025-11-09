import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authConfig } from '@/lib/auth.config';
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

  // 2. Obtener Parámetros
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const logMessage = searchParams.get("log_message"); // <-- El log de la página de detalle

  if (!projectId) {
    return NextResponse.json(
      { error: "project_id is required" },
      { status: 400 }
    );
  }
  if (!logMessage) {
    return NextResponse.json(
      { error: "log_message is required" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 403 }
    );
  }
  // --- Fin Comprobación ---

  try {
    // 4. --- LÓGICA DE RECURRENCIA MODIFICADA ---
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // 1. Obtenemos los eventos de los últimos 7 días
    let query = db
      .from("events")
      .select("created_at") // Solo necesitamos el timestamp
      .eq("project_id", projectId) // Filtro de seguridad
      .gt("created_at", sevenDaysAgo); // Filtro de 7 días

    // --- LÓGICA DE FILTRO (igual que en api/logs) ---
    try {
      const parsedLog = JSON.parse(logMessage);
      const errorMsg = parsedLog.msg;

      if (errorMsg) {
        // ¡Usa 'like' para buscar el mensaje de error dentro del JSON!
        query = query.like("log_message", `%${errorMsg}%`);
      } else {
        query = query.eq("log_message", logMessage);
      }
    } catch {
      query = query.eq("log_message", logMessage);
    }
    // --- FIN DE LÓGICA DE FILTRO ---
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching recurrence events:", error);
      throw error;
    }

    // 2. Agregamos los datos en JS (agrupar por día)
    const counts: Record<string, number> = {};
    const allDates: string[] = [];

    // Inicializar los últimos 7 días a 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0]; // Formato 'YYYY-MM-DD'
      counts[key] = 0;
      allDates.push(key);
    }

    // Contar los eventos por día
    for (const event of data) {
      const key = new Date(event.created_at).toISOString().split("T")[0];
      if (counts.hasOwnProperty(key)) {
        counts[key]++;
      }
    }

    // 3. Formatear para Recharts
    const chartData = allDates
      .map((date) => ({
        date: date,
        value: counts[date],
      }))
      .reverse(); // Ordenar de más antiguo a más nuevo

    // --- FIN DE LÓGICA MODIFICADA ---

    return NextResponse.json(chartData);
  } catch (error: unknown) {
    console.error("Error fetching recurrence stats:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}