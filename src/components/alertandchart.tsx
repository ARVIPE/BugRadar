"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { useEffect, useState } from "react"

// Tipo de dato esperado de nuestra API
type RecoveryData = {
  date: string;
  value: number;
}

export default function AlertAndChart() {
  const [data, setData] = useState<RecoveryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Función async para fetchear los datos
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/metrics/recovery-times-series');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setData([]); // Asegurarse de que no haya datos erróneos
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Se ejecuta solo una vez al montar el componente

  return (
    <div className="grid grid-cols-1 gap-6 mt-10">
      {/* Average Recovery Time Chart */}
      <div className="col-span-1 md:col-span-2 bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
        <h3 className="text-skin-title font-semibold text-sm mb-4">Tiempo de Recuperación Promedio (Hrs) - Últimos 7 días</h3>
        <div className="h-48 w-full">
          {isLoading ? (
            // --- Estado de Carga ---
            <div className="flex items-center justify-center h-full text-skin-subtitle">
              Cargando datos del gráfico...
            </div>
          ) : data.length === 0 ? (
            // --- Estado Sin Datos ---
            <div className="flex items-center justify-center h-full text-skin-subtitle">
              No hay suficientes eventos resueltos en los últimos 7 días.
            </div>
          ) : (
            // --- Gráfico con Datos ---
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--color-subtitle)" fontSize={12} />
                <YAxis stroke="var(--color-subtitle)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-panel)",
                    borderColor: "var(--border)",
                    borderWidth: 1,
                    fontSize: "0.75rem",
                    color: "var(--color-title)",
                    borderRadius: "0.5rem" // Añadido para consistencia
                  }}
                  labelStyle={{ color: "var(--color-title)" }}
                  itemStyle={{ color: "var(--color-title)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--strokeLine)" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "var(--strokeLine)" }} // Puntos en los datos
                  activeDot={{ r: 6 }} // Punto activo al hacer hover
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
