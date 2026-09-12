import { supabaseAdmin } from '@/lib/supabase'
import { getTwilioClient, getTwilioMessagingServiceSid } from '@/lib/twilio'

export type MessageChannel = 'sms' | 'whatsapp'
export type MessageStatus = 'sent' | 'failed' | 'skipped'

export interface MessageLogInput {
  channel: MessageChannel
  body: string
  targetType: string
  targetId?: string | null
  customerId?: string | null
  phone?: string | null
  status: MessageStatus
  twilioSid?: string | null
  error?: string | null
  createdBy?: string | null
}

export interface SendMessageInput {
  toE164: string
  body: string
  channel?: MessageChannel
}

export function normalizePhoneE164(phone: string | null | undefined, defaultCountryCode = '+32') {
  const raw = String(phone || '').trim()
  if (!raw) return null

  if (raw.startsWith('+')) {
    const normalized = `+${raw.slice(1).replace(/\D/g, '')}`
    return normalized.length >= 8 ? normalized : null
  }

  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`
  }

  if (digits.startsWith('0')) {
    return `${defaultCountryCode}${digits.slice(1)}`
  }

  return `${defaultCountryCode}${digits}`
}

export async function sendTwilioMessage({ toE164, body, channel = 'sms' }: SendMessageInput) {
  const client = getTwilioClient()
  const messagingServiceSid = getTwilioMessagingServiceSid()
  const to = channel === 'whatsapp' ? `whatsapp:${toE164}` : toE164
  const message = await client.messages.create({
    body,
    messagingServiceSid,
    to,
  })
  return { sid: message.sid }
}

export async function logMessageAttempt(input: MessageLogInput) {
  const { error } = await (supabaseAdmin as any)
    .from('message_logs')
    .insert({
      channel: input.channel,
      body: input.body,
      target_type: input.targetType,
      target_id: input.targetId || null,
      customer_id: input.customerId || null,
      phone: input.phone || null,
      status: input.status,
      twilio_sid: input.twilioSid || null,
      error: input.error || null,
      created_by: input.createdBy || null,
    })

  if (error) {
    console.error('[messaging] Failed to log message attempt:', error)
  }
}
