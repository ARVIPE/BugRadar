// src/app/api/user/generate-upload-url/route.ts
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from "next-auth/next"
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileName } = await request.json()
  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const userId = session.user.id;
  const newFilePath = `${userId}.${fileName.split('.').pop()}`;

  try {
    // Check if an avatar already exists for this user (with any extension)
    const { data: existingFiles, error: listError } = await supabaseAdmin.storage
      .from('avatars')
      .list('', { // Search in the bucket root
        search: `${userId}.`, // With the pattern "user_id."
      });

    if (listError) {
      console.error("Error listing existing avatars:", listError.message);
    }

    // If we find old files, delete them
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((file) => file.name);
      console.log(`Deleting old avatars: ${filesToDelete.join(', ')}`);
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from('avatars')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.warn("Warning when deleting old avatar:", deleteError.message);
      }
    }

    // Now generate the URL to upload the new file
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .createSignedUploadUrl(newFilePath)

    if (error) throw error

    return NextResponse.json({ signedUrl: data.signedUrl, path: data.path })

  } catch (error: unknown) {
    console.error("Critical error generating upload URL:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}