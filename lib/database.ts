import { supabase, supabaseAdmin } from './supabase'
import { notifyOrderStatusChange } from './order-notifications'
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
type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']
type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

// Fonctions pour les commandes
export const ordersApi = {
  // Récupérer toutes les commandes
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // container_code est maintenant directement dans la table orders, pas besoin de jointure
    return (data || [])
  },

  // Récupérer une commande par ID
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // container_code est maintenant directement dans la table orders, pas besoin de jointure
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

  // Récupérer une commande par QR code
  async getByQr(qr: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('qr_code', qr)
      .maybeSingle()
    
    // maybeSingle() retourne null si aucune ligne trouvée au lieu de lancer une erreur
    if (error) {
      throw error
    }
    return data
  },

  // Créer une nouvelle commande
  async create(order: OrderInsert): Promise<Order> {
    const { data, error } = await (supabaseAdmin as any)
      .from('orders')
      .insert(order)
      .select('*')
      .single()
    
    if (error) throw error
    
    // container_code est maintenant directement dans la table orders (mis à jour par le trigger)
    return data
  },

  // Mettre à jour une commande
  async update(id: string, updates: OrderUpdate): Promise<Order> {
    const { data, error } = await (supabaseAdmin as any)
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    
    // container_code est maintenant directement dans la table orders (mis à jour par le trigger)
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
      .or(
        [
          `order_number.ilike.%${query}%`,
          `client_name.ilike.%${query}%`,
          `client_email.ilike.%${query}%`,
          `recipient_name.ilike.%${query}%`,
          `recipient_email.ilike.%${query}%`,
        ].join(',')
      )
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // container_code est maintenant directement dans la table orders, pas besoin de jointure
    return (data || [])
  },

  // Filtrer par statut
  async getByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // container_code est maintenant directement dans la table orders, pas besoin de jointure
    return (data || [])
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
    // Utiliser supabaseAdmin pour contourner RLS et obtenir tous les conteneurs
    const { data, error } = await (supabaseAdmin as any)
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
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

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

    if (!existingOrder || existingOrder.status !== status) {
      notifyOrderStatusChange(orderId, status as Order['status']).catch((error) => {
        console.error('[notifications] Failed to dispatch order status change from tracking update:', error)
      })
    }
  }
}

// Fonctions utilitaires
export const utils = {
  // Générer un numéro de commande unique
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()

    // On récupère le plus grand numéro existant pour l'année courante,
    // plutôt que de se baser sur un simple COUNT (qui peut être faux si des lignes sont supprimées)
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `DN${year}%`)
      .order('order_number', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[utils.generateOrderNumber] Failed to fetch last order_number:', error)
      // Fallback très défensif pour ne pas bloquer la création
      const fallback = `DN${year}${'000001'}`
      return fallback
    }

    const last = data && data.length > 0 ? data[0].order_number : null

    if (!last) {
      // Première commande de l’année
      return `DN${year}000001`
    }

    // Extraire la partie séquentielle (6 derniers chiffres)
    const suffix = last.slice(-6)
    const lastNumber = Number.parseInt(suffix, 10)

    const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1
    const padded = nextNumber.toString().padStart(6, '0')

    return `DN${year}${padded}`
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

// Fonctions pour les clients (customers)
export const customersApi = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()
    if (error) throw error
    return data
  },

  async getWithOrders(id: string): Promise<Customer & { orders: Order[] } | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    
    if (!data) return null
    
    // container_code est maintenant directement dans la table orders, pas besoin de jointure
    return data as any
  },

  async getWithOrdersAndInvoices(id: string): Promise<Customer & { orders: Order[], invoices: Invoice[] } | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (*),
        invoices (*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    
    if (!data) return null
    
    // container_code est maintenant directement dans la table orders, pas besoin de jointure
    return data as any
  },

  async create(payload: CustomerInsert): Promise<Customer> {
    const { data, error } = await (supabaseAdmin as any)
      .from('customers')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: CustomerUpdate): Promise<Customer> {
    const { data, error } = await (supabaseAdmin as any)
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// Fonctions pour les factures (invoices)
export const invoicesApi = {
  async getAll(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getByCustomerId(customerId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getByOrderId(orderId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getWithCustomer(id: string): Promise<Invoice & { customers: Customer } | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (
          *
        )
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as any
  },

  async create(payload: InvoiceInsert): Promise<Invoice> {
    const { data, error } = await (supabaseAdmin as any)
      .from('invoices')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: InvoiceUpdate): Promise<Invoice> {
    const { data, error } = await (supabaseAdmin as any)
      .from('invoices')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
