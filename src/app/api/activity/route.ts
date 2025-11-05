import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/app/api/auth/[...nextauth]/route"; // Importa tu config de auth
import { createClient } from "@supabase/supabase-js";

// Tu patrón de cliente admin (Service Role)
const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// (El tipo ActivityItem se queda igual)
type ActivityItem = {
  id: string;
  timestamp: string;
  type: 'new_event' | 'resolved_event' | 'ignored_event';
  severity?: string;
  container_name?: string;
  log_message?: string;
  user_email?: string | null;
}

export async function GET(req: Request) {
  // 1. Obtener sesión del usuario (tu método)
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 2. Obtener el project_id desde la URL
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return new NextResponse(
      JSON.stringify({ message: "project_id is required" }),
      { status: 400 }
    );
  }

  const db = supabase();
  
  // 3. Comprobación de Seguridad (Opcional pero Recomendado)
  // Asegurarnos de que el usuario logueado es dueño de este proyecto
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

  const activityLimit = 5;
  const lookbackDays = 3;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - lookbackDays);
  const sinceISO = sinceDate.toISOString();

  try {
    // 4. Añadir .eq('project_id', projectId) a TODAS las queries
    const { data: newEvents, error: newEventsError } = await db
      .from('events')
      .select('id, created_at, severity, container_name, log_message')
      .eq('project_id', projectId) // <-- FILTRO AÑADIDO
      .order('created_at', { ascending: false })
      .limit(activityLimit);

    if (newEventsError) throw newEventsError;

    const { data: resolvedEvents, error: resolvedError } = await db
      .from('events')
      .select('id, severity, container_name, resolved_at, resolved_by')
      .eq('project_id', projectId) // <-- FILTRO AÑADIDO
      .gt('resolved_at', sinceISO)
      .order('resolved_at', { ascending: false })
      .limit(activityLimit);

    if (resolvedError) throw resolvedError;

    const { data: ignoredEvents, error: ignoredError } = await db
      .from('events')
      .select('id, severity, container_name, ignored_at, ignored_by')
      .eq('project_id', projectId) // <-- FILTRO AÑADIDO
      .gt('ignored_at', sinceISO)
      .order('ignored_at', { ascending: false })
      .limit(activityLimit);
    
    if (ignoredError) throw ignoredError;

    // --- El resto de tu lógica (buscar emails) es correcta ---
    
    const userIds = new Set<string>();
    resolvedEvents.forEach(e => { if (e.resolved_by) userIds.add(e.resolved_by) });
    ignoredEvents.forEach(e => { if (e.ignored_by) userIds.add(e.ignored_by) });

    const emailMap = new Map<string, string>();
    if (userIds.size > 0) {
      const { data: users, error: userError } = await db
        .from('users') // Asumiendo que tu tabla pública de perfiles se llama 'users'
        .select('id, email')
        .in('id', Array.from(userIds));

      if (userError) throw userError;
      
      users.forEach(u => emailMap.set(u.id, u.email));
    }

    const activities: ActivityItem[] = [];

    newEvents.forEach(event => activities.push({
      id: event.id,
      timestamp: event.created_at,
      type: 'new_event',
      severity: event.severity,
      container_name: event.container_name,
      log_message: event.log_message,
    }));

    resolvedEvents.forEach(event => {
      const email = event.resolved_by ? emailMap.get(event.resolved_by) || 'Usuario (ID: ...' + event.resolved_by.slice(-4) + ')' : 'Sistema';
      activities.push({
        id: event.id,
        timestamp: event.resolved_at!,
        type: 'resolved_event',
        container_name: event.container_name,
        user_email: email,
      });
    });

    ignoredEvents.forEach(event => {
      const email = event.ignored_by ? emailMap.get(event.ignored_by) || 'Usuario (ID: ...' + event.ignored_by.slice(-4) + ')' : 'Sistema';
      activities.push({
        id: event.id,
        timestamp: event.ignored_at!,
        type: 'ignored_event',
        container_name: event.container_name,
        user_email: email,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalActivities = activities.slice(0, activityLimit);
    
    return NextResponse.json(finalActivities);

  } catch (e: any) {
    console.error('Error fetching recent activity:', e);
    return new NextResponse(
      JSON.stringify({ message: 'Error fetching recent activity', error: e.message }),
      { status: 500 }
    );
  }
}