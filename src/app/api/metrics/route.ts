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
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

    // 4. Añadir .eq('project_id', projectId) a TODAS las queries
    
    // Active Errors (asumiendo que 'status' = 'open' existe en tu tabla 'events')
    const { count: activeErrors, error: errorsError } = await db
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId) // <-- FILTRO AÑADIDO
      .eq('severity', 'error')
      .eq('status', 'open'); // (Si no usas 'status', cámbialo por 'is' o quítalo)
    if (errorsError) throw errorsError;

    // Warnings Today
    const { count: warningsToday, error: warningsError } = await db
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId) // <-- FILTRO AÑADIDO
      .eq('severity', 'warning')
      .gte('created_at', todayStart);
    if (warningsError) throw warningsError;

    // Logs Last Hour
    const { count: logsLastHour, error: logsError } = await db
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId) // <-- FILTRO AÑADIDO
      .gte('created_at', oneHourAgo);
    if (logsError) throw logsError;

    return NextResponse.json({
      activeErrors: activeErrors ?? 0,
      warningsToday: warningsToday ?? 0,
      logsLastHour: logsLastHour ?? 0,
    });

  } catch (error: unknown) {
    console.error("Error fetching metrics:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}