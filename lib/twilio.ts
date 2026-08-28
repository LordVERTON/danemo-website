import twilio from 'twilio'

let cachedClient: ReturnType<typeof twilio> | null = null

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio configuration')
  }

  if (!cachedClient) {
    cachedClient = twilio(accountSid, authToken)
  }

  return cachedClient
}

export function getTwilioMessagingServiceSid() {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  if (!messagingServiceSid) {
    throw new Error('Missing Twilio messaging service SID')
  }
  return messagingServiceSid
}
