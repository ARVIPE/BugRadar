import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";


const supabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("projects")
    .select("id, name, created_at")
    .eq("user_id", session.user.id) 
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST handler: Crear un nuevo proyecto
export async function POST(req: Request) {
  // 3. Obtenemos la sesión usando next-auth, NO cookies
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // 4. Crear el proyecto
  const { data: project, error: projectError } = await db
    .from("projects")
    .insert({
      name: name,
      user_id: session.user.id, // Usamos el ID de la sesión de next-auth
    })
    .select()
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  // 5. Generar y hashear la API key
  const apiKey = `proj_${uuidv4().replace(/-/g, "")}`;
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");

  // 6. Guardar la key hasheada
  const { error: keyError } = await db.from("project_api_keys").insert({
    project_id: project.id,
    hashed_key: hashedKey,
  });

  if (keyError) {
    return NextResponse.json({ error: keyError.message }, { status: 500 });
  }

  // 7. Devolver el proyecto y la API key
  return NextResponse.json(
    {
      ...project,
      apiKey: apiKey,
    },
    { status: 201 }
  );
}