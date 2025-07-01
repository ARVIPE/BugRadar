import LogStream from "@/components/logstream";
import Navbar from "@/components/navbar";
import { RotateCw, Bug, AlertTriangle, Activity, RefreshCcw } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="bg-gray-800 min-h-screen w-full text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header row: title + refresh */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#F4F4F6]">Dashboard Overview</h1>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 w-[138.9375px] text-sm font-medium text-[#8C8D8B] border border-[#393D47] rounded-md hover:bg-[#24364f] hover:text-[#8C8D8B] active:bg-black disabled:opacity-40"
          >
            <RotateCw size={16} className="text-[#8C8D8B]" />
            Refresh data
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Errors */}
          <div className="relative bg-[#223145] border border-[#393D47] rounded-lg shadow-sm p-5 h-[126px]">
            <h2 className="text-sm font-medium text-[#8C8D8B]">Active Errors</h2>
            <Bug className="absolute top-5 right-5 w-5 h-5 text-[#8C8D8B]" />
            <p className="mt-2 text-2xl font-bold text-[#F4F4F6]">5,234</p>
            <p className="mt-1 text-xs text-red-500">20.1% from last month</p>
          </div>

          {/* Card 2: Warnings Today */}
          <div className="relative bg-[#223145] border border-[#393D47] rounded-lg shadow-sm p-5 h-[126px]">
            <h2 className="text-sm font-medium text-[#8C8D8B]">Warnings Today</h2>
            <AlertTriangle className="absolute top-5 right-5 w-5 h-5 text-[#8C8D8B]" />
            <p className="mt-2 text-2xl font-bold text-[#F4F4F6]">1,890</p>
            <p className="mt-1 text-xs text-red-500">15.0% from yesterday</p>
          </div>

          {/* Card 3: Logs/Hour */}
          <div className="relative bg-[#223145] border border-[#393D47] rounded-lg shadow-sm p-5 h-[126px]">
            <h2 className="text-sm font-medium text-[#8C8D8B]">Logs/Hour</h2>
            <Activity className="absolute top-5 right-5 w-5 h-5 text-[#8C8D8B]" />
            <p className="mt-2 text-2xl font-bold text-[#F4F4F6]">8,765</p>
            <p className="mt-1 text-xs text-green-500">5.5% from last hour</p>
          </div>

          {/* Card 4: System Uptime */}
          <div className="relative bg-[#223145] border border-[#393D47] rounded-lg shadow-sm p-5 h-[126px]">
            <h2 className="text-sm font-medium text-[#8C8D8B]">System Uptime</h2>
            <RefreshCcw className="absolute top-5 right-5 w-5 h-5 text-[#8C8D8B]" />
            <p className="mt-2 text-2xl font-bold text-[#F4F4F6]">99.98%</p>
            <p className="mt-1 text-xs text-green-500">0.01% from last week</p>
          </div>
        </div>

        <LogStream />
      </div>
    </div>
  );
}
