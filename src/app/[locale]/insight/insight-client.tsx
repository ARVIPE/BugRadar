"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useLatency, LatencyRecord } from "@/components/useLatency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";
import { useProject } from "@/hooks/useProject";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

function processLatencyData(data: LatencyRecord[] | null) {
  if (!data) {
    return { chartData: [], logData: [] };
  }
  const averages: { [key: string]: { total: number; count: number } } = {};
  for (const record of data) {
    const key = `${record.method} ${record.endpoint}`;
    if (!averages[key]) {
      averages[key] = { total: 0, count: 0 };
    }
    averages[key].total += record.latency_ms;
    averages[key].count += 1;
  }
  const chartData = Object.entries(averages)
    .map(([key, { total, count }]) => ({
      path: key,
      latency: Math.round(total / count),
    }))
    .sort((a, b) => b.latency - a.latency);
  const logData = [...data].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return { chartData, logData };
}

export default function InsightClient() {
  const { projectId } = useProject();
  const { status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Latency");

  // pasamos projectId al hook
  const { data: rawLatencyData, loading } = useLatency(projectId, 15000);

  const { chartData, logData } = useMemo(
    () => processLatencyData(rawLatencyData),
    [rawLatencyData]
  );

  // loading inicial
  if (status === "loading" || (loading && !rawLatencyData && !projectId)) {
    return (
      <div className="flex h-screen items-center justify-center bg-skin-bg">
        <Loader2 className="w-8 h-8 animate-spin text-skin-subtitle" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push(`/${locale}`);
    return null;
  }

  const isEmpty =
    !loading && (!rawLatencyData || rawLatencyData.length === 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>

          {isEmpty && (
            <div className="bg-skin-panel p-8 rounded-lg border border-border text-center text-skin-subtitle">
              <h2 className="font-semibold text-lg text-skin-title">
                {t("noDataTitle")}
              </h2>
              <p className="mt-2 text-sm">{t("noDataDesc")}</p>
            </div>
          )}

          {/* Chart Section */}
          {!isEmpty && (
            <div className="bg-skin-panel p-6 rounded-lg border border-border shadow-elev-1">
              <h2 className="text-lg font-semibold mb-4 text-skin-title">
                {t("chartTitle")}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="path"
                    stroke="var(--color-subtitle)"
                    fontSize={12}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="var(--color-subtitle)"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-panel)",
                      borderColor: "var(--border)",
                      color: "var(--color-title)",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar
                    dataKey="latency"
                    fill="var(--yellow)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table Section */}
          {!isEmpty && (
            <div className="bg-skin-panel p-6 rounded-lg border border-border shadow-elev-1">
              <h2 className="text-lg font-semibold mb-4 text-skin-title">
                {t("tableTitle")}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-skin-subtitle border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-4">
                        {t("colTimestamp")}
                      </th>
                      <th className="text-left py-2 px-4">
                        {t("colEndpoint")}
                      </th>
                      <th className="text-left py-2 px-4">
                        {t("colStatus")}
                      </th>
                      <th className="text-left py-2 px-4">
                        {t("colLatency")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logData.slice(0, 20).map((log, i) => (
                      <tr
                        key={i}
                        className="border-b border-border hover:bg-skin-bg transition-colors"
                      >
                        <td className="py-2 px-4 text-skin-title">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 font-mono">
                          {log.method} {log.endpoint}
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={
                              log.status_code >= 400
                                ? "text-destructive"
                                : "text-emerald-400"
                            }
                          >
                            {log.status_code}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-medium text-[var(--yellow)]">
                            {log.latency_ms} ms
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
