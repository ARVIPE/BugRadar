import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// Definición del tipo de dato para el gráfico
type ChartDataPoint = {
  date: string;
  value: number; // Promedio de horas
  dateObj: Date; // Para ordenar
};

// Definición del tipo de evento de la BBDD
type Event = {
  created_at: string;
  resolved_at: string;
};

const supabase = () =>
    createClient(
        process.env.SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
        { auth: { persistSession: false } }
    );


export async function GET() {
  try {
    // 1. Calcular la fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Empezar desde el inicio del día

    // 2. Consultar a Supabase por eventos resueltos en los últimos 7 días
    const { data: events, error } = await supabase()
      .from('events')
      .select('created_at, resolved_at')
      .eq('status', 'resolved') // Solo los resueltos
      .gte('resolved_at', sevenDaysAgo.toISOString()); // En el rango de fechas

    if (error) {
      console.error('Error fetching recovery time series:', error);
      throw error;
    }

    // 3. Procesar los datos para el gráfico
    const dailyStats: Record<string, { totalHours: number; count: number, dateObj: Date }> = {};

    events.forEach((event: Event) => {
      // Asegurarse de que los campos necesarios existen
      if (event.created_at && event.resolved_at) {
        const createdAt = new Date(event.created_at);
        const resolvedAt = new Date(event.resolved_at);

        // Calcular la diferencia en horas
        const recoveryHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        // Agrupar por día (e.g., "Oct 30")
        const dateString = resolvedAt.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

        if (!dailyStats[dateString]) {
          dailyStats[dateString] = {
            totalHours: 0,
            count: 0,
            dateObj: resolvedAt // Guardar el objeto Date para ordenar
          };
        }
        
        dailyStats[dateString].totalHours += recoveryHours;
        dailyStats[dateString].count += 1;
      }
    });

    // 4. Formatear como array para el gráfico
    const processedData: ChartDataPoint[] = Object.keys(dailyStats).map(dateString => {
      const stats = dailyStats[dateString];
      const avgHours = stats.totalHours / stats.count;
      return {
        date: dateString,
        value: parseFloat(avgHours.toFixed(1)), // Valor promedio con 1 decimal
        dateObj: stats.dateObj
      };
    });

    // 5. Ordenar los datos cronológicamente
    processedData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    // 6. Quitar el dateObj antes de enviar al cliente
    const chartData = processedData.map(({ date, value }) => ({ date, value }));

    return NextResponse.json(chartData);

  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ message: 'Error processing recovery time series', error: e.message }),
      { status: 500 }
    );
  }
}
