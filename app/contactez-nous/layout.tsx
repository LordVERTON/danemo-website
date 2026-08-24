import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Contactez-nous",
  description:
    "Demandez un devis ou contactez Danemo depuis la Belgique ou le Cameroun : Bruxelles, Yaoundé et Douala.",
}

export default function ContactezNousLayout({ children }: { children: ReactNode }) {
  return children
}
