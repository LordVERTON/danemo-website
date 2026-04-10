import QRTrackingView from '@/components/qr-tracking-view'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function QRPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const sp = (await searchParams) || {}
  const code = sp.code || sp.payload || ''
  const isAuthenticated = (await cookies()).get('danemo_admin_session')?.value === 'authenticated'

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`/qr${code ? `?code=${encodeURIComponent(code)}` : ''}`)
    redirect(`/admin/login?returnTo=${returnTo}`)
  }

  return <QRTrackingView initialPayload={code} />
}


