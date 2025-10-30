import { createClient } from "@supabase/supabase-js";
import { NextResponse } from 'next/server';

// Un tipo para unificar los diferentes flujos de actividad
type ActivityItem = {
  id: string;
  timestamp: string;
  type: 'new_event' | 'resolved_event' | 'ignored_event';
  severity?: string;
  container_name?: string;
  log_message?: string;
  user_email?: string | null;
}

// Cliente de Supabase con Service Role (como en /api/latency)
const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

export async function GET() {
  const db = supabase(); // Usamos el cliente de servicio
  const activityLimit = 5; // Cuántos items de actividad mostrar
  const lookbackDays = 3; // Cuántos días atrás buscar (para no escanear toda la BBDD)
  
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - lookbackDays);
  const sinceISO = sinceDate.toISOString();

  try {
    // 1. Obtener los eventos creados más recientes (nuevos errores/warnings)
    const { data: newEvents, error: newEventsError } = await db
      .from('events')
      .select('id, created_at, severity, container_name, log_message')
      .order('created_at', { ascending: false })
      .limit(activityLimit);

    if (newEventsError) throw newEventsError;

    // 2. Obtener los eventos resueltos más recientes
    const { data: resolvedEvents, error: resolvedError } = await db
      .from('events')
      // CORRECCIÓN: Se quitó el (email) que fallaba. Ahora solo traemos el UUID.
      .select('id, severity, container_name, resolved_at, resolved_by')
      .gt('resolved_at', sinceISO) // Solo resueltos recientemente
      .order('resolved_at', { ascending: false })
      .limit(activityLimit);

    if (resolvedError) throw resolvedError;

    // 3. Obtener los eventos ignorados más recientes
    const { data: ignoredEvents, error: ignoredError } = await db
      .from('events')
      // CORRECCIÓN: Se quitó el (email) que fallaba. Ahora solo traemos el UUID.
      .select('id, severity, container_name, ignored_at, ignored_by')
      .gt('ignored_at', sinceISO) // Solo ignorados recientemente
      .order('ignored_at', { ascending: false })
      .limit(activityLimit);
    
    if (ignoredError) throw ignoredError;

    // 4. NUEVO PASO: Obtener los emails de los usuarios
    // Recopilamos todos los IDs de usuario únicos de los eventos
    const userIds = new Set<string>();
    resolvedEvents.forEach(e => { if (e.resolved_by) userIds.add(e.resolved_by) });
    ignoredEvents.forEach(e => { if (e.ignored_by) userIds.add(e.ignored_by) });

    const emailMap = new Map<string, string>();
    if (userIds.size > 0) {
      // Consultamos la tabla pública 'users' para encontrar los emails
      const { data: users, error: userError } = await db
        .from('users') // Asumiendo que tu tabla pública de usuarios se llama 'users'
        .select('id, email')
        .in('id', Array.from(userIds));

      if (userError) throw userError;
      
      // Creamos un mapa de ID -> email para buscar rápido
      users.forEach(u => emailMap.set(u.id, u.email));
    }


    // 5. Formatear y unificar todas las actividades
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
      // CORRECCIÓN: Usamos el emailMap para buscar el email
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
      // CORRECCIÓN: Usamos el emailMap para buscar el email
      const email = event.ignored_by ? emailMap.get(event.ignored_by) || 'Usuario (ID: ...' + event.ignored_by.slice(-4) + ')' : 'Sistema';
      activities.push({
        id: event.id,
        timestamp: event.ignored_at!,
        type: 'ignored_event',
        container_name: event.container_name,
        user_email: email,
      });
    });

    // 6. Ordenar todas las actividades por fecha (más reciente primero)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 7. Devolver solo el límite de actividad
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

