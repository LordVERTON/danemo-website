export interface SmsConfig {
  accountSid: string
  authToken: string
  from: string
}

function getSmsConfig(): SmsConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM

  if (!accountSid || !authToken || !from) {
    console.warn('[sms] Missing Twilio configuration. SMS notifications disabled.')
    return null
  }

  return { accountSid, authToken, from }
}

export async function sendSms(to: string, body: string) {
  const cfg = getSmsConfig()
  if (!cfg) {
    return { success: false, reason: 'missing_config' } as const
  }

  try {
    const payload = new URLSearchParams({
      From: cfg.from,
      To: to,
      Body: body,
    }).toString()

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload,
      },
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('[sms] Failed to send SMS via Twilio:', response.status, text)
      return { success: false, reason: 'twilio_error', status: response.status } as const
    }

    return { success: true } as const
  } catch (error) {
    console.error('[sms] Unexpected error while sending SMS:', error)
    return { success: false, reason: 'unexpected_error' } as const
  }
}


