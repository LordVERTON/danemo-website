'use client'

import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

export default function HomePage() {
  const { messages } = useI18n()
  const { hero, about, nextDeparture, services, testimonials, contact } = messages.home

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="/images/services-fret.webp"
            alt="NYK LINE Container ship"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4">
          <div className="bg-white/90 px-8 py-4 rounded-lg mb-6 inline-block">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{hero.title}</h1>
          </div>
          <div className="inline-block bg-orange-500 px-6 py-3 rounded-lg">
            <h2 className="text-lg md:text-xl font-bold italic">{hero.subtitle}</h2>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold text-center mb-8 italic">{about.title}</h2>

              <div className="space-y-6 text-lg leading-relaxed">
                {about.paragraphs.map((paragraph, index) => (
                  <p key={`about-paragraph-${index}`}>{paragraph}</p>
                ))}
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {about.bulletPoints.map((item, index) => (
                    <li key={`about-list-${index}`}>{item}</li>
                  ))}
                </ul>

                <div className="bg-orange-50 p-6 rounded-lg mt-8">
                  {about.highlights.map((highlight, index) => (
                    <p
                      key={`about-highlight-${index}`}
                      className={`text-lg font-semibold text-orange-800 ${index === 0 ? '' : 'mt-2'}`}
                    >
                      {highlight}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Image src="/images/logo.webp" alt="Danemo Logo" width={400} height={300} className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Next Departure Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{nextDeparture.title}</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {nextDeparture.items.map((item) => (
              <div key={item.label} className="text-center">
                <h3 className="text-xl font-bold text-gray-700 mb-2">{item.label}</h3>
                <p className="text-lg text-gray-600">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{services.title}</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.cards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-video relative">
                  <Image src={card.image} alt={card.alt} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-orange-600 italic">{card.title}</h3>
                  <p className="text-gray-600 italic">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{testimonials.title}</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/L1e6I_c57jI"
                className="w-full h-full rounded-lg"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/46S7xTtEFaM"
                className="w-full h-full rounded-lg"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/M1l--qBwoCk"
                className="w-full h-full rounded-lg"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Brussels Map */}
            <div className="lg:col-span-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976!2d4.3520295!3d50.8684709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2savenue+du+port+108%2C+1000+Bruxelles!5e0!3m2!1sfr!2sBE!4v1751895260000"
                className="w-full h-64 rounded-lg"
                loading="lazy"
              ></iframe>
            </div>

            {/* Brussels Contact */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold mb-4">{contact.brussels.title}</h3>
              <div className="space-y-4">
                <div>
                  {contact.brussels.addressLines.map((line, index) => (
                    <p key={`brussels-line-${index}`} className="font-semibold">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Cameroon Map */}
            <div className="lg:col-span-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976!2d11.4889261!3d3.8316289!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2stam+tam+week+-end+yaounde+cameroun!5e0!3m2!1sfr!2sBE!4v1751895260000"
                className="w-full h-64 rounded-lg"
                loading="lazy"
              ></iframe>
            </div>

            {/* Cameroon Contact */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold mb-4">{contact.cameroon.title}</h3>
              <div className="space-y-4">
                {contact.cameroon.locations.map((location, index) => (
                  <div key={`cameroon-location-${index}`}>
                    <p className="font-semibold text-center">{location.title}</p>
                    <p className="font-semibold">{location.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
