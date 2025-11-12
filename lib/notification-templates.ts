import { getAppBaseUrl } from '@/lib/notify'

export interface StatusEmailPayload {
  recipientName?: string | null
  shipmentReference?: string | null
  stageLabel: string
  trackingUrl?: string | null
}

const SUBJECT = 'Bonne nouvelle ! Votre colis avance 🚚'

function getFirstName(fullName?: string | null) {
  if (!fullName) return 'client'
  const trimmed = fullName.trim()
  if (!trimmed) return 'client'
  return trimmed.split(/\s+/)[0]
}

function ensureTrackingUrl(url?: string | null) {
  if (url && /^https?:\/\//i.test(url)) return url
  const base = getAppBaseUrl()
  if (!url) return `${base}/tracking`
  if (url.startsWith('http')) return url
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export function buildTrackingUrl(options: {
  orderNumber?: string | null
  containerCode?: string | null
  qrCode?: string | null
}): string {
  const base = getAppBaseUrl()
  if (options.orderNumber) {
    const query = encodeURIComponent(options.orderNumber)
    return `${base}/tracking?tracking=${query}`
  }
  if (options.containerCode) {
    const query = encodeURIComponent(options.containerCode)
    return `${base}/tracking?code=${query}`
  }
  if (options.qrCode) {
    const query = encodeURIComponent(options.qrCode)
    return `${base}/qr?code=${query}`
  }
  return `${base}/tracking`
}

export function buildClientStatusEmail({
  recipientName,
  shipmentReference,
  stageLabel,
  trackingUrl,
}: StatusEmailPayload) {
  const name = getFirstName(recipientName)
  const reference = shipmentReference || 'votre envoi'
  const link = ensureTrackingUrl(trackingUrl)

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Bonjour ${name},</p>
      <p>
        Votre commande <strong>${reference}</strong> avance !
        Elle est maintenant <strong>${stageLabel}</strong>.
      </p>
      <p>
        Vous pouvez suivre son trajet ici 👉
        <a href="${link}" style="color:#FF8C00; font-weight:bold;">Lien de suivi</a>.
      </p>
      <p>
        Merci d’avoir choisi Danemo pour cette envoi !
      </p>
      <p>
        À très vite,<br />
        L’équipe Danemo SRL
      </p>
    </div>
  `

  return {
    subject: SUBJECT,
    html,
  }
}


