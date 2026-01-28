// src/auth.ts

import type { Adapter } from "next-auth/adapters"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { createClient } from "@supabase/supabase-js"
import type { AuthOptions } from "next-auth"

// Define the configuration here, in the original file.
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
          supabaseAccessToken: authData.session?.access_token,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On login, 'user' exists. We save the initial data.
      if (user) {
        token.sub = user.id;
        token.picture = user.image;
        token.supabaseAccessToken = user.supabaseAccessToken;
        return token;
      }

      // In subsequent requests, 'user' does not exist.
      // We use the 'sub' (user ID) from the token to refresh the data.
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
          // Update the token with the most recent image URL from the DB
          token.picture = `${avatarUrl}?v=${new Date().getTime()}`;
          }else{
            token.picture = null;
          }
        }
      } catch (error) {
        console.error("Error refreshing user data in token:", error);
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
      session.supabaseAccessToken = token.supabaseAccessToken;
      return session;
    },
  },
} satisfies AuthOptions;
