"use client";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";

type EventItem = {
  id: string;
  created_at: string;
  severity: "info" | "warning" | "error";
  log_message: string;
  container_name: string;
  project_id: string;
  status?: "open" | "resolved" | "ignored";
};

type RecurrenceData = {
  date: string;
  value: number;
};

export default function DetailPage({ id }: { id: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Detail");

  const [event, setEvent] = useState<EventItem | null>(null);
  const [related, setRelated] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<null | "resolve" | "ignore">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [recurrenceData, setRecurrenceData] = useState<RecurrenceData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setChartLoading(true);
      try {
        // main event
        const res = await fetch(`/api/logs/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        const ev: EventItem = await res.json();
        if (!mounted) return;
        setEvent(ev);

        // recurrence data
        try {
          const recurrenceRes = await fetch(
            `/api/recurrence?project_id=${
              ev.project_id
            }&log_message=${encodeURIComponent(ev.log_message)}`,
            { cache: "no-store" }
          );
          if (recurrenceRes.ok) {
            const chartData: RecurrenceData[] = await recurrenceRes.json();
            if (mounted) {
              setRecurrenceData(chartData);
            }
          }
        } catch (chartError) {
          console.error("Failed to load recurrence data", chartError);
          if (mounted) setRecurrenceData([]);
        } finally {
          if (mounted) setChartLoading(false);
        }

        // related events
        const relRes = await fetch(
          `/api/logs?project_id=${
            ev.project_id
          }&log_message=${encodeURIComponent(ev.log_message)}&limit=10`,
          { cache: "no-store" }
        );
        const relJson = await relRes.json();
        const others: EventItem[] = (relJson.items ?? []).filter(
          (x: EventItem) => x.id !== ev.id
        );
        setRelated(others.slice(0, 3));
      } catch{
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

  const handleShare = async () => {
    if (!event) return;

    const shareUrl = `${window.location.origin}/${locale}/detail/${event.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(t("shareCopied") ?? "Link copied to clipboard");
    } catch {
      prompt(t("copyManually") ?? "Copy this link:", shareUrl);
    }
  };


  const title = useMemo(() => {
    if (!event) return t("notFound");
    try {
      const parsed = JSON.parse(event.log_message);
      if (parsed.msg) return parsed.msg;
    } catch {}
    return event.log_message.length > 150
      ? event.log_message.slice(0, 150) + "…"
      : event.log_message;
  }, [event, t]);

  const ts = event
    ? new Date(event.created_at).toUTCString()
    : t("timestampExample");

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
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setEvent(json.event);
    } catch (e: unknown) {
      setErrorMsg((e as Error)?.message || t("unexpectedError"));
    } finally {
      setSaving(null);
    }
  }

  const handleBack = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-skin-bg text-skin-title py-10 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {loading ? t("loading") : title}
            </h1>
            {!loading && (
              <p className="text-sm text-skin-subtitle">
                {ts} • {event?.container_name} •{" "}
                {event?.severity?.toUpperCase()}
                {event?.status
                  ? ` • ${t("statusLabel")}: ${event.status.toUpperCase()}`
                  : ""}
              </p>
            )}
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft size={16} className="mr-2" />
              {t("back")}
            </Button>
          </div>

          {/* Grid layout */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Left column */}
            <div className="md:col-span-2 space-y-6 flex flex-col">
              {/* Error Details */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-2 text-skin-title">
                  {t("errorDetails")}
                </h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {loading ? t("loading") : t("errorDescription")}
                </p>

                {!loading && (
                  <pre className="mt-4 text-xs whitespace-pre-wrap bg-skin-bg p-3 rounded border border-border">
                    {(() => {
                      try {
                        const parsed = JSON.parse(event?.log_message ?? "{}");
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return event?.log_message;
                      }
                    })()}
                  </pre>
                )}
              </div>

              {/* Recurrence History */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 flex-1 flex flex-col shadow-elev-1">
                <h2 className="text-lg font-semibold mb-1 text-skin-title">
                  {t("recurrenceTitle")}
                </h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {t("recurrenceSubtitle")}
                </p>
                <div className="flex-grow min-h-[300px]">
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-full text-skin-subtitle">
                      {t("loadingChart")}
                    </div>
                  ) : recurrenceData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-skin-subtitle">
                      {t("noRecurrence")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={recurrenceData}>
                        <XAxis
                          dataKey="date"
                          stroke="var(--color-subtitle)"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="var(--color-subtitle)"
                          fontSize={12}
                          allowDecimals={false}
                        />
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
              {/* Actions */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                  {t("actions")}
                </h2>
                <Button
                  className="w-full mb-2"
                  style={{ background: "var(--yellow)", color: "black" }}
                  onClick={() => act("resolve")}
                  disabled={saving !== null}
                >
                  {saving === "resolve" ? t("marking") : t("markResolved")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={() => act("ignore")}
                  disabled={saving !== null}
                >
                  {saving === "ignore" ? t("ignoring") : t("ignore")}
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleShare}>
                  <Share2 size={16} className="mr-2" /> {t("share")}
                </Button>

                {errorMsg && (
                  <p className="mt-3 text-sm text-destructive">{errorMsg}</p>
                )}

                {event?.status && (
                  <p className="mt-2 text-xs text-skin-subtitle">
                    {t("statusLabel")}:{" "}
                    <span className="text-skin-title">{event.status}</span>
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                  {t("tags")}
                </h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    {event?.container_name ?? "service"}
                  </span>
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    production
                  </span>
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    {event?.severity
                      ? event.severity.charAt(0).toUpperCase() +
                        event.severity.slice(1)
                      : "TypeError"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded border ${
                      event?.severity === "error"
                        ? "border-destructive/30 text-destructive"
                        : event?.severity === "warning"
                        ? "border-[var(--yellow)]/30 text-[var(--yellow)]"
                        : "border-border text-skin-subtitle"
                    }`}
                  >
                    {event?.severity === "error"
                      ? t("severityHigh")
                      : event?.severity === "warning"
                      ? t("severityMedium")
                      : t("severityLow")}
                  </span>
                </div>
              </div>

              {/* Related Logs */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 flex-1 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-1 text-skin-title">
                  {t("relatedLogs")}
                </h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {t("relatedLogsSubtitle")}
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
                            ? t("badgeHigh")
                            : log.severity === "warning"
                            ? t("badgeWarning")
                            : t("badgeInfo")}
                        </span>
                        <span className="text-xs text-skin-subtitle">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-skin-title">
                        {log.log_message.length > 100
                          ? log.log_message.slice(0, 100) + "..."
                          : log.log_message}
                      </p>
                      <p className="text-xs text-skin-subtitle">
                        {t("serviceLabel")} {log.container_name}
                      </p>
                    </div>
                  ))}

                  {!loading && related.length === 0 && (
                    <div className="text-skin-subtitle text-sm">
                      {t("noRelated")}
                    </div>
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
