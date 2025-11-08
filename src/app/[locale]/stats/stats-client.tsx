"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useProject } from "@/hooks/useProject";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const initialStats = {
  totalErrors: 0,
  totalWarnings: 0,
  uptime: 0,
  mtbf: "0.00",
  errorRate: "0.00",
  warningRate: "0.00",
  logVolume: [],
};

export default function StatsClient() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const { projectId } = useProject();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Stats");

  useEffect(() => {
    if (status === "loading" || !projectId) {
      setLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setLoading(false);
      router.push(`/${locale}`); // redirige con locale
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/noisy-app-stats?project_id=${projectId}`
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Network response was not ok");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t("unknownError"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [status, projectId, router, locale, t]);

  const isAuthenticated = status === "authenticated";

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-6xl mx-auto space-y-10">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-skin-subtitle" />
            </div>
          )}

          {error && !loading && (
            <p className="text-red-500 text-center">
              {t("errorPrefix")} {error}
            </p>
          )}

          {!loading && !error && isAuthenticated && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* UPTIME */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">
                      {t("uptime")}
                    </h2>
                    <ShieldCheck className="text-green-500" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-green-500">
                    {stats.uptime}%
                  </p>
                  <p className="text-xs text-skin-subtitle">
                    {t("last24h")}
                  </p>
                </div>

                {/* MTBF */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">
                      {t("mtbf")}
                    </h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-skin-title">
                    {stats.mtbf} {t("minutes")}
                  </p>
                  <p className="text-xs text-skin-subtitle">
                    {t("basedOnErrors")}
                  </p>
                </div>

                {/* TOTAL ERRORS */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">
                      {t("totalErrors")}
                    </h2>
                    <AlertTriangle className="text-red-500" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-red-500">
                    {stats.totalErrors}
                  </p>
                  <p className="text-xs text-skin-subtitle">
                    {t("last24h")}
                  </p>
                </div>

                {/* ERROR RATE */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">
                      {t("errorRate")}
                    </h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-red-500">
                    {stats.errorRate}%
                  </p>
                  <p className="text-xs text-skin-subtitle">
                    {t("last24h")}
                  </p>
                </div>

                {/* WARNING RATE */}
                <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-skin-subtitle">
                      {t("warningRate")}
                    </h2>
                    <TrendingUp className="text-skin-subtitle" size={18} />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-yellow-500">
                    {stats.warningRate}%
                  </p>
                  <p className="text-xs text-skin-subtitle">
                    {t("last24h")}
                  </p>
                </div>
              </div>

              {/* Log Volume Chart */}
              <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                    {t("logVolumeTitle")}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.logVolume}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis dataKey="date" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-panel)",
                        borderColor: "var(--border)",
                      }}
                    />
                    <Bar dataKey="errors" stackId="a" fill="var(--red)" />
                    <Bar dataKey="warnings" stackId="a" fill="var(--yellow)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {!loading && !error && !isAuthenticated && (
            <div className="text-center bg-skin-panel border border-border rounded-lg shadow-elev-1 p-10">
              <h2 className="text-xl font-semibold mb-4">
                {t("accessDenied")}
              </h2>
              <p className="text-skin-subtitle mb-6">{t("needLogin")}</p>
              <a
                href={`/${locale}`}
                className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
              >
                {t("goToLogin")}
              </a>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
