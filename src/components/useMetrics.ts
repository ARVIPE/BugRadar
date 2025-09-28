// src/components/useMetrics.ts
"use client";
import { useEffect, useState } from "react";

type Metrics = {
  activeErrors: number;
  warningsToday: number;
  logsLastHour: number;
  uptime: number;
};

export function useMetrics(refreshMs = 5000) {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let t: any;

    const load = async () => {
      try {
        const res = await fetch("/api/metrics", { cache: "no-store" });
        if (!mounted) return;
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        // si es aborto, lo ignoramos; si no, log opcional
        if (err?.name !== "AbortError") {
          // console.debug(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    t = setInterval(load, refreshMs);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [refreshMs]);

  return { data, loading, reload: async () => {} };
}
