"use client";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Share2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { set } from "zod";

type EventItem = {
  id: string;
  created_at: string;
  severity: "info" | "warning" | "error";
  log_message: string;
  container_name: string;
  status?: "open" | "resolved" | "ignored";
};

export default function DetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [related, setRelated] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<null | "resolve" | "ignore">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [recurrenceData, setRecurrenceData] = useState<RecurrenceData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  type RecurrenceData = {
    date: string;
    value: number;
  };


  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setChartLoading(true);
      try {
        const res = await fetch(`/api/logs/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        const ev: EventItem = await res.json();
        if (!mounted) return;
        setEvent(ev);

        try {
          const recurrenceRes = await fetch(
            `/api/recurrence?log_message=${encodeURIComponent(ev.log_message)}`,
            { cache: "no-store" }
          );
          if (recurrenceRes.ok) {
            const chartData: RecurrenceData[] = await recurrenceRes.json();
            if(mounted){
              setRecurrenceData(chartData);
            }
          }
        } catch (chartError) {
          console.error("Failed to load recurrence data", chartError);
          if(mounted) setRecurrenceData([]);
        } finally {
          if (mounted) setChartLoading(false);
        }
        // Cargar relacionados por mismo contenedor
        const relRes = await fetch(`/api/logs?log_message=${encodeURIComponent(ev.log_message)}&limit=10`,
        { cache: "no-store" });
        const relJson = await relRes.json();
        // Filtramos el evento actual (esto sigue igual)
        const others: EventItem[] = (relJson.items ?? []).filter((x: EventItem) => x.id !== ev.id);
        setRelated(others.slice(0, 3));
      } catch (e) {
        setEvent(null);
        setChartLoading(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const title = useMemo(() => {
    if (!event) return "Log not found";
    return event.log_message.length > 150
      ? event.log_message.slice(0, 150) + "…"
      : event.log_message;
  }, [event]);

  const ts = event ? new Date(event.created_at).toUTCString() : "";

  async function act(action: "resolve" | "ignore") {
    if (!id) return;
    setSaving(action);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          // Si quieres registrar quién lo hizo y ya tienes NextAuth:
          // user_id: session?.user?.id
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setEvent(json.event); // refresca status/resuelto/ignorado
    } catch (e: any) {
      setErrorMsg(e?.message || "Unexpected error");
    } finally {
      setSaving(null);
    }
  }

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-skin-bg text-skin-title py-10 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {loading ? "Loading…" : title}
            </h1>
            {!loading && (
              <p className="text-sm text-skin-subtitle">
                {ts} • {event?.container_name} • {event?.severity?.toUpperCase()}
                {event?.status ? ` • STATUS: ${event.status.toUpperCase()}` : ""}
              </p>
            )}
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Grid layout */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Left column */}
            <div className="md:col-span-2 space-y-6 flex flex-col">
              {/* Error Details */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-2 text-skin-title">Error Details</h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {loading
                    ? "Loading…"
                    : "Details extracted from the log message below. (Enhance later with stack trace parsing)."}
                </p>

                {/* Mensaje crudo */}
                {!loading && (
                  <pre className="mt-4 text-xs whitespace-pre-wrap bg-skin-bg p-3 rounded border border-border">
                    {event?.log_message}
                  </pre>
                )}
              </div>

              {/* Recurrence History (placeholder igual que tu maqueta) */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 flex-1 flex flex-col shadow-elev-1">
                <h2 className="text-lg font-semibold mb-1 text-skin-title">Recurrence History</h2>
                <p className="text-sm text-skin-subtitle mb-4">Occurrences over the last 7 days</p>
                <div className="flex-grow min-h-[300px]">
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-full text-skin-subtitle">
                      Loading chart…
                      </div>
                  ) : recurrenceData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-skin-subtitle">
                      No recurrence data available.
                    </div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recurrenceData}>
                      <XAxis dataKey="date" stroke="var(--color-subtitle)" fontSize={12} />
                      <YAxis stroke="var(--color-subtitle)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-panel)",
                          borderColor: "var(--border)",
                          borderWidth: 1,
                          color: "var(--color-title)",
                          fontSize: "0.8rem",
                        }}
                        labelStyle={{ color: "var(--color-title)" }}
                        itemStyle={{ color: "var(--color-title)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--yellow)"
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          stroke: "var(--yellow)",
                          strokeWidth: 2,
                          fill: "var(--yellow)",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6 flex flex-col">
              {/* Actions (mismo UI, con funcionalidad) */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">Actions</h2>
                <Button
                  className="w-full mb-2"
                  style={{ background: "var(--yellow)", color: "black" }}
                  onClick={() => act("resolve")}
                  disabled={saving !== null}
                >
                  {saving === "resolve" ? "Marking…" : "Mark as Resolved"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={() => act("ignore")}
                  disabled={saving !== null}
                >
                  {saving === "ignore" ? "Ignoring…" : "Ignore Error"}
                </Button>
                <Button variant="ghost" className="w-full">
                  <Share2 size={16} className="mr-2" /> Share Error
                </Button>

                {errorMsg && (
                  <p className="mt-3 text-sm text-destructive">{errorMsg}</p>
                )}

                {event?.status && (
                  <p className="mt-2 text-xs text-skin-subtitle">
                    Status: <span className="text-skin-title">{event.status}</span>
                  </p>
                )}
              </div>

              {/* Tags (igual look; muestra container/severity como tags) */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">Tags</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    {event?.container_name ?? "service"}
                  </span>
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    production
                  </span>
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    {event?.severity
                      ? event.severity.charAt(0).toUpperCase() + event.severity.slice(1)
                      : "TypeError"}
                  </span>
                  <span className="px-2 py-1 rounded border border-destructive/30 text-destructive">
                    {event?.severity === "error"
                      ? "High"
                      : event?.severity === "warning"
                      ? "Medium"
                      : "Low"}
                  </span>
                </div>
              </div>

              {/* Related Logs (igual layout, datos reales) */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 flex-1 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-1 text-skin-title">Related Logs</h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  Other events around this time or service
                </p>
                <div className="space-y-4">
                  {related.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded text-sm flex flex-col gap-1 border border-border bg-skin-bg"
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.severity === "error"
                              ? "text-destructive border border-destructive"
                              : log.severity === "warning"
                              ? "text-[var(--yellow)] border border-[color:var(--yellow)]/40"
                              : "text-skin-subtitle border"
                          }`}
                        >
                          {log.severity === "error"
                            ? "High"
                            : log.severity === "warning"
                            ? "Warning"
                            : "Info"}
                        </span>
                        <span className="text-xs text-skin-subtitle">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-skin-title">{log.log_message}</p>
                      <p className="text-xs text-skin-subtitle">Service: {log.container_name}</p>
                    </div>
                  ))}

                  {!loading && related.length === 0 && (
                    <div className="text-skin-subtitle text-sm">No related logs</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
