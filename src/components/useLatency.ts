"use client";
import { useState, useEffect, useCallback } from "react";

export interface LatencyRecord {
  created_at: string;
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number;
}

// 1. Añadimos 'projectId' como primer argumento
export const useLatency = (
  projectId: string | null, // <-- CAMBIO
  refreshInterval: number
) => {
  const [data, setData] = useState<LatencyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    // 2. No hacer fetch si falta el ID
    if (!projectId) {
      setLoading(false);
      return;
    }

    // (Solo mostrar 'loading' en la carga inicial)
    if (data === null) {
      setLoading(true);
    }

    try {
      // 3. Añadir el projectId a la URL
      const res = await fetch(`/api/latency?project_id=${projectId}`); // <-- CAMBIO
      if (!res.ok) {
        throw new Error(`Failed to fetch latency: ${res.statusText}`);
      }
      const json = await res.json();
      
      // 4. Comprobar que 'items' es un array (previene flasheo)
      if (Array.isArray(json.items)) {
        setData(json.items);
      } else {
        console.warn("useLatency: API OK but json.items is not an array");
      }
    } catch (e: unknown) {
      console.warn("useLatency poll failed, retaining old data", (e as Error).message);
      // No ponemos setData(null) para evitar el flasheo
    } finally {
      setLoading(false);
    }
  }, [projectId, data]); // 'data' está aquí para la lógica de setLoading

  useEffect(() => {
    reload(); // Carga inicial
    const interval = setInterval(reload, refreshInterval);
    return () => clearInterval(interval);
  }, [reload, refreshInterval]);

  return { data, loading, reload };
};