"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export default function AvatarUpload() {
  // Obtenemos el 'status' para saber si la sesión está cargando
  const { data: session, status, update: updateSession } = useSession()
  const [uploading, setUploading] = useState(false)

  // La URL del avatar la obtenemos directamente de la sesión. Es la única fuente de verdad.
  const currentAvatarUrl = session?.user?.image;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    setUploading(true)
    const file = event.target.files[0]
    
    try {
      // 1. Pedir al backend una URL segura para subir el archivo
      const responseUrl = await fetch('/api/user/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })
      
      if (!responseUrl.ok) {
        const errorData = await responseUrl.json();
        throw new Error(`Error del servidor (${responseUrl.status}): ${errorData.error || 'No se pudo generar la URL'}`);
      }
      
      const { signedUrl, path } = await responseUrl.json()
      if (!signedUrl) throw new Error('La respuesta de la API no incluyó una URL de subida.')

      // 2. Subir el archivo directamente a Supabase Storage usando la URL pre-firmada
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Error al subir el archivo a Supabase: ${errorText}`);
      }

      // 3. Obtener la URL pública final (limpia, sin parámetros de caché)
      const cleanAvatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`

      // 4. Notificar a nuestro backend que actualice el perfil con la URL LIMPIA
      const updateResponse = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: cleanAvatarUrl }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Error del servidor al actualizar el perfil (${updateResponse.status}): ${errorData.error}`);
      }

      // 5. El paso final y más importante:
      // Pedimos a NextAuth que recargue la sesión. El backend se encargará
      // de obtener la nueva URL y añadirle el parámetro de caché.
      // Esto provocará un re-renderizado del componente con la imagen actualizada.
      await updateSession()

    } catch (error: unknown) {
      alert((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  // Mientras la sesión está cargando (`status === 'loading'`), mostramos un esqueleto.
  // Esto evita el "parpadeo" de la imagen por defecto.
  if (status === 'loading') {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-skin-subtitle/20"></div>
        <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="h-10 w-40 bg-skin-subtitle/20 rounded"></div>
            <div className="h-4 w-28 bg-skin-subtitle/20 rounded"></div>
        </div>
      </div>
    )
  }

  // Una vez que la sesión ha cargado, mostramos la interfaz real.
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Image
        src={currentAvatarUrl || '/A1.jpg'}
        alt="User Avatar"
        width={80}
        height={80}
        className="rounded-full border-2 border-border bg-gray-500 object-cover"
      />
      <div className="flex flex-col items-center sm:items-start">
        <Button asChild className="relative cursor-pointer">
          <div>
            <Upload size={16} className="mr-2"/>
            {uploading ? 'Subiendo...' : 'Subir nueva foto'}
            <input
              type="file"
              id="avatar-upload"
              accept="image/png, image/jpeg"
              onChange={handleUpload}
              disabled={uploading || status !== 'authenticated'}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </Button>
        <p className="text-xs text-skin-subtitle mt-2">PNG o JPG (máx. 2MB)</p>
      </div>
    </div>
  )
}