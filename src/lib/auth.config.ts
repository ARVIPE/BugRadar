import type { AuthOptions} from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";


declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string;
    user: {
      id: string;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    supabaseAccessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    supabaseAccessToken?: string;
    picture?: string | null;
  }
}


export const authConfig: AuthOptions = {
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
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createClient(
          process.env.SUPABASE_URL as string,
          process.env.SUPABASE_SERVICE_ROLE_KEY as string
        );

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData.user) {
          console.error("Supabase sign-in error:", authError?.message);
          return null;
        }

        const { data: userData, error: userError } =
          await supabase.auth.admin.getUserById(authData.user.id);

        if (userError || !userData.user) {
          console.error("Supabase get-user error:", userError?.message);
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

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // First time (login)
      if (user) {
        token.sub = user.id;
        token.picture = user.image;
        token.supabaseAccessToken = user.supabaseAccessToken;
        return token;
      }

      // Refresh on subsequent requests
      if (!token.sub) return token;

      const supabase = createClient(
        process.env.SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
      );

      try {
        const { data: userData } = await supabase.auth.admin.getUserById(
          token.sub
        );
        if (userData?.user) {
          const avatarUrl = userData.user.user_metadata?.avatar_url;
          token.picture = avatarUrl
            ? `${avatarUrl}?v=${new Date().getTime()}`
            : null;
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.image = token.picture ?? null;
      }
      session.supabaseAccessToken = token.supabaseAccessToken;
      return session;
    },
  },
};
