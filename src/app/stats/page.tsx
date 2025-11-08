"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useSession } from "next-auth/react"
import { ShieldAlert, ShieldCheck, Users, AlertTriangle, TrendingUp, Loader2 } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useProject } from "@/hooks/useProject" // 1. Importar hook de proyecto
import { useRouter } from "next/navigation"

const initialStats = {
  totalErrors: 0,
  totalWarnings: 0,
  uptime: 0,
  mtbf: "0.00",
  errorRate: "0.00",
  warningRate: "0.00",
  logVolume: [],
}

export default function StatsPage() {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: session, status } = useSession()
  const { projectId } = useProject() // 2. Obtener projectId
  const router = useRouter()

  useEffect(() => {
    // 3. Esperar a que 'status' y 'projectId' estén listos
    if (status === 'loading' || !projectId) {
      setLoading(true)
      return
    }

    if (status === 'unauthenticated') {
      setLoading(false)
      router.push("/") // Redirigir si no está logueado
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      try {
        // 4. Pasar projectId a la API
        const response = await fetch(`/api/noisy-app-stats?project_id=${projectId}`) // <-- CAMBIO
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Network response was not ok`);
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
  }, [status, projectId, router]) // 5. Añadir projectId a las dependencias

  const isAuthenticated = status === 'authenticated';

  // 6. Tu JSX original (solo he cambiado el spinner de carga)
  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-10">

          {loading && (
             <div className="flex h-64 items-center justify-center">
               <Loader2 className="w-8 h-8 animate-spin text-skin-subtitle" />
             </div>
          )}
          {error && <p className="text-red-500 text-center">Error: {error}</p>}

          {!loading && !error && isAuthenticated && (
            <>
              {/* Summary Cards (Tu JSX original) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* UPTIME */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">Uptime</h2>
                    <ShieldCheck className="text-green-500" size={18} />
                  </div>
                  <p className={`text-2xl font-bold mt-2 text-green-500`}>{stats.uptime}%</p>
                  <p className="text-xs text-skin-subtitle">Last 24 hours</p>
                </div>

                {/* MTBF */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">Mean Time Between Failures (MTBF)</h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-skin-title">{stats.mtbf} minutes</p>
                  <p className="text-xs text-skin-subtitle">Based on error logs</p>
                </div>

                {/* TOTAL ERRORS */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">Total Errors</h2>
                    <AlertTriangle className="text-red-500" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-red-500">{stats.totalErrors}</p>
                  <p className="text-xs text-skin-subtitle">Last 24 hours</p>
                </div>

                {/* ERROR RATE */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">Error Rate</h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-red-500">{stats.errorRate}%</p>
                  <p className="text-xs text-skin-subtitle">Last 24 hours</p>
                </div>

                {/* WARNING RATE */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">Warning Rate</h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-yellow-500">{stats.warningRate}%</p>
                  <p className="text-xs text-skin-subtitle">Last 24 hours</p>
                </div>
              </div>

              {/* Log Volume Chart (Tu JSX original) */}
              <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                  Log Volume – Last 7 Days
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.logVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-panel)", borderColor: "var(--border)" }}/>
                    <Bar dataKey="errors" stackId="a" fill="var(--red)" />
                    <Bar dataKey="warnings" stackId="a" fill="var(--yellow)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {!loading && !error && !isAuthenticated && (
            <div className="text-center bg-skin-panel border border-border rounded-lg shadow-elev-1 p-10">
                <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
                <p className="text-skin-subtitle mb-6">You need to be logged in to view these statistics.</p>
                <a href="/" className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600 transition-colors">
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