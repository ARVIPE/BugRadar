// src/types/next-auth.d.ts

import { type DefaultSession } from "next-auth";

// Extends the 'next-auth' module to add properties to the session.
declare module "next-auth" {
  /**
   * Extends the Session interface to include the user ID.
   * This makes `session.user.id` available and typed throughout your application.
   */
  interface Session {
    supabaseAccessToken?: string;
    user: {
      id: string; // The ID of your user (from Supabase in this case)
    } & DefaultSession["user"]; // Maintains default properties (name, email, image)
  }

  interface User {
    supabaseAccessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    supabaseAccessToken?: string;
  }
}
