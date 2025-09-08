import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LogStream from "@/components/logstream"
import AlertAndChart from "@/components/alertandchart"
import RecentActivity from "@/components/recentactivity"
import { RotateCw, Bug, AlertTriangle, Activity, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <div className="min-h-screen w-full bg-skin-bg text-skin-title">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-skin-title">Dashboard Overview</h1>
          <Button className="h-10 w-[140px]">
            <RotateCw className="mr-2 h-4 w-4" />
            Refresh data
          </Button>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">Active Errors</h2>
            <Bug className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">5,234</p>
            <p className="mt-1 text-xs text-destructive">+20.1% from last month</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">Warnings Today</h2>
            <AlertTriangle className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">1,890</p>
            <p className="mt-1 text-xs text-destructive">+15.0% from yesterday</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">Logs/Hour</h2>
            <Activity className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">8,765</p>
            <p className="mt-1 text-xs text-emerald-600">+5.5% from last hour</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">System Uptime</h2>
            <RefreshCcw className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">99.98%</p>
            <p className="mt-1 text-xs text-emerald-600">+0.01% from last week</p>
          </div>
        </section>

        <LogStream />
        <AlertAndChart />
        <RecentActivity />
      </main>

      <Footer />
    </div>
  )
}
