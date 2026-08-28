import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.danemo.be"),
  title: {
    default: "Danemo — Fret, dédouanement et déménagement entre l'Europe et l'Afrique",
    template: "%s | Danemo",
  },
  description:
    "Danemo SRL accompagne particuliers, entreprises et diaspora entre l'Europe et le Cameroun : fret maritime et aérien, dédouanement de véhicules et marchandises, négoce et déménagement international. Devis rapide, suivi transparent.",
  keywords: [
    "Danemo",
    "fret maritime Cameroun",
    "envoi colis Afrique",
    "dédouanement véhicule Cameroun",
    "déménagement international Afrique",
    "transport Europe Afrique",
  ],
  generator: "Next.js",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Danemo",
    title: "Danemo — Rapprocher plus vite l'Afrique de la diaspora",
    description:
      "Fret maritime et aérien, dédouanement, négoce et déménagement international entre l'Europe et le Cameroun.",
    images: ["/images/logo.webp"],
  },
  twitter: {
    card: "summary",
    title: "Danemo — Rapprocher plus vite l'Afrique de la diaspora",
    description:
      "Fret maritime et aérien, dédouanement, négoce et déménagement international entre l'Europe et le Cameroun.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <noscript>
          <style>{"[data-reveal]{opacity:1 !important;transform:none !important}"}</style>
        </noscript>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
