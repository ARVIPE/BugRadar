import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config"; // Usa tu authConfig
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

// --- Esquema para la ACTUALIZACIÓN ---
const UpdateProjectSchema = z.object({
  // Permitimos actualizar el nombre o los endpoints
  name: z.string().min(1).optional(),
  monitored_endpoints: z.array(z.string()).optional(),
});

// --- Función para verificar que un usuario es dueño de un proyecto ---
const verifyUserProject = async (userId: string, projectId: string): Promise<boolean> => {
  const { data, error } = await supabaseAdmin()
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();
  return !error && !!data;
};


// --- NUEVA FUNCIÓN GET (para cargar los ajustes) ---
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;
    const projectId = params.id;

    if (!await verifyUserProject(userId, projectId)) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Si es el dueño, obtén los datos
    const { data, error } = await supabaseAdmin()
      .from("projects")
      .select("id, name, monitored_endpoints")
      .eq("id", projectId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error en GET /api/projects/[id]:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = UpdateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
    }

    const projectId = params.id;

    if (!(await verifyUserProject(userId, projectId))) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Actualizar el proyecto
    const { error: updateError } = await supabaseAdmin()
      .from("projects")
      .update(parsed.data) // Sube los campos validados (ej: { monitored_endpoints: [...] })
      .eq("id", projectId);

    if (updateError) {
      console.error("Error actualizando proyecto:", updateError);
      throw new Error(updateError.message);
    }

    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error: any) {
    console.error("Error en PATCH /api/projects/[id]:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { error } = await db
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Error al borrar el proyecto:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Project and all associated data deleted.",
  });
}
