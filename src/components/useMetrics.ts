"use client";
import { useState, useEffect, useCallback } from "react";

interface MetricData {
  activeErrors: number;
  warningsToday: number;
  logsLastHour: number;
}

// simple comparison to check if metrics changed
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
    // if there's no projectId yet, don't bother
    if (!projectId) return;

    try {
      const res = await fetch(`/api/metrics?project_id=${projectId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch metrics: ${res.statusText}`);
      }
      const json = await res.json();

      // validate data
      if (json && typeof json.activeErrors === "number") {
        // only set if something changed
        setData((prev) => {
          if (sameMetrics(prev, json)) {
            return prev; // no changes -> no re-render
          }
          return json;
        });
      } else {
        console.warn("useMetrics poll: API ok but data is invalid.");
      }
    } catch (e: unknown) {
      // don't break state if it fails once
      console.warn("useMetrics poll failed, retaining old data:", (e as Error).message);
    }
  }, [projectId]);

  useEffect(() => {
    // initial load
    reload();

    const interval = setInterval(reload, refreshInterval);

    return () => clearInterval(interval);
  }, [reload, refreshInterval]);

  return { data, reload };
};
