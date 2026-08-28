import { getAppBaseUrl } from '@/lib/notify'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type NotificationOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type NotificationContainerStatus =
  | 'planned'
  | 'departed'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'delayed'

export interface OrderStatusEmailParams {
  recipientName?: string | null
  orderNumber?: string | null
  trackingUrl?: string | null
}

export interface ContainerStatusEmailParams {
  recipientName?: string | null
  shipmentReference?: string | null
  trackingUrl?: string | null
  customMessage?: string | null
  /** Numéro de commande (texte d’intro du message personnalisé) */
  orderNumber?: string | null
  /** Code conteneur maritime (texte d’intro du message personnalisé) */
  containerCode?: string | null
}

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
    return `${base}/admin/qr?code=${query}`
  }
  return `${base}/tracking`
}

function layoutEmail(opts: {
  preview: string
  greetingName: string
  blocks: string[]
  trackingUrl: string
}) {
  const link = ensureTrackingUrl(opts.trackingUrl)
  const blocksHtml = opts.blocks.map((b) => `<p style="margin:0 0 16px;">${b}</p>`).join('')
  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light" />
  </head>
  <body style="margin:0;background-color:#f6f9fc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.08);padding:28px 24px;">
            <tr><td style="color:#111827;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;">Bonjour ${escapeHtml(opts.greetingName)},</p>
              ${blocksHtml}
              <p style="margin:0 0 16px;">
                Suivi en temps réel 👉
                <a href="${link}" style="color:#ea580c;font-weight:bold;">${link}</a>
              </p>
              <p style="margin:0 0 8px;">Merci de votre confiance,</p>
              <p style="margin:0;">L’équipe <strong>Danemo SRL</strong></p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

const ORDER_KEYS: NotificationOrderStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]

export function normalizeOrderStatus(raw: string): NotificationOrderStatus | null {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  return ORDER_KEYS.includes(s as NotificationOrderStatus) ? (s as NotificationOrderStatus) : null
}

const CONTAINER_KEYS: NotificationContainerStatus[] = [
  'planned',
  'departed',
  'in_transit',
  'arrived',
  'delivered',
  'delayed',
]

export function normalizeContainerStatus(raw: string): NotificationContainerStatus | null {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  return CONTAINER_KEYS.includes(s as NotificationContainerStatus)
    ? (s as NotificationContainerStatus)
    : null
}

/** Distinct subject + body per order lifecycle step */
export function buildOrderStatusEmail(
  status: NotificationOrderStatus,
  params: OrderStatusEmailParams
): { subject: string; html: string } {
  const greetingName = getFirstName(params.recipientName)
  const ref = params.orderNumber || 'votre commande'
  const refSafe = escapeHtml(ref)
  const trackingUrl = params.trackingUrl

  const variants: Record<
    NotificationOrderStatus,
    { subject: string; preview: string; blocks: string[] }
  > = {
    pending: {
      subject: `Commande ${ref} — bien reçue`,
      preview: 'Nous avons bien enregistré votre commande.',
      blocks: [
        `Nous avons bien enregistré votre commande <strong>${refSafe}</strong>.`,
        'Elle est <strong>en préparation</strong> : notre équipe vérifie les informations et planifie l’expédition.',
        'Vous recevrez un nouvel e-mail dès qu’une étape importante sera atteinte.',
      ],
    },
    confirmed: {
      subject: `Commande ${ref} — confirmée`,
      preview: 'Votre commande est confirmée et en préparation.',
      blocks: [
        `Bonne nouvelle : votre commande <strong>${refSafe}</strong> est <strong>confirmée</strong>.`,
        'Nous préparons votre envoi selon les modalités convenues.',
      ],
    },
    in_progress: {
      subject: `Commande ${ref} — en cours de livraison`,
      preview: 'Votre colis est en route.',
      blocks: [
        `Votre commande <strong>${refSafe}</strong> est maintenant <strong>en cours de livraison</strong>.`,
        'Le transport est en cours : vous pouvez suivre l’avancement via le lien ci-dessous.',
      ],
    },
    completed: {
      subject: `Commande ${ref} — livrée`,
      preview: 'Votre commande est livrée.',
      blocks: [
        `Votre commande <strong>${refSafe}</strong> est indiquée comme <strong>livrée</strong>.`,
        'Nous espérons que tout s’est bien passé. Pour toute question, répondez à cet e-mail ou contactez-nous.',
      ],
    },
    cancelled: {
      subject: `Commande ${ref} — annulée`,
      preview: 'Mise à jour sur votre commande.',
      blocks: [
        `Votre commande <strong>${refSafe}</strong> a été <strong>annulée</strong>.`,
        'Si vous pensez qu’il s’agit d’une erreur ou si vous souhaitez en savoir plus, contactez-nous sans attendre.',
      ],
    },
  }

  const v = variants[status]
  return {
    subject: v.subject,
    html: layoutEmail({
      preview: v.preview,
      greetingName,
      blocks: v.blocks,
      trackingUrl: trackingUrl ?? '',
    }),
  }
}

