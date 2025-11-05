// [Updated file: src/app/dashboard/page.tsx]
"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LogStream from "@/components/logstream";
import AlertAndChart from "@/components/alertandchart";
import RecentActivity from "@/components/recentactivity";
import { Bug, AlertTriangle, Activity } from "lucide-react"; // Removed unused icons
import { useMetrics } from "@/components/useMetrics";
import { useState } from "react";

import { useSession } from "next-auth/react"; // <-- 1. Import useSession
import { useProject } from "@/hooks/useProject"; // <-- 2. Import our new hook
import { useRouter } from "next/navigation"; // <-- 3. Import router

export default function Dashboard() {
  const { status } = useSession(); // <-- 4. Get auth status
  const router = useRouter();
  const { projectId } = useProject(); // <-- 5. Get the selected projectId

  // 6. Pass projectId to the useMetrics hook
  const { data, reload } = useMetrics(projectId, 5000);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload(); // reload (inside useMetrics) now knows the projectId
    setRefreshing(false);
  };

  // 7. Add a loading and auth check
  if (status === "loading" || !projectId) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading project...
      </div>
    );
  }
  if (status === "unauthenticated") {
    router.push("/"); // Redirect to login if not authenticated
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-skin-bg text-skin-title">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-skin-title">
            Dashboard Overview
          </h1>
          {/* We will add a "Change Project" button in the Navbar next */}
        </div>

        {/* KPIs (These will update automatically from useMetrics) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">
              Active Errors
            </h2>
            <Bug className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.activeErrors ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">live</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">
              Warnings Today
            </h2>
            <AlertTriangle className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.warningsToday ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">live</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">
              Logs/Hour
            </h2>
            <Activity className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.logsLastHour ?? 0}
            </p>
            <p className="mt-1 text-xs text-emerald-600">live</p>
          </div>
        </section>

        {/* Main Dashboard Components */}
        <LogStream projectId={projectId} />
        <AlertAndChart projectId={projectId} />
        <RecentActivity projectId={projectId} />
      </main>
      <Footer />
    </div>
  );
}