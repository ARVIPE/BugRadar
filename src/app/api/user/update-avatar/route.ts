// src/app/api/user/update-avatar/route.ts
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { avatarUrl } = await request.json()
  if (!avatarUrl) {
    return NextResponse.json({ error: 'La URL del avatar es requerida' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    session.user.id,
    { user_metadata: { avatar_url: avatarUrl } }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Avatar actualizado con éxito', user: data.user })
}