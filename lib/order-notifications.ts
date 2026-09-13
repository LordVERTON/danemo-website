import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/notify'
import {
  buildOrderStatusEmail,
  buildTrackingUrl,
  normalizeOrderStatus,
  type NotificationOrderStatus,
} from '@/lib/notification-templates'

export async function notifyOrderStatusChange(
  orderId: string,
  status: NotificationOrderStatus,
  options: { location?: string | null } = {},
) {
  try {
    const { data: order, error } = await (supabaseAdmin as any)
      .from('orders')
      .select(
        'id, order_number, client_name, client_email, recipient_name, recipient_email, recipient_address, recipient_city, recipient_postal_code, recipient_country, destination, qr_code, container_code'
      )
      .eq('id', orderId)
      .maybeSingle()

    if (error) throw error
    if (!order) {
      console.warn('[notifications] Order not found', orderId)
      return null
    }

    // Les mises à jour de commande sont destinées au client, jamais au
    // destinataire du colis.
    const targetEmail = order.client_email

    if (!targetEmail) {
      console.warn('[notifications] Missing client email', orderId)
      return null
    }

    const normalized = normalizeOrderStatus(status) || 'in_progress'
    const { subject, html } = buildOrderStatusEmail(normalized, {
      // La notification peut être livrée au destinataire, mais elle s'adresse
      // toujours au client qui a passé la commande.
      recipientName: order.client_name,
      orderNumber: order.order_number,
      trackingUrl: buildTrackingUrl({
        orderNumber: order.order_number,
        containerCode: order.container_code || undefined,
        qrCode: order.qr_code || undefined,
      }),
      location: options.location,
      destination: order.destination,
    })

    await sendEmail(targetEmail, subject, html)
    return { success: true }
  } catch (err) {
    console.error('[notifications] Failed to notify order status change', orderId, err)
    return { success: false, error: err }
  }
}
