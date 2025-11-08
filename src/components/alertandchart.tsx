"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type RecoveryData = {
  date: string;
  value: number;
};

interface AlertAndChartProps {
  projectId: string | null;
}

export default function AlertAndChart({ projectId }: AlertAndChartProps) {
  const [data, setData] = useState<RecoveryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("AlertAndChart");

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/metrics/recovery-times-series?project_id=${projectId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 gap-6 mt-10">
      <div className="col-span-1 md:col-span-2 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
        <h3 className="text-skin-title font-semibold text-sm mb-4">
          {t("title")}
        </h3>

        <div className="h-48 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-skin-subtitle">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-skin-subtitle">
              {t("empty")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-subtitle)"
                  fontSize={12}
                />
                <YAxis stroke="var(--color-subtitle)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-panel)",
                    borderColor: "var(--border)",
                    borderWidth: 1,
                    fontSize: "0.75rem",
                    color: "var(--color-title)",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "var(--color-title)" }}
                  itemStyle={{ color: "var(--color-title)" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={t("tooltipLabel")}
                  stroke="var(--strokeLine)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--strokeLine)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
