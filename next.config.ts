// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // NUEVO: Añadimos esta sección para permitir imágenes de nuestro bucket de Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sglcmjzpymjmahpoomvp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
}

export default nextConfig