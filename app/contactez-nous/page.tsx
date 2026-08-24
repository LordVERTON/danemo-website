"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react"

const SERVICE_OPTIONS = [
  { value: "fret", label: "Fret maritime et aérien" },
  { value: "dedouanement", label: "Dédouanement véhicules, conteneurs et marchandises" },
  { value: "negoce", label: "Négoce" },
  { value: "demenagement", label: "Déménagement international" },
  { value: "commerce", label: "Commerce général" },
  { value: "autre", label: "Autre demande" },
]

export default function ContactezNousPage() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    service: "",
    sujet: "",
    message: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sujet = params.get("sujet")
    if (sujet) {
      setFormData((prev) => ({ ...prev, sujet }))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const serviceLabel = SERVICE_OPTIONS.find((s) => s.value === formData.service)?.label
    const subject = encodeURIComponent(formData.sujet || `Demande de contact — ${serviceLabel ?? "Danemo"}`)
    const body = encodeURIComponent(
      `Nom : ${formData.nom}\nEmail : ${formData.email}\nTéléphone : ${formData.telephone || "—"}\nService concerné : ${serviceLabel ?? "—"}\n\nMessage :\n${formData.message}`,
    )
    window.location.href = `mailto:info@danemo.be?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="bg-[#14171a] pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Contact</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                Parlons de votre projet.
              </h1>
              <p className="mt-5 text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                Que vous souhaitiez envoyer un colis, importer un véhicule, trouver un fournisseur ou préparer votre
                installation en Afrique, notre équipe vous répond rapidement.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* Offices */}
              <div className="lg:col-span-2 space-y-6">
                <Reveal>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="font-bold text-[#14171a] flex items-center gap-2">
                      <MapPin className="w-4.5 h-4.5 text-orange-600" />
                      Bruxelles, Belgique
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      Avenue du Port 108–110, 1000 Bruxelles
                      <br />
                      Kai 299, porte 2.60
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      <a href="tel:+32488645183" className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors">
                        <Phone className="w-4 h-4 text-orange-600" />
                        +32 488 64 51 83
                      </a>
                      <a href="mailto:info@danemo.be" className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors">
                        <Mail className="w-4 h-4 text-orange-600" />
                        info@danemo.be
                      </a>
                      <p className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Lun – Ven 9h–18h · Sam 9h–14h
                      </p>
                    </div>
                    <iframe
                      title="Localisation du bureau de Bruxelles"
                      src={`https://www.google.com/maps?q=${encodeURIComponent("Avenue du Port 108-110, 1000 Bruxelles, Belgique")}&output=embed`}
                      className="w-full h-40 rounded-xl mt-4 border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </Reveal>

                <Reveal delay={80}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="font-bold text-[#14171a] flex items-center gap-2">
                      <MapPin className="w-4.5 h-4.5 text-orange-600" />
                      Cameroun
                    </h2>
                    <div className="mt-3 space-y-3 text-sm text-gray-600">
                      <div>
                        <p className="font-semibold text-gray-800">Yaoundé — Biyem-Assi, Tam-Tam Week-end</p>
                        <a href="tel:+237690262004" className="hover:text-orange-600 transition-colors">
                          +237 690 26 20 04
                        </a>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Douala — Youpwe</p>
                        <a href="tel:+237655512598" className="hover:text-orange-600 transition-colors">
                          +237 655 51 25 98
                        </a>
                      </div>
                    </div>
                    <iframe
                      title="Localisation du bureau de Yaoundé"
                      src={`https://www.google.com/maps?q=${encodeURIComponent("Biyem-Assi, Tam-Tam Week-end, Yaoundé, Cameroun")}&output=embed`}
                      className="w-full h-40 rounded-xl mt-4 border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </Reveal>
              </div>

              {/* Form */}
              <Reveal delay={120} className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-[#14171a] mb-1">Envoyez-nous un message</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Votre message ouvrira votre messagerie, prêt à être envoyé à info@danemo.be.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="nom" className="mb-2 block">Nom et prénom *</Label>
                      <Input id="nom" name="nom" value={formData.nom} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-2 block">Adresse e-mail *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 mt-5">
                    <div>
                      <Label htmlFor="telephone" className="mb-2 block">Téléphone</Label>
                      <Input id="telephone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} />
                    </div>
                    <div>
                      <Label htmlFor="service" className="mb-2 block">Service concerné</Label>
                      <Select
                        value={formData.service}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, service: value }))}
                      >
                        <SelectTrigger id="service" className="w-full">
                          <SelectValue placeholder="Sélectionnez un service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Label htmlFor="sujet" className="mb-2 block">Sujet</Label>
                    <Input id="sujet" name="sujet" value={formData.sujet} onChange={handleChange} placeholder="Ex : Demande de devis" />
                  </div>

                  <div className="mt-5">
                    <Label htmlFor="message" className="mb-2 block">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Décrivez votre projet ou votre demande..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-7 w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </button>
                </form>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
