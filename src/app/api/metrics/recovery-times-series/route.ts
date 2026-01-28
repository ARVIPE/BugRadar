import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authConfig } from '@/lib/auth.config';
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

export async function GET(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  const db = supabase();

  // Security check
  const { data: projectData, error: projectError } = await db
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", session.user.id)
    .single();

  if (projectError || !projectData) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
  }

  try {
    const { data, error } = await db.rpc('get_project_recovery_stats', {
      project_id_param: projectId
    });

    if (error) {
      console.error("Error llamando a RPC get_project_recovery_stats:", error);
      throw error;
    }

    const chartData = data.map((d: { date: string, avg_recovery_minutes: number }) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(d.avg_recovery_minutes.toFixed(2)) 
    }));

    if (chartData.length === 0) {
       return NextResponse.json([]);
    }

    return NextResponse.json(chartData);

  } catch (error: unknown) {
    console.error("Error en API recovery-times-series:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}