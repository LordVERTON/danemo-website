import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/notify'
import { buildClientStatusEmail, buildTrackingUrl } from '@/lib/notification-templates'

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

const orderStageLabels: Record<OrderStatus, string> = {
  pending: 'en préparation',
  confirmed: 'en préparation',
  in_progress: 'en cours de livraison',
  completed: 'livrée',
  cancelled: 'annulée',
}

export async function notifyOrderStatusChange(orderId: string, status: OrderStatus) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        'id, order_number, client_name, client_email, recipient_name, recipient_email, recipient_address, recipient_city, recipient_postal_code, recipient_country, qr_code, container_code'
      )
      .eq('id', orderId)
      .single()

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

    const stage = orderStageLabels[status] || 'en cours de livraison'

    const { subject, html } = buildClientStatusEmail({
      recipientName: targetName,
      shipmentReference: order.order_number,
      stageLabel: stage,
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


