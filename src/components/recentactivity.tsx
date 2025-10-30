"use client"
import { 
  MessageSquare, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Slash,
  Loader2 
} from "lucide-react"
import { useEffect, useState } from "react" // Error corregido aquí
import Link from "next/link"

// Tipo de dato que esperamos de nuestra API /api/activity
type Activity = {
  id: string;
  timestamp: string;
  type: 'new_event' | 'resolved_event' | 'ignored_event';
  severity?: string;
  container_name?: string;
  log_message?: string;
  user_email?: string | null;
}

// Pequeña función utilitaria para "hace X tiempo"
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/activity');
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // --- Funciones Helper para Renderizar ---

  const renderActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'new_event':
        return activity.severity === 'error' 
          ? <AlertCircle className="w-4 h-4 text-destructive" /> 
          : <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'resolved_event':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'ignored_event':
        return <Slash className="w-4 h-4 text-skin-subtitle" />;
      default:
        return <MessageSquare className="w-4 h-4 text-skin-subtitle" />;
    }
  }

  const renderActivityContent = (activity: Activity) => {
    // Acortar el ID del evento
    const shortId = activity.id.split('-')[0].toUpperCase();

    switch (activity.type) {
      case 'new_event':
        return (
          <>
            Nuevo {activity.severity === 'error' ? 'error' : 'warning'} en{" "}
            <span className="text-skin-title">{activity.container_name}</span>.
            <Link href={`/detail/${activity.id}`} className="ml-1 text-blue-500 hover:underline">
              (#{shortId})
            </Link>
          </>
        );
      case 'resolved_event':
        return (
          <>
            Evento{" "}
            <Link href={`/detail/${activity.id}`} className="text-blue-500 hover:underline">
              (#{shortId})
            </Link>{" "}
            en <span className="text-skin-title">{activity.container_name}</span>{" "}
            marcado como resuelto por{" "}
            <span className="font-semibold">{activity.user_email}</span>.
          </>
        );
      case 'ignored_event':
        return (
          <>
            Evento{" "}
            <Link href={`/detail/${activity.id}`} className="text-blue-500 hover:underline">
              (#{shortId})
            </Link>{" "}
            en <span className="text-skin-title">{activity.container_name}</span>{" "}
            marcado como ignorado por{" "}
            <span className="font-semibold">{activity.user_email}</span>.
          </>
        );
      default:
        return "Actividad desconocida.";
    }
  }

  // --- Renderizado del Componente ---

  return (
    <div className="mt-10 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
      <h3 className="text-skin-title font-semibold text-sm mb-4">Recent Activity</h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="w-6 h-6 text-skin-subtitle animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex justify-center items-center h-24">
          <span className="text-sm text-skin-subtitle">No hay actividad reciente.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id + activity.type} className="flex items-start gap-3">
              <div className="pt-0.5">{renderActivityIcon(activity)}</div>
              <div className="text-sm text-skin-subtitle">
                <div>{renderActivityContent(activity)}</div>
                <div className="text-xs text-skin-subtitle opacity-75 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

