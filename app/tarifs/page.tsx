'use client'

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"

export default function TarifsPage() {
  const { messages } = useI18n()
  const { title, description, items, quoteRequest } = messages.rates

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8 font-serif text-[#B8860B]">{title}</h1>

          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">{description}</p>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-12">
            <div className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <div key={`rate-item-${index}`} className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                  <span className="text-gray-800">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-center text-gray-600 mb-8">{quoteRequest.description}</p>

            <form className="max-w-md mx-auto space-y-6">
              <div>
                <Input placeholder={quoteRequest.form.name} className="w-full" />
              </div>

              <div>
                <Input type="email" placeholder={quoteRequest.form.email} className="w-full" />
              </div>

              <div>
                <Input placeholder={quoteRequest.form.phone} className="w-full" />
              </div>

              <div>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {quoteRequest.form.subjectOptions.map((option, index) => (
                    <option key={`subject-option-${index}`}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <Textarea placeholder={quoteRequest.form.message} rows={4} className="w-full" />
              </div>

              <div className="text-center">
                <Button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2 rounded-md">
                  {quoteRequest.form.submit}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
