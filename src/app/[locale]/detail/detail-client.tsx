"use client";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";

const data = [
  { date: "Jul 20", value: 6 },
  { date: "Jul 21", value: 8 },
  { date: "Jul 22", value: 12 },
  { date: "Jul 23", value: 15 },
  { date: "Jul 24", value: 11 },
  { date: "Jul 25", value: 18 },
  { date: "Jul 26", value: 24 },
];

export default function DetailClient({}: { id: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Detail");

  const handleBack = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-skin-bg text-skin-title py-10 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-skin-subtitle">
              {t("timestampExample")}
            </p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft size={16} className="mr-2" />
              {t("back")}
            </Button>
          </div>

          {/* Grid layout */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Left column */}
            <div className="md:col-span-2 space-y-6 flex flex-col">
              {/* Error Details */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-2 text-skin-title">
                  {t("errorDetails")}
                </h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {t("errorDescription")}
                </p>
                <Button className="text-sm">
                  <Code size={16} className="mr-2" /> {t("viewStack")}
                </Button>
              </div>

              {/* Recurrence History */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 flex-1 flex flex-col shadow-elev-1">
                <h2 className="text-lg font-semibold mb-1 text-skin-title">
                  {t("recurrenceTitle")}
                </h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {t("recurrenceSubtitle")}
                </p>
                <div className="flex-grow min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <XAxis
                        dataKey="date"
                        stroke="var(--color-subtitle)"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="var(--color-subtitle)"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-panel)",
                          borderColor: "var(--border)",
                          borderWidth: 1,
                          color: "var(--color-title)",
                          fontSize: "0.8rem",
                        }}
                        labelStyle={{ color: "var(--color-title)" }}
                        itemStyle={{ color: "var(--color-title)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--yellow)"
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          stroke: "var(--yellow)",
                          strokeWidth: 2,
                          fill: "var(--yellow)",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6 flex flex-col">
              {/* Actions */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                  {t("actions")}
                </h2>
                <Button
                  className="w-full mb-2"
                  style={{ background: "var(--yellow)", color: "black" }}
                >
                  {t("markResolved")}
                </Button>
                <Button variant="outline" className="w-full mb-2">
                  {t("ignore")}
                </Button>
                <Button variant="ghost" className="w-full">
                  <Share2 size={16} className="mr-2" /> {t("share")}
                </Button>
              </div>

              {/* Tags */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-4 text-skin-title">
                  {t("tags")}
                </h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    AuthService
                  </span>
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    production
                  </span>
                  <span className="px-2 py-1 rounded border border-border bg-skin-bg text-skin-title">
                    TypeError
                  </span>
                  <span className="px-2 py-1 rounded border border-destructive/30 text-destructive">
                    {t("severityHigh")}
                  </span>
                </div>
              </div>

              {/* Related Logs */}
              <div className="bg-skin-panel rounded-lg border border-border p-5 flex-1 shadow-elev-1">
                <h2 className="text-lg font-semibold mb-1 text-skin-title">
                  {t("relatedLogs")}
                </h2>
                <p className="text-sm text-skin-subtitle mb-4">
                  {t("relatedLogsSubtitle")}
                </p>
                <div className="space-y-4">
                  {[
                    {
                      type: "High",
                      time: "10:29:50",
                      msg: "API call to /auth/login failed with status 500.",
                      service: "AuthService",
                    },
                    {
                      type: "Warning",
                      time: "10:29:45",
                      msg: "User 'john.doe' attempted login with invalid credentials.",
                      service: "AuthService",
                    },
                    {
                      type: "High",
                      time: "10:30:05",
                      msg: "Unhandled promise rejection detected.",
                      service: "AuthService",
                    },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="p-3 rounded text-sm flex flex-col gap-1 border border-border bg-skin-bg"
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.type === "High"
                              ? "text-destructive border border-destructive"
                              : "text-[var(--yellow)] border border-[color:var(--yellow)]/40"
                          }`}
                        >
                          {log.type === "High"
                            ? t("badgeHigh")
                            : t("badgeWarning")}
                        </span>
                        <span className="text-xs text-skin-subtitle">
                          {log.time}
                        </span>
                      </div>
                      <p className="text-skin-title">{log.msg}</p>
                      <p className="text-xs text-skin-subtitle">
                        {t("serviceLabel")} {log.service}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
