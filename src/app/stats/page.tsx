"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { User, BarChart2, Users } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

const userStats = [
  { date: "Jul 20", users: 120 },
  { date: "Jul 21", users: 135 },
  { date: "Jul 22", users: 162 },
  { date: "Jul 23", users: 181 },
  { date: "Jul 24", users: 170 },
  { date: "Jul 25", users: 195 },
  { date: "Jul 26", users: 230 },
]

export default function StatsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-10">
          <h1 className="text-3xl font-bold mb-6">User Statistics</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-skin-subtitle">Active Users</h2>
                <User className="text-skin-subtitle" size={18} />
              </div>
              <p className="text-2xl font-bold mt-2 text-skin-title">1,238</p>
              <p className="text-xs text-emerald-500">+5.2% vs last week</p>
            </div>

            <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-skin-subtitle">New Users This Week</h2>
                <Users className="text-skin-subtitle" size={18} />
              </div>
              <p className="text-2xl font-bold mt-2 text-skin-title">172</p>
              <p className="text-xs text-emerald-500">+12.8% growth</p>
            </div>

            <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-skin-subtitle">Roles Used</h2>
                <BarChart2 className="text-skin-subtitle" size={18} />
              </div>
              <p className="text-sm mt-2 text-skin-title">
                Admin (33%) – Developer (55%) – Viewer (12%)
              </p>
            </div>
          </div>

          {/* User Activity Chart */}
          <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
            <h2 className="text-lg font-semibold mb-4 text-skin-title">
              User Signups – Last 7 Days
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="none" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-panel)",
                    borderColor: "var(--border)",
                    fontSize: "0.75rem",
                    color: "var(--color-title)",
                  }}
                  labelStyle={{ color: "var(--color-title)" }}
                  itemStyle={{ color: "var(--color-title)" }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="var(--yellow)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
