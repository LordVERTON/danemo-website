import { useState, useEffect } from 'react'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator'
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Récupérer le rôle depuis localStorage
        const role = localStorage.getItem('danemo_admin_role')
        
        if (role === 'admin') {
          setUser({
            id: 'admin',
            name: 'Administrateur',
            email: 'admin@danemo.be',
            role: 'admin'
          })
        } else if (role === 'operator') {
          setUser({
            id: 'operator',
            name: 'Opérateur',
            email: 'operator@danemo.be',
            role: 'operator'
          })
        } else {
          // Essayer de récupérer depuis Supabase Auth
          const { supabase } = await import('@/lib/supabase')
          const { data: { user: authUser } } = await supabase.auth.getUser()
          
          if (authUser) {
            setUser({
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email || 'Utilisateur',
              email: authUser.email || '',
              role: authUser.user_metadata?.role || 'operator'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  return { user, isLoading }
}
