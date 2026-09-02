"use client"

import { useSession } from "next-auth/react"

export function useCurrentUser() {
  const { data: session, status } = useSession()

  if (status !== "authenticated" || !session?.user) {
    return { user: null, isLoading: status === "loading" }
  }

  return {
    user: {
      id: session.user.id || "",
      name: session.user.name || "Utilisateur",
      email: session.user.email || "",
      role: session.user.role || "operator",
    },
    isLoading: false,
  }
}
