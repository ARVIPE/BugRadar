"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

const latencyData = [
  { path: "/login", latency: 120 },
  { path: "/dashboard", latency: 340 },
  { path: "/api/logs", latency: 280 },
  { path: "/settings", latency: 190 },
  { path: "/api/metrics", latency: 400 },
]

const latencyLogs = [
  { timestamp: "2025-07-02 14:00:00", path: "/login", latency: 120 },
  { timestamp: "2025-07-02 14:01:23", path: "/api/logs", latency: 280 },
  { timestamp: "2025-07-02 14:03:10", path: "/dashboard", latency: 340 },
  { timestamp: "2025-07-02 14:05:55", path: "/settings", latency: 190 },
]

export default function InsightPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Request Latency</h1>

          {/* Chart Section */}
          <div className="bg-skin-panel p-6 rounded-lg border border-border shadow-elev-1">
            <h2 className="text-lg font-semibold mb-4 text-skin-title">
              Average Latency per Endpoint (ms)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="None" />
                <XAxis dataKey="path" stroke="var(--color-subtitle)" fontSize={12} />
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
                <Bar dataKey="latency" fill="var(--yellow)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div className="bg-skin-panel p-6 rounded-lg border border-border shadow-elev-1">
            <h2 className="text-lg font-semibold mb-4 text-skin-title">Recent Latency Logs</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-skin-subtitle border-b border-border">
                  <tr>
                    <th className="text-left py-2 px-4">Timestamp</th>
                    <th className="text-left py-2 px-4">Path</th>
                    <th className="text-left py-2 px-4">Latency (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {latencyLogs.map((log, i) => (
                    <tr
                      key={i}
                      className="border-b border-border hover:bg-skin-bg transition-colors"
                    >
                      <td className="py-2 px-4 text-skin-title">{log.timestamp}</td>
                      <td className="py-2 px-4 text-skin-title">{log.path}</td>
                      <td className="py-2 px-4">
                        <span className="font-medium text-[var(--yellow)]">{log.latency} ms</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
