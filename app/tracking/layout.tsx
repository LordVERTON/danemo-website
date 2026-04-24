import { Suspense } from "react"

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-gray-600">
          Chargement du suivi…
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
