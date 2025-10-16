import { NextRequest } from 'next/server'
import { supabase } from './supabase'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'operator'
  name: string
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Vérifier l'authentification via les headers ou cookies
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('danemo_admin_session')?.value
    
    if (!authHeader && !sessionCookie) {
      return null
    }

    // Pour les requêtes API, vérifier le token JWT
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return null
      }

      return {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata as any)?.role || 'operator',
        name: (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'User'
      }
    }

    // Pour les sessions locales (fallback)
    if (sessionCookie === 'authenticated') {
      // Vérifier le rôle dans les cookies
      const role = request.cookies.get('danemo_admin_role')?.value
      if (!role) return null

      return {
        id: 'local-user',
        email: 'local@danemo.be',
        role: role as 'admin' | 'operator',
        name: role === 'admin' ? 'Admin Local' : 'Operator Local'
      }
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, user)
  }
}

export function requireRole(allowedRoles: ('admin' | 'operator')[]) {
  return (handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) => {
    return async (request: NextRequest) => {
      const user = await authenticateRequest(request)
      
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (!allowedRoles.includes(user.role)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      return handler(request, user)
    }
  }
}
