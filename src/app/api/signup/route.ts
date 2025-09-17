// src/app/api/signup/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Usamos las variables de entorno del servidor, ¡nunca las públicas!
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Variables de entorno de Supabase no configuradas.' },
      { status: 500 }
    )
  }

  // Creamos un cliente de Supabase con permisos de administrador
  // ¡Esto solo se puede hacer de forma segura en el backend!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Error en Supabase signUp:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // ¡Éxito!
  return NextResponse.json({ user: data.user }, { status: 200 })
}