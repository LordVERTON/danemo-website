import QRTrackingView from '@/components/qr-tracking-view'

export default async function QRPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const sp = (await searchParams) || {}
  const code = sp.code || sp.payload || ''
  return <QRTrackingView initialPayload={code} />
}


