"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const latencyData = [
  { path: "/login", latency: 120 },
  { path: "/dashboard", latency: 340 },
  { path: "/api/logs", latency: 280 },
  { path: "/settings", latency: 190 },
  { path: "/api/metrics", latency: 400 },
];

const latencyLogs = [
  {
    timestamp: "2025-07-02 14:00:00",
    path: "/login",
    latency: 120,
  },
  {
    timestamp: "2025-07-02 14:01:23",
    path: "/api/logs",
    latency: 280,
  },
  {
    timestamp: "2025-07-02 14:03:10",
    path: "/dashboard",
    latency: 340,
  },
  {
    timestamp: "2025-07-02 14:05:55",
    path: "/settings",
    latency: 190,
  },
];

export default function InsightPage() {
  return (
    <>
      <Navbar />
      <div className="bg-gray-800 text-white min-h-screen py-10 px-4 md:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Request Latency</h1>

          {/* Chart Section */}
          <div className="bg-[#223145] p-6 rounded-lg border border-[#393D47]">
            <h2 className="text-lg font-semibold mb-4">
              Average Latency per Endpoint (ms)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="path" stroke="#bbb" />
                <YAxis stroke="#bbb" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#222", border: "none" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#facc15" }}
                />
                <Bar dataKey="latency" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div className="bg-[#223145] p-6 rounded-lg border border-[#393D47]">
            <h2 className="text-lg font-semibold mb-4">Recent Latency Logs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
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
                      className="border-b border-gray-800 hover:bg-[#2a2a2f]"
                    >
                      <td className="py-2 px-4">{log.timestamp}</td>
                      <td className="py-2 px-4">{log.path}</td>
                      <td className="py-2 px-4 text-yellow-400">{log.latency} ms</td>
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
  );
}
