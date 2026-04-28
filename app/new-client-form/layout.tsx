import type { Metadata } from 'next'
import { translations } from '@/lib/translations'

export const metadata: Metadata = {
  title: translations.fr.newClientForm.metaTitle,
  description: translations.fr.newClientForm.metaDescription,
}

export default function NewClientFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
