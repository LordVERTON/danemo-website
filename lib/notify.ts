import nodemailer from 'nodemailer'
import { Resend } from 'resend'

export interface MailConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

export function getMailConfig(): MailConfig {
  const host = process.env.SMTP_HOST || ''
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER || ''
  const pass = process.env.SMTP_PASS || ''
  const from = process.env.SMTP_FROM || 'no-reply@danemo.be'
  if (!host || !user || !pass) {
    throw new Error('Missing SMTP configuration')
  }
  return { host, port, user, pass, from }
}

let cachedBaseUrl: string | null = null

export function getAppBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl
  const raw =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://danemo.be'

  cachedBaseUrl = raw.replace(/\/+$/, '')
  return cachedBaseUrl
}

function isMailpitEnabled(): boolean {
  const v = process.env.MAILPIT_ENABLED
  return v === '1' || v?.toLowerCase() === 'true'
}

function isDanemoAppSender(from: string): boolean {
  const match = from.match(/<([^>]+)>/)
  const email = (match ? match[1] : from).trim().toLowerCase()
  return email.endsWith('@danemo.app')
}

/** SMTP vers Mailpit (aucune auth par défaut). Prioritaire en dev si MAILPIT_ENABLED. */
async function sendViaMailpit(to: string, subject: string, html: string) {
  const host = process.env.MAILPIT_SMTP_HOST || '127.0.0.1'
  const port = Number(process.env.MAILPIT_SMTP_PORT || '1025')
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
  })
  const from =
    process.env.MAILPIT_FROM?.trim() ||
    'Danemo (dev) <dev@localhost>'
  await transporter.sendMail({ from, to, subject, html })
}

/**
 * Envoie un mail transactionnel :
 * 1. Mailpit si MAILPIT_ENABLED=true (local, capture dans l’UI http://localhost:8025)
 * 2. Sinon Resend si RESEND_API_KEY
 * 3. Sinon SMTP classique (SMTP_HOST / SMTP_USER / SMTP_PASS)
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (isMailpitEnabled()) {
    await sendViaMailpit(to, subject, html)
    return
  }

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    // `from` must use a domain verified in Resend (https://resend.com/domains).
    // Default matches the Danemo Resend domain; override with RESEND_FROM if needed.
    const from =
      process.env.RESEND_FROM?.trim() ||
      'Danemo <noreply@danemo.app>'
    if (!isDanemoAppSender(from)) {
      console.warn(
        '[notifications] RESEND_FROM should use a verified @danemo.app sender. Current value:',
        from,
      )
    }
    const { error } = await resend.emails.send({ from, to, subject, html })
    if (error) {
      const msg =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: string }).message)
          : String(error)
      throw new Error(msg)
    }
    return
  }

  const cfg = getMailConfig()
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  })
  await transporter.sendMail({ from: cfg.from, to, subject, html })
}
