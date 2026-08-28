import { createClient } from "@supabase/supabase-js"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Danemo Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase()
        const password = String(credentials?.password || "")
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!email || !password || !supabaseUrl || !supabaseAnonKey) {
          return null
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error || !data.user) {
          return null
        }

        return {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata.name || data.user.email || "Utilisateur",
        }
      },
    }),
  ],
}
