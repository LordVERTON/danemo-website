'use client'

import Header from "@/components/header"
import Footer from "@/components/footer"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export default function ContactPage() {
  const { messages } = useI18n()
  const { title, subtitle, offices, hours, form } = messages.contactPage

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">{title}</h1>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#B8860B] font-serif">{offices.title}</h2>

              {/* Bureau Bruxelles */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-[#B8860B] font-serif">{offices.brussels.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-gray-600 whitespace-pre-line">{offices.brussels.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a href={`tel:${offices.brussels.phone}`} className="text-orange-500 hover:text-orange-600">
                        {offices.brussels.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${offices.brussels.email}`} className="text-orange-500 hover:text-orange-600">
                        {offices.brussels.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bureau Cameroun */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-[#B8860B] font-serif">{offices.cameroon.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-gray-600 whitespace-pre-line">{offices.cameroon.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a href={`tel:${offices.cameroon.phone}`} className="text-orange-500 hover:text-orange-600">
                        {offices.cameroon.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${offices.cameroon.email}`} className="text-orange-500 hover:text-orange-600">
                        {offices.cameroon.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div className="bg-orange-50 rounded-lg p-6 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-[#B8860B] font-serif">{hours.title}</h3>
                </div>
                <div className="space-y-1 text-gray-700">
                  <p>
                    <strong>{hours.weekdays}</strong>
                  </p>
                  <p>
                    <strong>{hours.saturday}</strong>
                  </p>
                  <p>
                    <strong>{hours.sunday}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#B8860B] font-serif">{form.title}</h2>

              <form className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      {form.firstName}
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      {form.lastName}
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {form.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {form.phone}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                    {form.service}
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {form.serviceOptions.map((option, index) => (
                      <option key={`service-option-${index}`} value={index === 0 ? "" : option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {form.message}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={form.messagePlaceholder}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
                >
                  {form.submit}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
