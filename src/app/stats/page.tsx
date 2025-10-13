"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useSession } from "next-auth/react" // Import useSession
import { Users, TrendingUp, LogIn } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

const initialStats = {
  weeklyNewUsers: 0,
  dailySignups: [],
  totalLogins: 0,
  growthRate: 0.0,
}

export default function StatsPage() {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: session, status } = useSession() // Use the useSession hook

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (status === 'unauthenticated' || !session?.supabaseAccessToken) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-user-stats`,
          {
            headers: { 'Authorization': `Bearer ${session.supabaseAccessToken}` },
          }
        )
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unknown error occurred")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [session, status]) 

  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-10">
          <h1 className="text-3xl font-bold mb-6">User & Business Statistics</h1>

          {loading && <p className="text-center">Loading statistics...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {!loading && !error && isAuthenticated && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* TARJETA DE USUARIOS SEMANALES */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">New Users This Week</h2>
                    <Users className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-skin-title">{stats.weeklyNewUsers}</p>
                  <p className="text-xs text-skin-subtitle">Last 7 days</p>
                </div>

                {/* NUEVA TARJETA: LOGINS TOTALES */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">Total Logins This Week</h2>
                    <LogIn className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-skin-title">{stats.totalLogins}</p>
                  <p className="text-xs text-skin-subtitle">Platform activity</p>
                </div>

                {/* NUEVA TARJETA: CRECIMIENTO MENSUAL */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">User Growth (MoM)</h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-skin-title">{stats.growthRate}%</p>
                  <p className="text-xs text-skin-subtitle">vs. Previous 30 days</p>
                </div>
              </div>

              {/* GRÁFICO DE ACTIVIDAD */}
              <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                  User Signups – Last 7 Days
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailySignups}>
                    {/* ... (el resto del gráfico no cambia) ... */}
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-panel)", borderColor: "var(--border)" }}/>
                    <Line type="monotone" dataKey="users" stroke="var(--yellow)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {!loading && !error && !isAuthenticated && (
            <div className="text-center bg-skin-panel border border-border rounded-lg shadow-elev-1 p-10">
                <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
                <p className="text-skin-subtitle mb-6">You need to be logged in to view these statistics.</p>
                <a href="/login" className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600 transition-colors">
                    Go to Login
                </a>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}