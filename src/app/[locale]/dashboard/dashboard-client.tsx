"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LogStream from "@/components/logstream";
import AlertAndChart from "@/components/alertandchart";
import RecentActivity from "@/components/recentactivity";
import { Bug, AlertTriangle, Activity } from "lucide-react";
import { useMetrics } from "@/components/useMetrics";
import { useEffect } from "react";

import { useSession } from "next-auth/react";
import { useProject } from "@/hooks/useProject";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function DashboardClient() {
  const { status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const { projectId } = useProject();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}`);
    }
  }, [status, router, locale]);

  const { data } = useMetrics(projectId, 5000);

  if (status === "loading" || !projectId) {
    return (
      <div className="flex h-screen items-center justify-center">
        {t("loading")}
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-skin-bg text-skin-title">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-skin-title">
            {t("overview")}
          </h1>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px] ">
            <h2 className="text-sm font-medium text-skin-subtitle">
              {t("activeErrors")}
            </h2>
            <Bug className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.activeErrors ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">{t("live")}</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">
              {t("warningsToday")}
            </h2>
            <AlertTriangle className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.warningsToday ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">{t("live")}</p>
          </div>

          <div className="relative bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5 h-[126px]">
            <h2 className="text-sm font-medium text-skin-subtitle">
              {t("logsPerHour")}
            </h2>
            <Activity className="absolute top-5 right-5 w-5 h-5 text-skin-subtitle" />
            <p className="mt-2 text-2xl font-bold text-skin-title">
              {data?.logsLastHour ?? 0}
            </p>
            <p className="mt-1 text-xs text-emerald-600">{t("live")}</p>
          </div>
        </section>

        <LogStream projectId={projectId} />
        <AlertAndChart projectId={projectId} />
        <RecentActivity projectId={projectId} />
      </main>
      <Footer />
    </div>
  );
}
