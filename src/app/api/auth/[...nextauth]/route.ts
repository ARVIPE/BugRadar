// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import type { Adapter } from "next-auth/adapters"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { createClient } from "@supabase/supabase-js"
import type { AuthOptions } from "next-auth"

// Definimos la configuración aquí mismo, en el archivo original.
export const authConfig = {
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  }) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const supabase = createClient(
          process.env.SUPABASE_URL as string,
          process.env.SUPABASE_SERVICE_ROLE_KEY as string
        );

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });
        
        if (authError || !authData.user) {
          console.error("Supabase sign in error:", authError?.message);
          return null;
        }

        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(authData.user.id);
        
        if (userError || !userData.user) {
            console.error("Supabase get user error:", userError?.message);
            return null;
        }

        return {
          id: userData.user.id,
          email: userData.user.email,
          image: userData.user.user_metadata?.avatar_url, 
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // --- ESTA ES LA MODIFICACIÓN CLAVE ---
    async jwt({ token, user }) {
      // Al iniciar sesión, 'user' existe. Guardamos los datos iniciales.
      if (user) {
        token.sub = user.id;
        token.picture = user.image;
        return token;
      }

      // En las siguientes peticiones, 'user' no existe.
      // Usamos el 'sub' (ID de usuario) del token para refrescar los datos.
      if (!token.sub) return token;

      const supabase = createClient(
        process.env.SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
      );
      
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(token.sub);
        if (userData?.user) {
           const avatarUrl = userData.user.user_metadata?.avatar_url;
          if (avatarUrl) {
          // Actualizamos el token con la URL de la imagen más reciente desde la BD
          token.picture = `${avatarUrl}?v=${new Date().getTime()}`;
          }else{
            token.picture = null;
          }
        }
      } catch (error) {
        console.error("Error al refrescar los datos del usuario en el token:", error);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.picture) {
          session.user.image = token.picture as string | null | undefined;
        }
      }
      return session;
    },
  },
} satisfies AuthOptions;

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };