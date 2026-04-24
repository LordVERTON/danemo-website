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
  status: NotificationOrderStatus
) {
  try {
    const { data: order, error } = await (supabaseAdmin as any)
      .from('orders')
      .select(
        'id, order_number, client_name, client_email, recipient_name, recipient_email, recipient_address, recipient_city, recipient_postal_code, recipient_country, qr_code, container_code'
      )
      .eq('id', orderId)
      .maybeSingle()

    if (error) throw error
    if (!order) {
      console.warn('[notifications] Order not found', orderId)
      return null
    }

    const targetEmail = order.recipient_email || order.client_email
    const targetName = order.recipient_name || order.client_name

    if (!targetEmail) {
      console.warn('[notifications] Missing recipient email', orderId)
      return null
    }

    const normalized = normalizeOrderStatus(status) || 'in_progress'
    const { subject, html } = buildOrderStatusEmail(normalized, {
      recipientName: targetName,
      orderNumber: order.order_number,
      trackingUrl: buildTrackingUrl({
        orderNumber: order.order_number,
        containerCode: order.container_code || undefined,
        qrCode: order.qr_code || undefined,
      }),
    })

    await sendEmail(targetEmail, subject, html)
    return { success: true }
  } catch (err) {
    console.error('[notifications] Failed to notify order status change', orderId, err)
    return { success: false, error: err }
  }
}
