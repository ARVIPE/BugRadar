// src/app/dashboard/page.tsx (o donde tengas ese componente)
"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LogStream from "@/components/logstream";
import AlertAndChart from "@/components/alertandchart";
import RecentActivity from "@/components/recentactivity";
import { RotateCw, Bug, AlertTriangle, Activity, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetrics } from "@/components/useMetrics";
import { useState } from "react";

export default function Dashboard() {
  const { data, reload } = useMetrics(5000);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen w-full bg-skin-bg text-skin-title">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-skin-title">Dashboard Overview</h1>
          <Button className="h-10 w-[140px]" onClick={onRefresh} disabled={refreshing}>
            <RotateCw className="mr-2 h-4 w-4" />
            {refreshing ? "Refreshing..." : "Refresh data"}
          </Button>
        </div>

        {/* KPIs (mismo HTML, solo reemplazo números) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">Active Errors</h2>
            <Bug className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.activeErrors ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">live</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">Warnings Today</h2>
            <AlertTriangle className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.warningsToday ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">live</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">Logs/Hour</h2>
            <Activity className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.logsLastHour ?? 0}
            </p>
            <p className="mt-1 text-xs text-emerald-600">live</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">System Uptime</h2>
            <RefreshCcw className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.uptime.toFixed(2)}%
            </p>
          </div>
        </section>

        <LogStream />
        <AlertAndChart />
        <RecentActivity />
      </main>
      <Footer />
    </div>
  );
}
