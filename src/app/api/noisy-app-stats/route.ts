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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // 4. Ejecutar todas las queries en paralelo
    const [
      errorsCount,
      warningsCount,
      uptimePings,
      totalRequests,
      logVolumeData,
      mtbfData,
      p95Data,
    ] = await Promise.all([
      // Total Errors (24h)
      db.from('events').select('id', { count: 'exact', head: true })
        .eq('project_id', projectId).eq('severity', 'error').gte('created_at', twentyFourHoursAgo),
      // Total Warnings (24h)
      db.from('events').select('id', { count: 'exact', head: true })
        .eq('project_id', projectId).eq('severity', 'warning').gte('created_at', twentyFourHoursAgo),
      // Uptime (24h)
      db.from('latency').select('status_code')
        .eq('project_id', projectId).gte('created_at', twentyFourHoursAgo),
      // Total Requests (para Error Rate)
      db.from('events').select('id', { count: 'exact', head: true })
        .eq('project_id', projectId).gte('created_at', twentyFourHoursAgo),
      // Log Volume (7 dias) - (Usando RPC)
      db.rpc('get_project_log_volume', { project_id_param: projectId }),
      // MTBF (30 dias) - (Usando RPC)
      db.rpc('get_project_mtbf', { project_id_param: projectId }),
      // P95 Latency (24 horas) - (Usando RPC)
      db.rpc('get_project_latency_p95', { project_id_param: projectId, from_ts: twentyFourHoursAgo }),
    ]);

    
    const totalErrors = errorsCount.count ?? 0;
    const totalWarnings = warningsCount.count ?? 0;
    
    // Uptime
    const pings = uptimePings.data || [];
    const successPings = pings.filter(p => p.status_code >= 200 && p.status_code < 300).length;
    const totalUptimePings = pings.length; // 1. Usamos 'pings.length'
    const uptime = totalUptimePings > 0 ? parseFloat(((successPings / totalUptimePings) * 100).toFixed(2)) : 100;

    // Rates
    // 2. Definimos 'totalRequestCount' ANTES de usarlo para 'errorRate'
    const totalRequestCount = totalRequests.count ?? 0; 
    const errorRate = totalRequestCount > 0 ? parseFloat(((totalErrors / totalRequestCount) * 100).toFixed(2)) : 0;
    const warningRate = totalRequestCount > 0 ? parseFloat(((totalWarnings / totalRequestCount) * 100).toFixed(2)) : 0;

    // MTBF (de la RPC)
    // Comprobamos si 'mtbfData.data' no es nulo
    const mtbf = (mtbfData.data !== null && mtbfData.data !== undefined) ? parseFloat(mtbfData.data.toFixed(2)) : 0;

    // Log Volume (de la RPC)
    const logVolume = logVolumeData.data || []

    // P95 Latency (de la RPC)
   const p95 = p95Data.data !== null ? Math.round(Number(p95Data.data)) : null;

    return NextResponse.json({
      totalErrors,
      totalWarnings,
      uptime,
      mtbf: mtbf.toString(), // El frontend espera string
      errorRate: errorRate.toString(), // El frontend espera string
      warningRate: warningRate.toString(), // El frontend espera string
      logVolume,
      p95LatencyMs: p95,
    });

  } catch (error: unknown) {
    console.error("Error fetching noisy-app-stats:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}