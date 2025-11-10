import { supabase, supabaseAdmin } from './supabase'
import type { Database } from './supabase'

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type TrackingEvent = Database['public']['Tables']['tracking_events']['Row']
type TrackingEventInsert = Database['public']['Tables']['tracking_events']['Insert']
type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']
type Container = Database['public']['Tables']['containers']['Row']
type ContainerInsert = Database['public']['Tables']['containers']['Insert']
type ContainerUpdate = Database['public']['Tables']['containers']['Update']
type Package = Database['public']['Tables']['packages']['Row']
type PackageInsert = Database['public']['Tables']['packages']['Insert']
type PackageUpdate = Database['public']['Tables']['packages']['Update']

// Fonctions pour les commandes
export const ordersApi = {
  // Récupérer toutes les commandes
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Récupérer une commande par ID
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Récupérer une commande par numéro
  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()
    
    if (error) throw error
    return data
  },

  // Créer une nouvelle commande
  async create(order: OrderInsert): Promise<Order> {
    const { data, error } = await (supabaseAdmin as any)
      .from('orders')
      .insert(order)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour une commande
  async update(id: string, updates: OrderUpdate): Promise<Order> {
    const { data, error } = await (supabaseAdmin as any)
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Supprimer une commande
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Rechercher des commandes
  async search(query: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_number.ilike.%${query}%,client_name.ilike.%${query}%,client_email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Filtrer par statut
  async getByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// Fonctions pour les clients
export const clientsApi = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  async create(payload: ClientInsert): Promise<Client> {
    const { data, error } = await (supabaseAdmin as any)
      .from('clients')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async update(id: string, payload: ClientUpdate): Promise<Client> {
    const { data, error } = await (supabaseAdmin as any)
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// Fonctions pour les conteneurs
export const containersApi = {
  async getAll(): Promise<Container[]> {
    const { data, error } = await supabase
      .from('containers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async getById(id: string): Promise<Container | null> {
    const { data, error } = await supabase
      .from('containers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  async create(payload: ContainerInsert): Promise<Container> {
    const { data, error } = await (supabaseAdmin as any)
      .from('containers')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async update(id: string, payload: ContainerUpdate): Promise<Container> {
    const { data, error } = await (supabaseAdmin as any)
      .from('containers')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('containers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// Fonctions pour les colis (packages) avec QR
export const packagesApi = {
  async getByQr(qr: string): Promise<Package | null> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('qr_code', qr)
      .single()
    if (error) throw error
    return data
  },
  async updateStatus(id: string, status: Package['status'], extras?: Partial<PackageUpdate>): Promise<Package> {
    const { data, error } = await (supabaseAdmin as any)
      .from('packages')
      .update({ status, last_scan_at: new Date().toISOString(), ...extras })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async create(payload: PackageInsert): Promise<Package> {
    const { data, error } = await (supabaseAdmin as any)
      .from('packages')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// Fonctions pour les événements de suivi
export const trackingApi = {
  // Récupérer tous les événements d'une commande
  async getByOrderId(orderId: string): Promise<TrackingEvent[]> {
    const { data, error } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_date', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Ajouter un événement de suivi
  async addEvent(event: TrackingEventInsert): Promise<TrackingEvent> {
    const { data, error } = await supabase
      .from('tracking_events')
      .insert(event)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour le statut d'une commande et ajouter un événement
  async updateOrderStatus(orderId: string, status: string, eventData: Partial<TrackingEventInsert>): Promise<void> {
    // Mettre à jour le statut de la commande
    await supabase
      .from('orders')
      .update({ status: status as any })
      .eq('id', orderId)

    // Ajouter l'événement de suivi
    await supabase
      .from('tracking_events')
      .insert({
        order_id: orderId,
        status,
        ...eventData
      })
  }
}

// Fonctions utilitaires
export const utils = {
  // Générer un numéro de commande unique
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
    
    const nextNumber = (count || 0) + 1
    return `DN${year}${nextNumber.toString().padStart(6, '0')}`
  },

  // Obtenir les statistiques
  async getStats(startDate?: string) {
    let query = supabase
      .from('orders')
      .select('status, created_at')
    
    // Appliquer le filtre de date si fourni
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    const { data: orders, error } = await query
    
    if (error) throw error

    const stats = {
      total: orders?.length || 0,
      pending: orders?.filter(o => o.status === 'pending').length || 0,
      confirmed: orders?.filter(o => o.status === 'confirmed').length || 0,
      in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
      completed: orders?.filter(o => o.status === 'completed').length || 0,
      cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
    }

    return stats
  }
}
