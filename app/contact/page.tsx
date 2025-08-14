import Header from "@/components/header"
import Footer from "@/components/footer"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">Contactez-nous</h1>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#B8860B] font-serif">Nos Bureaux</h2>

              {/* Bureau Bruxelles */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-[#B8860B] font-serif">Bruxelles, Belgique</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-gray-600">
                        Rue de la Loi 123
                        <br />
                        1000 Bruxelles, Belgique
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a href="tel:+32488645183" className="text-orange-500 hover:text-orange-600">
                        +32 488 645 183
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href="mailto:info@danemo.be" className="text-orange-500 hover:text-orange-600">
                        info@danemo.be
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bureau Cameroun */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-[#B8860B] font-serif">Douala, Cameroun</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-gray-600">
                        Boulevard de la Liberté
                        <br />
                        Douala, Cameroun
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a href="tel:+237123456789" className="text-orange-500 hover:text-orange-600">
                        +237 123 456 789
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href="mailto:cameroun@danemo.be" className="text-orange-500 hover:text-orange-600">
                        cameroun@danemo.be
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div className="bg-orange-50 rounded-lg p-6 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-[#B8860B] font-serif">Horaires d'ouverture</h3>
                </div>
                <div className="space-y-1 text-gray-700">
                  <p>
                    <strong>Lundi - Vendredi :</strong> 9h00 - 18h00
                  </p>
                  <p>
                    <strong>Samedi :</strong> 9h00 - 14h00
                  </p>
                  <p>
                    <strong>Dimanche :</strong> Fermé
                  </p>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#B8860B] font-serif">Envoyez-nous un message</h2>

              <form className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
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
                      Nom *
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
                    Email *
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
                    Téléphone
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
                    Service concerné
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sélectionnez un service</option>
                    <option value="fret">Fret maritime et aérien</option>
                    <option value="commerce">Commerce général</option>
                    <option value="conditionnement">Conditionnement des colis</option>
                    <option value="dedouanement">Dédouanement</option>
                    <option value="negoce">Négoce</option>
                    <option value="demenagement">Déménagement international</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Décrivez votre demande..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
                >
                  Envoyer le message
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
