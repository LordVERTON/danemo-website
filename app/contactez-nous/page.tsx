"use client"

import type React from "react"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export default function ContactPage() {
  const { messages } = useI18n()
  const { title, subtitle, form, info } = messages.contactForm
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Create mailto link
    const subject = encodeURIComponent(formData.sujet)
    const body = encodeURIComponent(`Nom: ${formData.nom}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)
    window.location.href = `mailto:info@danemo.be?subject=${subject}&body=${body}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-4">{title}</h1>
          <p className="text-center text-gray-600 text-lg mb-12 italic font-semibold">{subtitle}</p>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info and Map */}
            <div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976!2d4.3520295!3d50.8684709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAvenue+du+port+108+%2C+1000+Bruxelles!5e0!3m2!1sfr!2sBE!4v1751897299000"
                className="w-full h-64 rounded-lg border-0 mb-6"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>

              <div className="space-y-4">
                <p className="font-semibold">{info.description}</p>
                <div>
                  <p>
                    <strong>{info.hours}</strong>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>{info.warehouse}</strong>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>{info.phone}</strong>{" "}
                    <a href="tel:+32488645183" className="text-orange-500 hover:underline">
                      +32488645183
                    </a>
                  </p>
                  <p>
                    <strong>{info.email}</strong>{" "}
                    <a href="mailto:info@danemo.be" className="text-orange-500 hover:underline">
                      info@danemo.be
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-center mb-6">{info.title}</h2>
              <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                <div>
                  <label className="block text-sm font-medium mb-2">{form.name}</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{form.email}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{form.subject}</label>
                  <input
                    type="text"
                    name="sujet"
                    value={formData.sujet}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{form.message}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  {form.submit}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
