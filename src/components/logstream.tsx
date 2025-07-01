"use client";
import { useState } from "react";

export default function LogStream() {
  const [activeTab, setActiveTab] = useState("Errors");

  const logs = [
    {
      time: "2024-07-26 14:30:00",
      severity: "Error",
      message: "Failed to connect to database 'users_db'",
      service: "AuthService",
    },
    {
      time: "2024-07-26 14:22:40",
      severity: "Error",
      message: "Payment gateway timeout for transaction 'TXN-9876'",
      service: "PaymentService",
    },
    {
      time: "2024-07-26 14:15:30",
      severity: "Error",
      message: "API endpoint '/api/v2/data' returned 500",
      service: "DataService",
    },
    {
      time: "2024-07-26 14:09:45",
      severity: "Error",
      message: "Uncaught exception in 'DashboardComponent'",
      service: "FrontendService",
    },
    {
      time: "2024-07-26 13:58:00",
      severity: "Error",
      message: "Invalid authentication token received",
      service: "AuthService",
    },
  ];

  return (
    <div className="bg-[#223145] border border-[#393D47] rounded-lg shadow-sm p-6 mt-10">
      <h2 className="text-xl font-semibold text-white mb-4">Log Stream</h2>

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search logs..."
          className="w-full md:w-1/3 px-3 py-2 text-sm border border-gray-700 rounded-md placeholder-gray-400 text-white"
        />
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button className="text-sm border border-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
            Service
          </button>
          <button className="text-sm border border-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
            Severity
          </button>
          <button className="text-sm border border-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
            Timeframe
          </button>
        </div>
      </div>

      
      {/* Tab bar */}
      <div className="flex bg-[#1f1f25] rounded-md overflow-x-auto text-sm font-medium mb-4">
        {["Errors (5)", "Warnings (3)", "Info (2)", "Debug (2)", "Metrics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 flex-1 ${
              activeTab === tab
                ? "bg-yellow-400 text-black font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table: Visible only on md+ */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 px-3 py-2 text-xs uppercase text-gray-400 border-b border-gray-700">
          <div>Timestamp</div>
          <div>Severity</div>
          <div>Message</div>
          <div>Service</div>
          <div className="text-right">Actions</div>
        </div>

        {logs.map((log, index) => (
          <div
            key={index}
            className="grid grid-cols-5 px-3 py-3 text-sm text-gray-200 border-b border-gray-800 hover:bg-[#1f1f25]"
          >
            <div>{log.time}</div>
            <div>
              <span className="inline-block px-2 py-0.5 text-xs font-medium text-red-400 bg-red-900 rounded-full">
                {log.severity}
              </span>
            </div>
            <div>{log.message}</div>
            <div>{log.service}</div>
            <div className="text-right">
              <a href="#" className="text-yellow-400 hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile version: stacked cards */}
      <div className="md:hidden flex flex-col gap-4">
        {logs.map((log, index) => (
          <div
            key={index}
            className="border border-gray-700 rounded-md p-4 bg-[#1f1f25] shadow-sm"
          >
            <div className="text-xs text-gray-400 mb-1">Timestamp</div>
            <div className="mb-2">{log.time}</div>

            <div className="text-xs text-gray-400 mb-1">Severity</div>
            <div className="mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-medium text-red-400 bg-red-900 rounded-full">
                {log.severity}
              </span>
            </div>

            <div className="text-xs text-gray-400 mb-1">Message</div>
            <div className="mb-2">{log.message}</div>

            <div className="text-xs text-gray-400 mb-1">Service</div>
            <div className="mb-2">{log.service}</div>

            <div className="text-right mt-2">
              <a href="#" className="text-yellow-400 text-sm font-medium hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
