"use client";

import {
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Slash,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Activity = {
  id: string;
  timestamp: string;
  type: "new_event" | "resolved_event" | "ignored_event";
  severity?: "error" | "warning" | string;
  container_name?: string;
  log_message?: string;
  user_email?: string | null;
};

interface RecentActivityProps {
  projectId: string | null;
}

// comparison to avoid re-rendering if nothing changed
function sameActivities(a: Activity[], b: Activity[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const aa = a[i];
    const bb = b[i];
    if (
      aa.id !== bb.id ||
      aa.timestamp !== bb.timestamp ||
      aa.type !== bb.type ||
      (aa.severity ?? "") !== (bb.severity ?? "") ||
      (aa.container_name ?? "") !== (bb.container_name ?? "") ||
      (aa.log_message ?? "") !== (bb.log_message ?? "") ||
      (aa.user_email ?? "") !== (bb.user_email ?? "")
    ) {
      return false;
    }
  }
  return true;
}

// same type of parameter used by next-intl
function formatTimeAgo(
  dateString: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return t("time.seconds", { value: seconds });
  if (minutes < 60) return t("time.minutes", { value: minutes });
  if (hours < 24) return t("time.hours", { value: hours });
  return t("time.days", { value: days });
}

export default function RecentActivity({ projectId }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("RecentActivity");

  useEffect(() => {
    let cancelled = false;
    let isFirstLoad = true;

    const fetchActivities = async () => {
      if (!projectId) {
        if (!cancelled) {
          setActivities([]);
          setIsLoading(false);
        }
        return;
      }

      if (isFirstLoad && !cancelled) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(
          `/api/activity?project_id=${encodeURIComponent(projectId)}`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }
        const data: Activity[] = await response.json();

        if (!cancelled) {
          setActivities((prev) => {
            if (sameActivities(prev, data)) return prev;
            return data;
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error(error);
        }
      } finally {
        if (!cancelled && isFirstLoad) {
          setIsLoading(false);
          isFirstLoad = false;
        }
      }
    };

    void fetchActivities();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const renderActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case "new_event":
        return activity.severity === "error" ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-warning" />
        );
      case "resolved_event":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "ignored_event":
        return <Slash className="w-4 h-4 text-skin-subtitle" />;
      default:
        return <MessageSquare className="w-4 h-4 text-skin-subtitle" />;
    }
  };

  const renderActivityContent = (activity: Activity) => {
    const shortId = activity.id.split("-")[0]?.toUpperCase?.() ?? activity.id;
    const link = (
      <Link
        href={`/${locale}/detail/${activity.id}`}
        className="ml-1 text-blue-500 hover:underline"
      >
        (#{shortId})
      </Link>
    );

    switch (activity.type) {
      case "new_event":
        return (
          <>
            {t("newEvent", {
              severity:
                activity.severity === "error"
                  ? t("severity.error")
                  : t("severity.warning"),
              container: activity.container_name ?? t("unknownContainer"),
            })}{" "}
            {link}
          </>
        );
      case "resolved_event":
        return (
          <>
            {t("resolvedEvent", {
              container: activity.container_name ?? t("unknownContainer"),
              user: activity.user_email ?? t("unknownUser"),
            })}{" "}
            {link}
          </>
        );
      case "ignored_event":
        return (
          <>
            {t("ignoredEvent", {
              container: activity.container_name ?? t("unknownContainer"),
              user: activity.user_email ?? t("unknownUser"),
            })}{" "}
            {link}
          </>
        );
      default:
        return t("unknownActivity");
    }
  };

  return (
    <div className="mt-10 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
      <h3 className="text-skin-title font-semibold text-sm mb-4">
        {t("title")}
      </h3>

      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="w-6 h-6 text-skin-subtitle animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex justify-center items-center h-24">
          <span className="text-sm text-skin-subtitle">{t("empty")}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id + activity.type}
              className="flex items-start gap-3"
            >
              <div className="pt-0.5">{renderActivityIcon(activity)}</div>
              <div className="text-sm text-skin-subtitle">
                <div>{renderActivityContent(activity)}</div>
                <div className="text-xs text-skin-subtitle opacity-75 mt-1">
                  {formatTimeAgo(activity.timestamp, t)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
