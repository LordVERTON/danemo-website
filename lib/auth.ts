import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

type AdminRole = "admin" | "operator"

function getSupabaseAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const authOptions: NextAuthOptions = {
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
        if (!email || !password) return null

        const supabase = getSupabaseAuthClient()
        if (!supabase) return null

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error || !data.user) return null

        const appMetadata = data.user.app_metadata as { role?: AdminRole } | null
        const userMetadata = data.user.user_metadata as { name?: string } | null
        const role: AdminRole = appMetadata?.role === "admin" ? "admin" : "operator"

        return {
          id: data.user.id,
          email: data.user.email || email,
          name: userMetadata?.name || data.user.email?.split("@")[0] || "Utilisateur",
          role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: AdminRole }).role || "operator"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ""
        session.user.role = token.role === "admin" ? "admin" : "operator"
      }
      return session
    },
  },
}
