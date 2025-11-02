import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Usamos la misma inicialización de Supabase que en tu api/logs/route.ts
const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// Esquema para validar los parámetros de consulta (MODIFICADO)
const QuerySchema = z.object({
  // CAMBIADO de container_name a log_message
  log_message: z.string().min(1, "log_message is required"),
});

// Asegura que esta ruta se ejecute dinámicamente y no sea cacheada
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    // 1. Validar los parámetros de la URL
    const parsed = QuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // 2. Obtener el log_message (MODIFICADO)
    const { log_message } = parsed.data;

    // 3. Llamar a la NUEVA función de la base de datos (RPC) (MODIFICADO)
    const { data, error } = await supabase().rpc('get_recurrence_history_by_message', {
      p_log_message: log_message, // Pasar el mensaje
    });

    if (error) {
      console.error("Supabase RPC Error (get_recurrence_history_by_message):", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Devolver los datos listos para el gráfico
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("Error in GET /api/logs/recurrence:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}