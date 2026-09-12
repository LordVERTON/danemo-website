import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'operator' | 'client'
  name: string
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    })

    if (!token?.sub || (token.role !== 'admin' && token.role !== 'operator')) return null

    return {
      id: token.sub,
      email: token.email || '',
      role: token.role,
      name: token.name || token.email?.split('@')[0] || 'Utilisateur',
    }
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
