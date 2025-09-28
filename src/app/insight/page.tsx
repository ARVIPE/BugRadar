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

// Función para procesar los datos de latencia crudos
function processLatencyData(data: LatencyRecord[] | null) {
  if (!data) {
    return { chartData: [], logData: [] };
  }

  // Para el gráfico de barras: calcular la latencia media por endpoint
  const averages: { [key: string]: { total: number; count: number } } = {};
  for (const record of data) {
    const key = `${record.method} ${record.endpoint}`;
    if (!averages[key]) {
      averages[key] = { total: 0, count: 0 };
    }
    averages[key].total += record.latency_ms;
    averages[key].count += 1;
  }

  const chartData = Object.entries(averages).map(([key, { total, count }]) => ({
    path: key,
    latency: Math.round(total / count),
  })).sort((a, b) => b.latency - a.latency); // Ordenar de más lento a más rápido

  // Para la tabla: simplemente usar los datos más recientes
  const logData = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { chartData, logData };
}

export default function InsightPage() {
  const { data: rawLatencyData, loading } = useLatency(15000); // Refrescar cada 15s

  const { chartData, logData } = useMemo(() => processLatencyData(rawLatencyData), [rawLatencyData]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Request Latency</h1>

          {/* Chart Section */}
          <div className="bg-skin-panel p-6 rounded-lg border border-border shadow-elev-1">
            <h2 className="text-lg font-semibold mb-4 text-skin-title">
              Average Latency per Endpoint (ms, last 24h)
            </h2>
            {loading && !chartData.length ? (
              <div className="flex justify-center items-center h-[300px]">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="path" stroke="var(--color-subtitle)" fontSize={12} interval={0} angle={-30} textAnchor="end" height={80} />
                  <YAxis stroke="var(--color-subtitle)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-panel)",
                      borderColor: "var(--border)",
                      color: "var(--color-title)",
                    }}
                  />
                  <Bar dataKey="latency" fill="var(--yellow)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table Section */}
          <div className="bg-skin-panel p-6 rounded-lg border border-border shadow-elev-1">
            <h2 className="text-lg font-semibold mb-4 text-skin-title">Recent Latency Checks</h2>
            {loading && !logData.length ? (
              <div className="text-center py-4">Loading logs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-skin-subtitle border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-4">Timestamp</th>
                      <th className="text-left py-2 px-4">Endpoint</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logData.slice(0, 20).map((log, i) => ( // Mostrar solo los últimos 20
                      <tr key={i} className="border-b border-border hover:bg-skin-bg transition-colors">
                        <td className="py-2 px-4 text-skin-title">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2 px-4 font-mono">{log.method} {log.endpoint}</td>
                        <td className="py-2 px-4">
                          <span className={log.status_code >= 400 ? "text-destructive" : "text-emerald-400"}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-medium text-[var(--yellow)]">{log.latency_ms} ms</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}