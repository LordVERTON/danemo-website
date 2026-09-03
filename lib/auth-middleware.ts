import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { supabase } from './supabase'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'operator' | 'client'
  name: string
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Vérifier l'authentification via un jeton Supabase ou une session NextAuth.
    const authHeader = request.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return null
      }

      return {
        id: user.id,
        email: user.email || '',
        role: (user.app_metadata as any)?.role || 'operator',
        name: (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'User'
      }
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    })
    const role = token?.role === 'admin' ? 'admin' : token?.role === 'operator' ? 'operator' : null

    if (token && role) {
      return {
        id: token.sub || '',
        email: token.email || '',
        role,
        name: token.name || token.email || 'Utilisateur',
      }
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function requireAuth<TContext = unknown>(
  handler: (request: NextRequest, user: AuthenticatedUser, context?: TContext) => Promise<Response>
) {
  return async (request: NextRequest, context?: TContext) => {
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

    return handler(request, user, context)
  }
}

export function requireRole(allowedRoles: ('admin' | 'operator' | 'client')[]) {
  return <TContext = unknown>(
    handler: (request: NextRequest, user: AuthenticatedUser, context?: TContext) => Promise<Response>
  ) => {
    return async (request: NextRequest, context?: TContext) => {
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

      return handler(request, user, context)
    }
  }
}