/** Distinct subject + body per container logistics step (or custom admin message) */
export function buildContainerStatusEmail(
  status: NotificationContainerStatus,
  params: ContainerStatusEmailParams
): { subject: string; html: string } {
  const greetingName = getFirstName(params.recipientName)
  const trackingRef = (params.orderNumber || params.shipmentReference || '').trim()
  const containerRef = (params.containerCode || '').trim()
  const ref = trackingRef || containerRef || 'votre colis'
  const refSafe = escapeHtml(ref)
  const containerSafe = escapeHtml(containerRef)
  const trackingUrl = params.trackingUrl

  if (params.customMessage?.trim()) {
    const msg = params.customMessage.trim()
    const orderNum = trackingRef || ref
    const contCode = containerRef
    const orderSafe = escapeHtml(orderNum)
    const contSafe = containerSafe

    let intro: string
    if (contCode && orderNum && contCode !== orderNum) {
      intro = `Concernant votre colis n° <strong>${orderSafe}</strong> dans le conteneur <strong>${contSafe}</strong>, voici une mise à jour de notre équipe :`
    } else if (orderNum) {
      intro = `Concernant votre colis n° <strong>${orderSafe}</strong>, voici une mise à jour de notre équipe :`
    } else {
      intro = `Concernant votre colis <strong>${refSafe}</strong>, voici une mise à jour de notre équipe :`
    }

    const subjectRef = orderNum || ref
    return {
      subject: `Suivi de votre colis ${subjectRef} — message Danemo`,
      html: layoutEmail({
        preview: msg.slice(0, 120),
        greetingName,
        blocks: [intro, escapeHtml(msg)],
        trackingUrl: trackingUrl ?? '',
      }),
    }
  }

  const variants: Record<
    NotificationContainerStatus,
    { subject: string; preview: string; blocks: string[] }
  > = {
    planned: {
      subject: `Suivi de votre colis ${ref} — planifié`,
      preview: 'Votre colis est planifié.',
      blocks: [
        containerRef
          ? `Votre colis <strong>${refSafe}</strong> est <strong>planifié</strong> dans le conteneur <strong>${containerSafe}</strong>.`
          : `Votre colis <strong>${refSafe}</strong> est <strong>planifié</strong>.`,
        'Les dates de départ et d’arrivée estimées seront affichées dans votre suivi dès qu’elles seront figées.',
      ],
    },
    departed: {
      subject: `Suivi de votre colis ${ref} — départ confirmé`,
      preview: 'Le départ de votre colis est confirmé.',
      blocks: [
        containerRef
          ? `Le départ de votre colis <strong>${refSafe}</strong> est confirmé (conteneur <strong>${containerSafe}</strong>).`
          : `Le départ de votre colis <strong>${refSafe}</strong> est confirmé.`,
        'Il est en route vers la prochaine étape logistique.',
      ],
    },
    in_transit: {
      subject: `Suivi de votre colis ${ref} — en transit`,
      preview: 'Votre colis est en transit.',
      blocks: [
        containerRef
          ? `Votre colis <strong>${refSafe}</strong> est <strong>en transit</strong> (conteneur <strong>${containerSafe}</strong>) sur le trajet prévu.`
          : `Votre colis <strong>${refSafe}</strong> est <strong>en transit</strong> sur le trajet prévu.`,
        'Les délais peuvent varier selon les correspondances et contrôles douaniers.',
      ],
    },
    arrived: {
      subject: `Suivi de votre colis ${ref} — arrivé dans la région`,
      preview: 'Votre colis est arrivé près de vous.',
      blocks: [
        containerRef
          ? `Votre colis <strong>${refSafe}</strong> est <strong>arrivé dans votre région</strong> (conteneur <strong>${containerSafe}</strong>).`
          : `Votre colis <strong>${refSafe}</strong> est <strong>arrivé dans votre région</strong>.`,
        'Les opérations de dégroupage et livraison locale peuvent démarrer sous peu.',
      ],
    },
    delivered: {
      subject: `Suivi de votre colis ${ref} — livré`,
      preview: 'Votre colis est livré.',
      blocks: [
        `Votre colis <strong>${refSafe}</strong> est indiqué comme <strong>livré</strong>.`,
        containerRef
          ? `Si vous constatez un écart, contactez-nous en précisant le numéro de suivi ${refSafe} (conteneur ${containerSafe}).`
          : `Si vous constatez un écart, contactez-nous en précisant le numéro de suivi ${refSafe}.`,
      ],
    },
    delayed: {
      subject: `Suivi de votre colis ${ref} — retard signalé`,
      preview: 'Mise à jour : léger retard.',
      blocks: [
        containerRef
          ? `Votre colis <strong>${refSafe}</strong> subit un <strong>léger retard</strong> (conteneur <strong>${containerSafe}</strong>) sur le planning initial.`
          : `Votre colis <strong>${refSafe}</strong> subit un <strong>léger retard</strong> sur le planning initial.`,
        'Nous suivons la situation de près et vous tiendrons informé dès que la date sera rétablie.',
      ],
    },
  }

  const v = variants[status]
  return {
    subject: v.subject,
    html: layoutEmail({
      preview: v.preview,
      greetingName,
      blocks: v.blocks,
      trackingUrl: trackingUrl ?? '',
    }),
  }
}

