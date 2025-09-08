"use client"
import { useState } from "react"

export default function LogStream() {
  const [activeTab, setActiveTab] = useState("Errors (5)")

  const logs = [
    { time: "2024-07-26 14:30:00", severity: "Error", message: "Failed to connect to database 'users_db'", service: "AuthService" },
    { time: "2024-07-26 14:22:40", severity: "Error", message: "Payment gateway timeout for transaction 'TXN-9876'", service: "PaymentService" },
    { time: "2024-07-26 14:15:30", severity: "Error", message: "API endpoint '/api/v2/data' returned 500", service: "DataService" },
    { time: "2024-07-26 14:09:45", severity: "Error", message: "Uncaught exception in 'DashboardComponent'", service: "FrontendService" },
    { time: "2024-07-26 13:58:00", severity: "Error", message: "Invalid authentication token received", service: "AuthService" },
  ]

  return (
    <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6 mt-10">
      <h2 className="text-xl font-semibold text-skin-title mb-4">Log Stream</h2>

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search logs..."
          className="w-full md:w-1/3 px-3 py-2 text-sm bg-skin-input border border-border rounded-md
                     placeholder:text-skin-subtitle text-skin-title
                     focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
        />
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button className="text-sm border border-border text-skin-title px-3 py-1.5 rounded-md hover:bg-skin-bg">
            Service
          </button>
          <button className="text-sm border border-border text-skin-title px-3 py-1.5 rounded-md hover:bg-skin-bg">
            Severity
          </button>
          <button className="text-sm border border-border text-skin-title px-3 py-1.5 rounded-md hover:bg-skin-bg">
            Timeframe
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-skin-bg rounded-md overflow-x-auto text-sm font-medium mb-4">
        {["Errors (5)", "Warnings (3)", "Info (2)", "Debug (2)", "Metrics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 flex-1 transition-colors
              ${activeTab === tab
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-skin-subtitle hover:text-skin-title hover:bg-skin-panel"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table: md+ */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 px-3 py-2 text-xs uppercase text-skin-subtitle border-b border-border">
          <div>Timestamp</div>
          <div>Severity</div>
          <div>Message</div>
          <div>Service</div>
          <div className="text-right">Actions</div>
        </div>

        {logs.map((log, index) => (
          <div
            key={index}
            className="grid grid-cols-5 px-3 py-3 text-sm text-skin-title border-b border-border hover:bg-skin-bg"
          >
            <div>{log.time}</div>
            <div>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full
                               bg-destructive/10 text-destructive">
                {log.severity}
              </span>
            </div>
            <div>{log.message}</div>
            <div>{log.service}</div>
            <div className="text-right">
              <a href="/detail" className="text-[var(--details-link)] hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden flex flex-col gap-4">
        {logs.map((log, index) => (
          <div key={index} className="border border-border rounded-md p-4 bg-skin-panel shadow-elev-1">
            <div className="text-xs text-skin-subtitle mb-1">Timestamp</div>
            <div className="mb-2 text-skin-title">{log.time}</div>

            <div className="text-xs text-skin-subtitle mb-1">Severity</div>
            <div className="mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full
                               bg-destructive/10 text-destructive">
                {log.severity}
              </span>
            </div>

            <div className="text-xs text-skin-subtitle mb-1">Message</div>
            <div className="mb-2 text-skin-title">{log.message}</div>

            <div className="text-xs text-skin-subtitle mb-1">Service</div>
            <div className="mb-2 text-skin-title">{log.service}</div>

            <div className="text-right mt-2">
              <a href="/detail" className="text-[var(--primary)] text-sm font-medium hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
