import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Bona_Nova as Proxima_Nova } from "next/font/google"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n"
import { SupabaseRealtimeListener } from "@/app/components/SupabaseRealtimeListener"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair-display",
})

const proximaNova = Proxima_Nova({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-proxima-nova",
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Danemo - Rapprocher plus vite l'Afrique de la Diaspora",
  description:
    "Crée en Juin 2021, Danemo Srl est une entreprise de transport international qui s'occupe de l'envoi des colis de toute nature entre l'Europe et le Cameroun.",
  generator: "Next.js",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${playfairDisplay.variable} ${proximaNova.variable}`}>
      <body className="font-sans antialiased">
        <SupabaseRealtimeListener>
          <I18nProvider>{children}</I18nProvider>
        </SupabaseRealtimeListener>
      </body>
    </html>
  )
}
