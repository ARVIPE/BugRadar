"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export default function AvatarUpload() {
  // Get the 'status' to know if the session is loading
  const { data: session, status, update: updateSession } = useSession()
  const [uploading, setUploading] = useState(false)

  // The avatar URL is obtained directly from the session. It's the single source of truth.
  const currentAvatarUrl = session?.user?.image;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    setUploading(true)
    const file = event.target.files[0]
    
    try {
      // Request a secure URL from the backend to upload the file
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
      if (!signedUrl) throw new Error('The API response did not include an upload URL.')

      // Upload the file directly to Supabase Storage using the pre-signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Error al subir el archivo a Supabase: ${errorText}`);
      }

      // Get the final public URL (clean, without cache parameters)
      const cleanAvatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`

      // Notify our backend to update the profile with the CLEAN URL
      const updateResponse = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: cleanAvatarUrl }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Error del servidor al actualizar el perfil (${updateResponse.status}): ${errorData.error}`);
      }

      // The final and most important step:
      // Ask NextAuth to reload the session. The backend will handle
      // fetching the new URL and adding the cache parameter.
      await updateSession()

    } catch (error: unknown) {
      alert((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  // While the session is loading (`status === 'loading'`), show a skeleton.
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

  // Once the session has loaded, show the real interface.
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
        <Button asChild className="relative cursor-pointer bg-amber-400 text-slate-900 hover:bg-amber-500 focus:ring-2 focus:ring-amber-600">
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