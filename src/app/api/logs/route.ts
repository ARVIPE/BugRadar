import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Resend } from "resend";
import { getNotifyEmailFor } from "@/app/settings/actions";
import { createHash } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

async function getProjectIdFromApiKey(
  apiKey: string
): Promise<string | null> {
  if (!apiKey.startsWith("proj_")) {
    return null;
  }
  const hashedKey = createHash("sha26").update(apiKey).digest("hex");
  const { data, error } = await supabase()
    .from("project_api_keys")
    .select("project_id")
    .eq("hashed_key", hashedKey)
    .single();

  if (error || !data) {
    console.warn("Invalid API key (logs):", apiKey.substring(0, 10) + "...");
    return null;
  }
  return data.project_id;
}

const LogSchema = z.object({
  log_message: z.string().min(1),
  container_name: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
});

export async function POST(req: Request) {
  try {
    // Autenticación por API Key (para el agente)
    const authHeader = req.headers.get("Authorization");
    const apiKey = authHeader?.split(" ")[1]; // Bearer <key>

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = await getProjectIdFromApiKey(apiKey);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = LogSchema.safeParse(body);
    if (!parsed.success) {
      // Si llegamos aquí, el agente ahora imprimirá este error
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 2. DATOS CORREGIDOS: 'user_id' ya no se incluye
    const logData = {
      ...parsed.data,
      project_id: projectId, // Añadimos el project_id
    };

    const { data, error } = await supabase()
      .from("events")
      .insert([logData])
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // 3. LÓGICA DE EMAIL CORREGIDA
    if (parsed.data.severity === "error") {
      try {
        // En lugar de `parsed.data.user_id`, buscamos el user_id desde el project_id
        const { data: projectData, error: projectError } = await supabase()
          .from("projects")
          .select("user_id")
          .eq("id", projectId)
          .single();

        if (projectError || !projectData) {
          console.error(
            "Error al buscar proyecto para enviar email:",
            projectError
          );
          // No paramos la ejecución, solo logueamos el error
        }

        if (projectData && projectData.user_id) {
          const userEmail = await getUserEmailById(projectData.user_id);
          if (userEmail) {
            const notifyEmail = await getNotifyEmailFor(userEmail);

            await resend.emails.send({
              from: "bugradar.noreply@resend.dev",
              to: notifyEmail,
              subject: `🚨 Error detectado en ${parsed.data.container_name}`,
              html: `<p>Se ha detectado un nuevo error:</p>
                     <pre>${parsed.data.log_message}</pre>
                     <p>Contenedor: ${parsed.data.container_name}</p>`,
            });
            console.log(
              `Correo de error enviado a ${notifyEmail} (usuario: ${userEmail})`
            );
          } else {
            console.warn(
              `Usuario con ID ${projectData.user_id} no encontrado. No se enviará notificación.`
            );
          }
        }
      } catch (emailError) {
        console.error("Error al enviar email de notificación:", emailError);
      }
    }
    // --- Fin de la lógica de Email ---

    return NextResponse.json({ ok: true, event: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// --- CAMBIOS EN LA FUNCIÓN GET ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const containerName = searchParams.get("container_name");
    const severity = searchParams.get("severity");
    const logMessage = searchParams.get("log_message"); // <-- El log de la página de detalle
    const limit = Number(searchParams.get("limit") ?? 100);

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    // NOTA: Esta query necesita un cliente de 'auth' o RLS en la tabla 'events'
    // para ser 100% segura, pero asumimos que ya lo hicimos
    // en los ficheros del dashboard (api/metrics, api/activity)
    let q = supabase()
      .from("events")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

   if (logMessage) {
      // Si 'logMessage' está presente, estamos en la "Página de Detalle"
      // e intentamos buscar por el 'msg' interno.
      try {
        const parsedLog = JSON.parse(logMessage);
        const errorMsg = parsedLog.msg;
        
        if (errorMsg) {
          // ¡Usa 'like' para buscar el mensaje de error dentro del JSON!
          // Esto encontrará "cache near capacity" en todos los logs.
          q = q.like("log_message", `%${errorMsg}%`);
        } else {
          // Fallback si 'msg' no existe
          q = q.eq("log_message", logMessage);
        }
      } catch (e) {
        // Fallback si no es un JSON
        q = q.eq("log_message", logMessage);
      }
    } else {
      // Si no hay 'logMessage', estamos en el "Dashboard"
      if (containerName) q = q.eq("container_name", containerName);
      if (severity) q = q.eq("severity", severity);
    }
    // --- FIN DE LÓGICA DE FILTRO ---

    const { data, error } = await q;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// --- FIN DE CAMBIOS EN GET ---

// Función helper (no cambia)
async function getUserEmailById(userId: string): Promise<string | null> {
  const adminSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await adminSupabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
  return data.user.email ?? null;
}