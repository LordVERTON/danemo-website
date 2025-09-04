import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client Supabase pour le côté client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client Supabase pour le côté serveur (avec service role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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
}