/**
 * E-mail envoyé au client après inscription via le formulaire public (nouveau client).
 * Contenu aligné sur le message métier demandé (prise en charge + suivi).
 */
export function buildSelfRegisterClientConfirmationEmail(opts: {
  orderNumber: string
  /** Ex. ville / pays de destination saisis sur le formulaire */
  destination: string
}): { subject: string; html: string } {
  const orderSafe = escapeHtml(opts.orderNumber.trim())
  const destSafe = escapeHtml((opts.destination || '').trim() || 'votre destination')
  const trackingPageUrl = ensureTrackingUrl(`${getAppBaseUrl()}/tracking`)
  const trackingPageDisplay = escapeHtml(trackingPageUrl)
  const trackingPageHrefAttr = escapeHtml(trackingPageUrl)
  const contactPhoneRaw = (process.env.DANEMO_CONTACT_PHONE || '+32 488 645 183').trim()
  const contactPhoneDisplay = escapeHtml(contactPhoneRaw)
  const telDigits = contactPhoneRaw.replace(/[^\d+]/g, '') || '+32488645183'
  const telHrefAttr = escapeHtml(`tel:${telDigits}`)

  const subject = `Danemo — Prise en charge de votre envoi (${opts.orderNumber.trim()})`

  const html = `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light" />
  </head>
  <body style="margin:0;background-color:#f6f9fc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">Votre envoi ${orderSafe} est pris en charge — suivi sur danemo.app</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:640px;background:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.08);padding:28px 24px;">
            <tr>
              <td style="color:#111827;font-size:15px;line-height:1.65;">
                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Message — Client</p>
                <p style="margin:0 0 20px;">Madame, Monsieur,</p>
                <p style="margin:0 0 16px;">
                  Nous vous informons que votre envoi a bien été <strong>pris en charge</strong> par nos services.
                </p>
                <p style="margin:0 0 16px;">
                  📦 <strong>Numéro de colis :</strong> <strong style="color:#c2410c;">${orderSafe}</strong>
                </p>
                <p style="margin:0 0 20px;">
                  Votre colis est actuellement en attente d’acheminement vers <strong>${destSafe}</strong>,
                  conformément aux informations fournies lors de votre commande.
                </p>
                <p style="margin:0 0 10px;"><strong>Détails d’accès au suivi :</strong></p>
                <ul style="margin:0 0 20px;padding-left:20px;">
                  <li style="margin-bottom:8px;">
                    <strong>Étape 1 :</strong> Rendez-vous sur le site officiel :
                    <a href="${trackingPageHrefAttr}" style="color:#ea580c;font-weight:bold;">${trackingPageDisplay}</a>
                  </li>
                  <li style="margin-bottom:8px;"><strong>Étape 2 :</strong> Saisissez votre numéro de colis</li>
                  <li style="margin-bottom:8px;"><strong>Étape 3 :</strong> Consultez les informations relatives à votre envoi</li>
                </ul>
                <p style="margin:0 0 16px;">
                  Pour toute question supplémentaire, veuillez nous contacter au
                  <strong><a href="${telHrefAttr}" style="color:#111827;">${contactPhoneDisplay}</a></strong>
                  afin que nous puissions vous répondre dans les plus brefs délais.
                </p>
                <p style="margin:0 0 8px;">
                  Nous vous remercions de votre confiance et restons à votre entière disposition pour toute information complémentaire.
                </p>
                <p style="margin:20px 0 0;">Cordialement,</p>
                <p style="margin:4px 0 0;"><strong>Équipe DANEMO</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html }
}

/** Fallback when only a free-text status line is available (e.g. older clients). */
export function buildGenericUpdateEmail(opts: {
  entityLabel: 'commande' | 'conteneur'
  recipientName?: string | null
  reference: string
  humanLine: string
  trackingUrl?: string | null
}) {
  const greetingName = getFirstName(opts.recipientName)
  const label = opts.entityLabel === 'commande' ? 'commande' : 'conteneur'
  const safeLine = escapeHtml(opts.humanLine)
  return {
    subject: `Mise à jour — votre ${label} ${opts.reference}`,
    html: layoutEmail({
      preview: safeLine.slice(0, 120),
      greetingName,
      blocks: [
        `Nous vous informons d’une mise à jour concernant votre <strong>${label}</strong> <strong>${escapeHtml(opts.reference)}</strong>.`,
        `Détail : <strong>${safeLine}</strong>.`,
      ],
      trackingUrl: opts.trackingUrl ?? '',
    }),
  }
}
