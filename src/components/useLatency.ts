"use client";
import { useState, useEffect, useCallback } from "react";

export interface LatencyRecord {
  created_at: string;
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number;
}

// Add 'projectId' as first argument
export const useLatency = (
  projectId: string | null, 
  refreshInterval: number
) => {
  const [data, setData] = useState<LatencyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    if (data === null) {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/latency?project_id=${projectId}`); 
      if (!res.ok) {
        throw new Error(`Failed to fetch latency: ${res.statusText}`);
      }
      const json = await res.json();
      
      if (Array.isArray(json.items)) {
        setData(json.items);
      } else {
        console.warn("useLatency: API OK but json.items is not an array");
      }
    } catch (e: unknown) {
      console.warn("useLatency poll failed, retaining old data", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId, data]); 

  useEffect(() => {
    reload(); // Initial load
    const interval = setInterval(reload, refreshInterval);
    return () => clearInterval(interval);
  }, [reload, refreshInterval]);

  return { data, loading, reload };
};