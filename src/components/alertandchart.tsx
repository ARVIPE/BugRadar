"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Settings } from "lucide-react"

export default function AlertAndChart() {
  const data = [
    { date: "Jul 20", value: 5 },
    { date: "Jul 21", value: 4.5 },
    { date: "Jul 22", value: 6 },
    { date: "Jul 23", value: 3.8 },
    { date: "Jul 24", value: 4.2 },
    { date: "Jul 25", value: 5.5 },
    { date: "Jul 26", value: 4 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {/* Email Alert Status */}
      <div className="col-span-1 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-skin-title font-semibold text-sm mb-3">Email Alert Status</h3>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500 text-white">Active</span>
            <span className="text-sm text-skin-subtitle">Receiving notifications</span>
          </div>
        </div>
        <div className="mt-6">
          <a href="#" className="text-[var(--yellow)] text-sm font-medium hover:underline flex items-center gap-1">
            <Settings size={14} />
            Manage Settings
          </a>
        </div>
      </div>

      {/* Average Recovery Time Chart */}
      <div className="col-span-1 md:col-span-2 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
        <h3 className="text-skin-title font-semibold text-sm mb-4">Average Recovery Time (Hrs)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="var(--color-subtitle)" fontSize={12} />
              <YAxis stroke="var(--color-subtitle)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-panel)",
                  borderColor: "var(--border)",
                  borderWidth: 1,
                  fontSize: "0.75rem",
                  color: "var(--color-title)",
                }}
                labelStyle={{ color: "var(--color-title)" }}
                itemStyle={{ color: "var(--color-title)" }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--strokeLine)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
