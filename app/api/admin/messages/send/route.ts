import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase'
import {
  logMessageAttempt,
  normalizePhoneE164,
  sendTwilioMessage,
  type MessageChannel,
} from '@/lib/messaging'

type MessageMode = 'single' | 'all' | 'container' | 'city'

interface Recipient {
  customerId: string | null
  name: string
  phone: string
  phoneE164: string
}

interface RequestBody {
  mode?: MessageMode
  channel?: MessageChannel
  message?: string
  customer_id?: string
  container_id?: string
  city?: string
  transactional?: boolean
  dryRun?: boolean
}

const MAX_RECIPIENTS = 500

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status })
}

function personalizeMessage(message: string, recipient: Recipient) {
  return message.replaceAll('{{nom}}', recipient.name || 'client')
}

function dedupeRecipients(recipients: Recipient[]) {
  const seen = new Set<string>()
  return recipients.filter((recipient) => {
    if (seen.has(recipient.phoneE164)) return false
    seen.add(recipient.phoneE164)
    return true
  })
}

async function resolveRecipients(body: RequestBody): Promise<Recipient[]> {
  const mode = body.mode || 'all'
  const channel = body.channel || 'sms'
  const consentColumn = channel === 'whatsapp' ? 'opted_in_whatsapp' : 'opted_in_sms'
  const requireConsent = body.transactional !== true

  if (mode === 'single') {
    if (!body.customer_id) return []
    const { data, error } = await (supabaseAdmin as any)
      .from('customers')
      .select(`id, name, phone, phone_e164, ${consentColumn}`)
      .eq('id', body.customer_id)
      .maybeSingle()
    if (error) throw error
    if (!data || (requireConsent && !data[consentColumn])) return []
    const phoneE164 = data.phone_e164 || normalizePhoneE164(data.phone)
    return phoneE164
      ? [{ customerId: data.id, name: data.name || 'client', phone: data.phone || phoneE164, phoneE164 }]
      : []
  }

  if (mode === 'container') {
    if (!body.container_id) return []
    const { data, error } = await (supabaseAdmin as any)
      .from('orders')
      .select(
        `customer_id, client_name, client_phone, recipient_name, recipient_phone, customers(id, name, phone, phone_e164, ${consentColumn})`,
      )
      .eq('container_id', body.container_id)
    if (error) throw error

    const recipients = (data || []).flatMap((order: any) => {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
      if (requireConsent && (!customer || !customer[consentColumn])) return []

      const phone = customer?.phone_e164 || customer?.phone || order.client_phone || order.recipient_phone
      const phoneE164 = normalizePhoneE164(phone)
      if (!phoneE164) return []

      return [{
        customerId: customer?.id || order.customer_id || null,
        name: customer?.name || order.client_name || order.recipient_name || 'client',
        phone: phone || phoneE164,
        phoneE164,
      }]
    })
    return dedupeRecipients(recipients)
  }

  let query = (supabaseAdmin as any)
    .from('customers')
    .select(`id, name, phone, phone_e164, city, ${consentColumn}`)
    .eq('status', 'active')
    .not('phone', 'is', null)

  if (mode === 'city') {
    const city = String(body.city || '').trim()
    if (!city) return []
    query = query.ilike('city', city)
  }

  if (requireConsent) {
    query = query.eq(consentColumn, true)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(MAX_RECIPIENTS)
  if (error) throw error

  return dedupeRecipients(
    (data || [])
      .map((customer: any) => {
        const phoneE164 = customer.phone_e164 || normalizePhoneE164(customer.phone)
        if (!phoneE164) return null
        return {
          customerId: customer.id,
          name: customer.name || 'client',
          phone: customer.phone || phoneE164,
          phoneE164,
        }
      })
      .filter(Boolean) as Recipient[],
  )
}

export const GET = requireRole(['admin'])(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const body: RequestBody = {
      mode: (searchParams.get('mode') || 'all') as MessageMode,
      channel: (searchParams.get('channel') || 'sms') as MessageChannel,
      customer_id: searchParams.get('customer_id') || undefined,
      container_id: searchParams.get('container_id') || undefined,
      city: searchParams.get('city') || undefined,
      transactional: searchParams.get('transactional') === 'true',
    }
    const recipients = await resolveRecipients(body)
    return NextResponse.json({
      success: true,
      data: {
        recipients: recipients.length,
        sample: recipients.slice(0, 5).map((recipient) => ({
          name: recipient.name,
          phone: recipient.phoneE164,
        })),
      },
    })
  } catch (error) {
    console.error('[admin.messages.preview] error', error)
    return jsonError('Impossible de calculer les destinataires', 500)
  }
})

export const POST = requireRole(['admin'])(async (request: NextRequest, user) => {
  try {
    const body = (await request.json()) as RequestBody
    const message = String(body.message || '').trim()
    const channel = body.channel || 'sms'
    const mode = body.mode || 'all'

    if (!['sms', 'whatsapp'].includes(channel)) {
      return jsonError('Canal invalide', 400)
    }

    if (!message || message.length < 10) {
      return jsonError('Le message est trop court', 400)
    }

    if (message.length > 1000) {
      return jsonError('Le message est trop long', 400)
    }

    const recipients = await resolveRecipients({ ...body, channel, mode })
    if (recipients.length === 0) {
      return jsonError('Aucun destinataire avec numero valide', 400)
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return jsonError(`Trop de destinataires (${recipients.length})`, 400)
    }

    if (body.dryRun) {
      return NextResponse.json({
        success: true,
        data: { recipients: recipients.length, sent: 0, failed: 0, dryRun: true },
      })
    }

    let sent = 0
    let failed = 0
    const errors: Array<{ phone: string; error: string }> = []

    for (const recipient of recipients) {
      const bodyForRecipient = personalizeMessage(message, recipient)
      try {
        const result = await sendTwilioMessage({
          toE164: recipient.phoneE164,
          body: bodyForRecipient,
          channel,
        })
        sent += 1
        await logMessageAttempt({
          channel,
          body: bodyForRecipient,
          targetType: mode,
          targetId: body.container_id || body.customer_id || body.city || null,
          customerId: recipient.customerId,
          phone: recipient.phoneE164,
          status: 'sent',
          twilioSid: result.sid,
          createdBy: user.email,
        })
      } catch (error) {
        failed += 1
        const msg = error instanceof Error ? error.message : 'Erreur Twilio inconnue'
        errors.push({ phone: recipient.phoneE164, error: msg })
        await logMessageAttempt({
          channel,
          body: bodyForRecipient,
          targetType: mode,
          targetId: body.container_id || body.customer_id || body.city || null,
          customerId: recipient.customerId,
          phone: recipient.phoneE164,
          status: 'failed',
          error: msg,
          createdBy: user.email,
        })
      }
    }

    return NextResponse.json({
      success: failed === 0,
      data: {
        recipients: recipients.length,
        sent,
        failed,
        errors: errors.slice(0, 10),
      },
    })
  } catch (error) {
    console.error('[admin.messages.send] error', error)
    return jsonError("Erreur interne lors de l'envoi", 500)
  }
})
