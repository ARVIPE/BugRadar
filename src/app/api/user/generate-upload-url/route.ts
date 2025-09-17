// src/app/api/user/generate-upload-url/route.ts
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { fileName } = await request.json()
  if (!fileName) {
    return NextResponse.json({ error: 'El nombre del archivo es requerido' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const userId = session.user.id;
  const newFilePath = `${userId}.${fileName.split('.').pop()}`;

  try {
    // 1. Buscamos si ya existe un avatar para este usuario (con cualquier extensión)
    const { data: existingFiles, error: listError } = await supabaseAdmin.storage
      .from('avatars')
      .list('', { // Buscamos en la raíz del bucket
        search: `${userId}.`, // Con el patrón "id_usuario."
      });

    if (listError) {
      console.error("Error al listar avatares existentes:", listError.message);
      // No detenemos el proceso, por si es un error temporal
    }

    // 2. Si encontramos archivos antiguos, los borramos
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((file) => file.name);
      console.log(`Borrando avatares antiguos: ${filesToDelete.join(', ')}`);
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from('avatars')
        .remove(filesToDelete);
      
      if (deleteError) {
        // Este error puede ocurrir si el archivo ya no existe, lo que no es crítico.
        // Lo mostramos en el log del servidor pero no paramos la ejecución.
        console.warn("Aviso al borrar avatar antiguo:", deleteError.message);
      }
    }

    // 3. Ahora sí, generamos la URL para subir el nuevo archivo
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .createSignedUploadUrl(newFilePath)

    if (error) throw error

    return NextResponse.json({ signedUrl: data.signedUrl, path: data.path })

  } catch (error: any) {
    console.error("Error crítico al generar la URL de subida:", error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}