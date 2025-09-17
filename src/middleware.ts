// src/middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/', // Redirige a los usuarios a la página de login (tu ruta raíz)
  },
})

export const config = {
  // El matcher define qué rutas quieres proteger
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las siguientes:
     * - / (la página de inicio de sesión)
     * - /signup (la página de registro)
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (el ícono de la pestaña)
     *
     * El '?!' es un "negative lookahead" en la expresión regular.
     * Básicamente, le dice: "protege todo lo que NO empiece por...".
     */
    '/((?!api|_next/static|_next/image|favicon.ico|signup).*)',
  ],
}