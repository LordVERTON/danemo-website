import { useSession } from 'next-auth/react'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator'
}

export function useCurrentUser() {
  const { data: session, status } = useSession()
  const sessionUser = session?.user

  const user: CurrentUser | null = sessionUser
    ? {
        id: sessionUser.id || '',
        name: sessionUser.name || sessionUser.email?.split('@')[0] || 'Utilisateur',
        email: sessionUser.email || '',
        role: sessionUser.role === 'admin' ? 'admin' : 'operator',
      }
    : null

  return { user, isLoading: status === 'loading' }
}
