import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string
      role?: "admin" | "operator"
    }
  }

  interface User {
    role?: "admin" | "operator"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "operator"
  }
}
