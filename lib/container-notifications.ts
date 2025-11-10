import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/notify'
import { sendSms } from '@/lib/sms'

type ContainerStatus = 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'

interface NotificationOptions {
  customMessage?: string
  previousStatus?: string | null
}

interface NotificationResult {
  emailsSent: number
  smsSent: number
  recipients: number
}

const statusDescriptions: Record<ContainerStatus, { label: string; defaultMessage: string }> = {
  planned: {
    label: 'Planifié',
    defaultMessage: "Votre conteneur est planifié. Nous finalisons les préparatifs d'expédition.",
  },
  departed: {
    label: 'Départ confirmé',
    defaultMessage: 'Votre conteneur a quitté le port de départ et est en route vers sa destination.',
  },
  in_transit: {
    label: 'En transit',
    defaultMessage: 'Votre conteneur est actuellement en transit. Nous surveillons sa progression.',
  },
  arrived: {
    label: 'Arrivé au port',
    defaultMessage: 'Votre conteneur est arrivé au port de destination. Les formalités sont en cours.',
  },
  delivered: {
    label: 'Livré',
    defaultMessage: 'Votre conteneur a été livré. Merci de votre confiance.',
  },
  delayed: {
    label: 'Retard signalé',
    defaultMessage: "Votre conteneur subit un retard. Nous vous tiendrons informés dès que possible.",
  },
}

function buildEmailTemplate({
  container,
  status,
  message,
}: {
  container: any
  status: ContainerStatus
  message: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h2 style="color:#FF8C00; font-size: 20px;">DANEMO - Mise à jour conteneur ${container.code}</h2>
      <p style="font-size:14px; line-height:20px;">${message}</p>
      <div style="margin-top:16px; padding:16px; background:#F9FAFB; border-radius:8px;">
        <h3 style="margin:0 0 12px 0; font-size:16px;">Détails du conteneur</h3>
        <ul style="margin:0; padding-left:18px; font-size:13px; line-height:20px;">
          <li><strong>Statut:</strong> ${statusDescriptions[status].label}</li>
          <li><strong>Navire:</strong> ${container.vessel || 'Non communiqué'}</li>
          <li><strong>Port de départ:</strong> ${container.departure_port || 'Non communiqué'}</li>
          <li><strong>Port d'arrivée:</strong> ${container.arrival_port || 'Non communiqué'}</li>
          <li><strong>ETD:</strong> ${container.etd ? new Date(container.etd).toLocaleDateString('fr-FR') : 'Non communiqué'}</li>
          <li><strong>ETA:</strong> ${container.eta ? new Date(container.eta).toLocaleDateString('fr-FR') : 'Non communiqué'}</li>
        </ul>
      </div>
      <p style="margin-top:24px; font-size:12px; color:#6B7280;">
        Pour toute question, contactez-nous à <a href="mailto:info@danemo.be">info@danemo.be</a> ou par téléphone au +33 4 88 64 51 83.
      </p>
    </div>
  `
}

function buildSmsTemplate({
  container,
  status,
  message,
}: {
  container: any
  status: ContainerStatus
  message: string
}) {
  const base = `[Danemo] Conteneur ${container.code}: ${statusDescriptions[status].label}.`
  return `${base} ${message.replace(/\s+/g, ' ').trim()}`
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

    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('client_id')
      .eq('container_id', containerId)

    if (packagesError) throw packagesError

    const clientIds = Array.from(new Set((packages || []).map((p) => p.client_id).filter(Boolean))) as string[]

    if (clientIds.length === 0) {
      console.info('[notifications] No clients linked to container', container.code)
      return { emailsSent: 0, smsSent: 0, recipients: 0 }
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .in('id', clientIds)

    if (clientsError) throw clientsError

    const message = options.customMessage || statusDescriptions[status].defaultMessage

    const subject = `Conteneur ${container.code} - ${statusDescriptions[status].label}`
    const emailHtml = buildEmailTemplate({ container, status, message })
    const smsText = buildSmsTemplate({ container, status, message })

    let emailsSent = 0
    let smsSent = 0

    await Promise.all(
      (clients || []).map(async (client) => {
        if (client.email) {
          try {
            await sendEmail(client.email, subject, emailHtml)
            emailsSent += 1
          } catch (error) {
            console.error('[notifications] Failed to send email to', client.email, error)
          }
        }
        if (client.phone) {
          const result = await sendSms(client.phone, smsText)
          if (result.success) {
            smsSent += 1
          }
        }
      }),
    )

    return { emailsSent, smsSent, recipients: clients?.length || 0 }
  } catch (error) {
    console.error('[notifications] Error while notifying container status change:', error)
    return null
  }
}


