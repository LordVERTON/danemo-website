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
          qr_code: string | null
          created_at: string
          updated_at: string
          container_id: string | null
          container_code: string | null
          container_status: string | null
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
          qr_code?: string | null
          created_at?: string
          updated_at?: string
          container_id?: string | null
          container_code?: string | null
          container_status?: string | null
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
          qr_code?: string | null
          created_at?: string
          updated_at?: string
          container_id?: string | null
          container_code?: string | null
          container_status?: string | null
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
      // NEW: clients table
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          company: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // NEW: containers table
      containers: {
        Row: {
          id: string
          code: string // e.g., MSKU1234567
          vessel: string | null
          departure_port: string | null
          arrival_port: string | null
          etd: string | null // estimated time of departure
          eta: string | null // estimated time of arrival
          status: 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          vessel?: string | null
          departure_port?: string | null
          arrival_port?: string | null
          etd?: string | null
          eta?: string | null
          status?: 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          vessel?: string | null
          departure_port?: string | null
          arrival_port?: string | null
          etd?: string | null
          eta?: string | null
          status?: 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // NEW: customers table
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string | null
          company: string | null
          tax_id: string | null
          notes: string | null
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          company?: string | null
          tax_id?: string | null
          notes?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          company?: string | null
          tax_id?: string | null
          notes?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      // NEW: invoices table
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          order_id: string | null
          issue_date: string
          due_date: string | null
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          currency: string
          payment_method: string | null
          payment_date: string | null
          notes: string | null
          pdf_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number?: string
          customer_id: string
          order_id?: string | null
          issue_date?: string
          due_date?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          currency?: string
          payment_method?: string | null
          payment_date?: string | null
          notes?: string | null
          pdf_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          order_id?: string | null
          issue_date?: string
          due_date?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          currency?: string
          payment_method?: string | null
          payment_date?: string | null
          notes?: string | null
          pdf_path?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // NEW: packages table (colis) with QR tracking
      packages: {
        Row: {
          id: string
          qr_code: string // unique QR content (e.g., URL token)
          reference: string
          description: string | null
          client_id: string | null
          container_id: string | null
          weight: number | null
          value: number | null
          status: 'preparation' | 'expedie' | 'en_transit' | 'arrive_port' | 'dedouane' | 'livre'
          last_scan_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          qr_code: string
          reference: string
          description?: string | null
          client_id?: string | null
          container_id?: string | null
          weight?: number | null
          value?: number | null
          status?: 'preparation' | 'expedie' | 'en_transit' | 'arrive_port' | 'dedouane' | 'livre'
          last_scan_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          qr_code?: string
          reference?: string
          description?: string | null
          client_id?: string | null
          container_id?: string | null
          weight?: number | null
          value?: number | null
          status?: 'preparation' | 'expedie' | 'en_transit' | 'arrive_port' | 'dedouane' | 'livre'
          last_scan_at?: string | null
          created_at?: string
          updated_at?: string
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
          container_id: string | null
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
          container_id?: string | null
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
          container_id?: string | null
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
