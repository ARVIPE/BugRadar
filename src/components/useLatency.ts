// src/components/useLatency.ts
"use client";
import { useEffect, useState } from "react";

export type LatencyRecord = {
  endpoint: string;
  method: string;
  latency_ms: number;
  status_code: number;
  created_at: string;
};

export function useLatency(refreshMs = 30000) {
  const [data, setData] = useState<LatencyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/latency", { cache: "no-store", signal });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to fetch latency data:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const timer = setInterval(() => load(controller.signal), refreshMs);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refreshMs]);

  return { data, loading, reload: load };
}
