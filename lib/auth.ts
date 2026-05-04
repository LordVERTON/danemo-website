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

function hardcodedUser(email: string, password: string) {
  if (email === "admin@danemo.be" && password === "admin123") {
    return { id: "admin-local", email, name: "Admin Local", role: "admin" as AdminRole }
  }
  if (email === "operator@danemo.be" && password === "operator123") {
    return { id: "operator-local", email, name: "Operator Local", role: "operator" as AdminRole }
  }
  return null
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

        const localUser = hardcodedUser(email, password)
        if (localUser) return localUser

        const supabase = getSupabaseAuthClient()
        if (!supabase) return null

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error || !data.user) return null

        const metadata = data.user.user_metadata as { role?: AdminRole; name?: string } | null
        const role: AdminRole = metadata?.role === "admin" ? "admin" : "operator"

        return {
          id: data.user.id,
          email: data.user.email || email,
          name: metadata?.name || data.user.email?.split("@")[0] || "Utilisateur",
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
