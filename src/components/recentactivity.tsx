import { MessageSquare, AlertCircle } from "lucide-react";

export default function RecentActivity() {
  const activities = [
    {
      icon: <MessageSquare className="w-4 h-4 text-gray-400" />,
      content: (
        <>
          Error <span className="text-red-500 font-medium">#L004</span> in{" "}
          <span className="text-white">PaymentService</span> marked as resolved by{" "}
          <span className="font-semibold">Admin User</span>.
        </>
      ),
      time: "2 hours ago",
    },
    {
      icon: <AlertCircle className="w-4 h-4 text-gray-400" />,
      content: (
        <>
          New alert rule{" "}
          <span className="text-yellow-400 font-medium">"High CPU Alert"</span> created for{" "}
          <span className="text-white">AnalyticsService</span>.
        </>
      ),
      time: "1 day ago",
    },
  ];

  return (
    <div className="mt-10 bg-[#223145] border border-[#393D47] rounded-lg shadow-sm p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="pt-0.5">{activity.icon}</div>
            <div className="text-sm text-gray-300">
              <div>{activity.content}</div>
              <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
