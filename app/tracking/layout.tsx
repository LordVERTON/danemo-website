import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Suivi de colis",
  description: "Suivez votre expédition Danemo en temps réel grâce à votre numéro de suivi.",
}

export default function TrackingLayout({ children }: { children: ReactNode }) {
  return children
}
