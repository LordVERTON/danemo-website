import QRTrackingView from '@/components/qr-tracking-view'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function AdminQRPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const sp = (await searchParams) || {}
  const code = sp.code || sp.payload || ''
  const session = await getServerSession(authOptions)

  if (!session) {
    const returnTo = encodeURIComponent(`/admin/qr${code ? `?code=${encodeURIComponent(code)}` : ''}`)
    redirect(`/admin/login?returnTo=${returnTo}`)
  }

  return <QRTrackingView initialPayload={code} />
}
