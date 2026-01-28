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
  // Authentication
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get Parameters
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const logMessage = searchParams.get("log_message"); // The log from the detail page

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

  // Security Check
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


  try {

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Get events from the last 7 days
    let query = db
      .from("events")
      .select("created_at") // Only need the timestamp
      .eq("project_id", projectId) // Security filter
      .gt("created_at", sevenDaysAgo); // 7-day filter


    try {
      const parsedLog = JSON.parse(logMessage);
      const errorMsg = parsedLog.msg;

      if (errorMsg) {
        // Use 'like' to search for the error message within the JSON!
        query = query.like("log_message", `%${errorMsg}%`);
      } else {
        query = query.eq("log_message", logMessage);
      }
    } catch {
      query = query.eq("log_message", logMessage);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching recurrence events:", error);
      throw error;
    }

    // Aggregate the data in JS (group by day)
    const counts: Record<string, number> = {};
    const allDates: string[] = [];

    // Initialize the last 7 days to 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0]; // Format 'YYYY-MM-DD'
      counts[key] = 0;
      allDates.push(key);
    }

    // Count events by day
    for (const event of data) {
      const key = new Date(event.created_at).toISOString().split("T")[0];
      if (counts.hasOwnProperty(key)) {
        counts[key]++;
      }
    }

    // Format for Recharts
    const chartData = allDates
      .map((date) => ({
        date: date,
        value: counts[date],
      }))
      .reverse(); // Sort from oldest to newest

    return NextResponse.json(chartData);
  } catch (error: unknown) {
    console.error("Error fetching recurrence stats:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}