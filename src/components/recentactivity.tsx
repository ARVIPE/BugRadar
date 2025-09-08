import { MessageSquare, AlertCircle } from "lucide-react"

export default function RecentActivity() {
  const activities = [
    {
      icon: <MessageSquare className="w-4 h-4 text-skin-subtitle" />,
      content: (
        <>
          Error <span className="text-destructive font-medium">#L004</span> in{" "}
          <span className="text-skin-title">PaymentService</span> marked as resolved by{" "}
          <span className="font-semibold">Admin User</span>.
        </>
      ),
      time: "2 hours ago",
    },
    {
      icon: <AlertCircle className="w-4 h-4 text-skin-subtitle" />,
      content: (
        <>
          New alert rule <span className="font-medium text-[var(--highcpuAlert)]">"High CPU Alert"</span> created for{" "}
          <span className="text-skin-title">AnalyticsService</span>.
        </>
      ),
      time: "1 day ago",
    },
  ]

  return (
    <div className="mt-10 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
      <h3 className="text-skin-title font-semibold text-sm mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="pt-0.5">{activity.icon}</div>
            <div className="text-sm text-skin-subtitle">
              <div>{activity.content}</div>
              <div className="text-xs text-skin-subtitle opacity-75 mt-1">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
