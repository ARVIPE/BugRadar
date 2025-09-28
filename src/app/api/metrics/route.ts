// src/app/api/metrics/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

type StatusEv = { container_name: string; status: "up"|"down"|"heartbeat"; created_at: string };

function computeUptime(events: StatusEv[], windowStart: number, windowEnd: number) {
  const evs = [...events].sort((a,b)=> new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (evs.length === 0) return 0;
  let lastTs = windowStart, isUp = false, upMs = 0;
  for (let i = evs.length - 1; i >= 0; i--) {
    const t = new Date(evs[i].created_at).getTime();
    if (t < windowStart) { isUp = (evs[i].status === "up" || evs[i].status === "heartbeat"); break; }
  }
  for (const ev of evs) {
    const t = new Date(ev.created_at).getTime();
    if (t < windowStart) continue;
    if (t > windowEnd) break;
    if (isUp) upMs += t - lastTs;
    isUp = ev.status === "down" ? false : (ev.status === "up" || ev.status === "heartbeat" ? true : isUp);
    lastTs = t;
  }
  if (isUp) upMs += windowEnd - Math.max(lastTs, windowStart);
  const total = Math.max(0, windowEnd - windowStart);
  return total ? Math.max(0, Math.min(100, (upMs/total)*100)) : 0;
}

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now); today.setHours(0,0,0,0);
    const oneHourAgo = new Date(now); oneHourAgo.setHours(now.getHours() - 1);

    // KPIs (solo status='open')
    const [errorsRes, warnsRes, lastHourRes] = await Promise.all([
      supabase().from("events").select("*", { count: "exact", head: true }).eq("severity","error").eq("status","open"),
      supabase().from("events").select("*", { count: "exact", head: true }).eq("severity","warning").eq("status","open").gte("created_at", today.toISOString()),
      supabase().from("events").select("*", { count: "exact", head: true }).eq("status","open").gte("created_at", oneHourAgo.toISOString()),
    ]);

    // Uptime (24h): lee status_events y calcula
    const windowMs = 24 * 60 * 60 * 1000;
    const startIso = new Date(Date.now() - windowMs).toISOString();
    const { data: statusRows } = await supabase()
      .from("status_events")
      .select("container_name,status,created_at")
      .gte("created_at", startIso)
      .order("created_at", { ascending: true });

   // (solo el trozo del uptime)
    let uptime = 0;
    try {
      const res = await fetch("http://localhost:3000/api/uptime", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        uptime = typeof j.uptime === "number" ? j.uptime : 0;
      }
    } catch {
      uptime = 0;
    }


    return NextResponse.json({
      activeErrors: errorsRes.count ?? 0,
      warningsToday: warnsRes.count ?? 0,
      logsLastHour: lastHourRes.count ?? 0,
      uptime,
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
