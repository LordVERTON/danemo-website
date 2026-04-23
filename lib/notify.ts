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

/** Sends transactional mail: Resend when `RESEND_API_KEY` is set, otherwise SMTP. */
export async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    const from =
      process.env.RESEND_FROM ||
      'Danemo Notifications <notifications@danemo.be>'
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
