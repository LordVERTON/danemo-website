import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/notify'
import { buildClientStatusEmail, buildTrackingUrl } from '@/lib/notification-templates'

type ContainerStatus = 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'

interface NotificationOptions {
  customMessage?: string
  previousStatus?: string | null
}

interface NotificationResult {
  emailsSent: number
  recipients: number
}

const containerStageLabels: Record<ContainerStatus, string> = {
  planned: 'en préparation',
  departed: 'en cours de livraison',
  in_transit: 'en cours de livraison',
  arrived: 'arrivée dans votre région',
  delivered: 'entre les mains du transporteur',
  delayed: 'en cours de livraison (avec un léger retard)',
}

export async function notifyContainerStatusChange(
  containerId: string,
  status: ContainerStatus,
  options: NotificationOptions = {},
): Promise<NotificationResult | null> {
  try {
    const { data: container, error: containerError } = await supabase
      .from('containers')
      .select('*')
      .eq('id', containerId)
      .single()

    if (containerError) throw containerError
    if (!container) {
      console.warn('[notifications] Container not found for id', containerId)
      return null
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, client_name, client_email, recipient_name, recipient_email, qr_code')
      .eq('container_id', containerId)

    if (ordersError) throw ordersError

    const filteredOrders = (orders || []).filter(
      (order) => !!(order.recipient_email || order.client_email)
    )

    if (filteredOrders.length === 0) {
      console.info('[notifications] No client emails linked to container', container.code)
      return { emailsSent: 0, recipients: 0 }
    }

    let emailsSent = 0

    await Promise.all(
      filteredOrders.map(async (order) => {
        try {
          const recipientName = order.recipient_name || order.client_name
          const recipientEmail = order.recipient_email || order.client_email
          if (!recipientEmail) return

          const { subject, html } = buildClientStatusEmail({
            recipientName,
            shipmentReference: order.order_number,
            stageLabel: options.customMessage || containerStageLabels[status],
            trackingUrl: buildTrackingUrl({
              orderNumber: order.order_number,
              containerCode: container.code,
              qrCode: order.qr_code,
            }),
          })
          await sendEmail(recipientEmail as string, subject, html)
          emailsSent += 1
        } catch (error) {
          console.error('[notifications] Failed to send email for order', order.id, error)
        }
      }),
    )

    return { emailsSent, recipients: filteredOrders.length }
  } catch (error) {
    console.error('[notifications] Error while notifying container status change:', error)
    return null
  }
}

