"use client"

import type React from "react"
import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle2, LoaderCircle, Send } from "lucide-react"

type FormData = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  company: string
  tax_id: string
  notes: string
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postal_code: "",
  country: "",
  company: "",
  tax_id: "",
  notes: "",
}

export default function NewClientFormPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("submitting")
    setError("")

    try {
      const response = await fetch("/api/public/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_website: "", customer: formData }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Enregistrement impossible pour le moment.")
      }

      setFormData(initialFormData)
      setStatus("success")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible pour le moment.")
      setStatus("error")
    }
  }

  const disabled = status === "submitting"

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="bg-[#14171a] pt-20 pb-16">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Fiche client</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                Créez votre fiche client.
              </h1>
              <p className="mt-5 text-gray-400 text-lg leading-relaxed">
                Renseignez vos coordonnées avant votre venue. Notre équipe préparera ensuite votre commande avec vous.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <Reveal>
              <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#14171a]">Vos informations</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Présentez-vous ensuite avec votre colis : un opérateur validera votre commande avec vous.
                </p>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="mb-2 block">Nom complet *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={disabled} required />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block">Adresse e-mail (facultatif)</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={disabled} />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="mb-2 block">Téléphone *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={disabled} required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address" className="mb-2 block">Adresse *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={disabled} required />
                  </div>
                  <div>
                    <Label htmlFor="city" className="mb-2 block">Ville *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={disabled} required />
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className="mb-2 block">Code postal *</Label>
                    <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} disabled={disabled} required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="country" className="mb-2 block">Pays *</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleChange} disabled={disabled} required />
                  </div>
                  <div>
                    <Label htmlFor="company" className="mb-2 block">Société (facultatif)</Label>
                    <Input id="company" name="company" value={formData.company} onChange={handleChange} disabled={disabled} />
                  </div>
                  <div>
                    <Label htmlFor="tax_id" className="mb-2 block">N° TVA / SIRET (facultatif)</Label>
                    <Input id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleChange} disabled={disabled} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes" className="mb-2 block">Précisions (facultatif)</Label>
                    <Textarea id="notes" name="notes" rows={4} value={formData.notes} onChange={handleChange} disabled={disabled} placeholder="Toute information utile pour votre fiche client" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={disabled}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {disabled ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {disabled ? "Enregistrement en cours…" : "Créer ma fiche client"}
                </button>

                <div aria-live="polite" className="mt-5">
                  {status === "success" && (
                    <p className="flex items-start gap-2 text-sm font-medium text-green-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      Votre fiche client est enregistrée. Présentez-vous avec votre commande auprès d’un opérateur pour l’enregistrer.
                    </p>
                  )}
                  {status === "error" && <p className="text-sm font-medium text-red-700">{error}</p>}
                </div>
              </form>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
