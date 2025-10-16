import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client Supabase pour le côté client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client Supabase pour le côté serveur (avec service role key)
const isServer = typeof window === 'undefined'
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

if (isServer) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing SupABase env: SUPABASE_SERVICE_ROLE_KEY')
  }
  supabaseAdminInstance = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export const supabaseAdmin = supabaseAdminInstance as unknown as ReturnType<typeof createClient>

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_number: string
          client_name: string
          client_email: string
          client_phone: string | null
          service_type: string
          origin: string
          destination: string
          weight: number | null
          value: number | null
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          estimated_delivery: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          client_name: string
          client_email: string
          client_phone?: string | null
          service_type: string
          origin: string
          destination: string
          weight?: number | null
          value?: number | null
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          estimated_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          client_name?: string
          client_email?: string
          client_phone?: string | null
          service_type?: string
          origin?: string
          destination?: string
          weight?: number | null
          value?: number | null
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          estimated_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tracking_events: {
        Row: {
          id: string
          order_id: string
          status: string
          location: string | null
          description: string | null
          operator: string | null
          event_date: string
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          location?: string | null
          description?: string | null
          operator?: string | null
          event_date?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          location?: string | null
          description?: string | null
          operator?: string | null
          event_date?: string
        }
      }
      inventory: {
        Row: {
          id: string
          type: 'colis' | 'vehicule' | 'marchandise'
          reference: string
          description: string
          client: string
          status: 'en_stock' | 'en_transit' | 'livre' | 'en_attente'
          location: string
          poids: string | null
          dimensions: string | null
          valeur: string
          date_ajout: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'colis' | 'vehicule' | 'marchandise'
          reference: string
          description: string
          client: string
          status: 'en_stock' | 'en_transit' | 'livre' | 'en_attente'
          location: string
          poids?: string | null
          dimensions?: string | null
          valeur: string
          date_ajout?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'colis' | 'vehicule' | 'marchandise'
          reference?: string
          description?: string
          client?: string
          status?: 'en_stock' | 'en_transit' | 'livre' | 'en_attente'
          location?: string
          poids?: string | null
          dimensions?: string | null
          valeur?: string
          date_ajout?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
  employees: {
    Row: {
      id: string
      user_id: string
      name: string
      email: string
      role: 'admin' | 'operator'
      salary: number
      position: string
      hire_date: string
      is_active: boolean
      last_login: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      email: string
      role: 'admin' | 'operator'
      salary: number
      position: string
      hire_date: string
      is_active?: boolean
      last_login?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      name?: string
      email?: string
      role?: 'admin' | 'operator'
      salary?: number
      position?: string
      hire_date?: string
      is_active?: boolean
      last_login?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  employee_activities: {
    Row: {
      id: string
      employee_id: string
      activity_type: 'login' | 'logout' | 'order_created' | 'order_updated' | 'inventory_updated' | 'tracking_updated'
      description: string
      metadata: any
      created_at: string
    }
    Insert: {
      id?: string
      employee_id: string
      activity_type: 'login' | 'logout' | 'order_created' | 'order_updated' | 'inventory_updated' | 'tracking_updated'
      description: string
      metadata?: any
      created_at?: string
    }
    Update: {
      id?: string
      employee_id?: string
      activity_type?: 'login' | 'logout' | 'order_created' | 'order_updated' | 'inventory_updated' | 'tracking_updated'
      description?: string
      metadata?: any
      created_at?: string
    }
  }
}
