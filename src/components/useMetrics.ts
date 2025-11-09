"use client";
import { useState, useEffect, useCallback } from "react";

interface MetricData {
  activeErrors: number;
  warningsToday: number;
  logsLastHour: number;
}

// comparación simple para saber si las métricas cambiaron
function sameMetrics(a: MetricData | null, b: MetricData | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.activeErrors === b.activeErrors &&
    a.warningsToday === b.warningsToday &&
    a.logsLastHour === b.logsLastHour
  );
}

export const useMetrics = (
  projectId: string | null,
  refreshInterval: number
) => {
  const [data, setData] = useState<MetricData | null>(null);

  const reload = useCallback(async () => {
    // si aún no hay projectId, no molestamos
    if (!projectId) return;

    try {
      const res = await fetch(`/api/metrics?project_id=${projectId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch metrics: ${res.statusText}`);
      }
      const json = await res.json();

      // validar datos
      if (json && typeof json.activeErrors === "number") {
        // 👇 solo seteamos si cambió algo
        setData((prev) => {
          if (sameMetrics(prev, json)) {
            return prev; // no hay cambios -> no re-render
          }
          return json;
        });
      } else {
        console.warn("useMetrics poll: API ok but data is invalid.");
      }
    } catch (e: unknown) {
      // no reventamos el estado si falla una vez
      console.warn("useMetrics poll failed, retaining old data:", (e as Error).message);
    }
  }, [projectId]);

  useEffect(() => {
    // carga inicial
    reload();

    const interval = setInterval(reload, refreshInterval);

    return () => clearInterval(interval);
  }, [reload, refreshInterval]);

  return { data, reload };
};
