// src/types/next-auth.d.ts

import { type DefaultSession } from "next-auth";

// Extiende el módulo 'next-auth' para añadir propiedades a la sesión.
declare module "next-auth" {
  /**
   * Extiende la interfaz de la Sesión para incluir el ID del usuario.
   * Esto hace que `session.user.id` esté disponible y tipado en toda tu aplicación.
   */
  interface Session {
    user: {
      id: string; // El ID de tu usuario (de Supabase en este caso)
    } & DefaultSession["user"]; // Mantiene las propiedades por defecto (name, email, image)
  }
}