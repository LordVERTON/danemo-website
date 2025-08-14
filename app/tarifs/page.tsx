import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function TarifsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8 font-serif text-[#B8860B]">Tarifs</h1>

          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Les prix indiqués ci-dessous peuvent varier en fonction de la valeur marchande des colis
          </p>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-12">
            <div className="divide-y divide-gray-200">
              {/* Cantines */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">{"Canapé 2 place\ns à partir de"}</span>
                <span className="font-semibold text-gray-900">250 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Canapé 3 places à partir de</span>
                <span className="font-semibold text-gray-900">350 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Canapé d'angle à partir de</span>
                <span className="font-semibold text-gray-900">350 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Cantine 100 cm</span>
                <span className="font-semibold text-gray-900">140 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Cantine 80/90 cm</span>
                <span className="font-semibold text-gray-900">125 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Carreaux (prix par palette)</span>
                <span className="font-semibold text-gray-900"> {"700 €/㎥"}</span>
              </div>

              {/* Congélateurs */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">{"Congélateur + de 500 litres, à partir de"}</span>
                <span className="font-semibold text-gray-900">550 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Congélateur 150 - 250 litres à partir de</span>
                <span className="font-semibold text-gray-900">275 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Congélateur 251 - 490 litres à partir de</span>
                <span className="font-semibold text-gray-900">350 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Cuisinière + de 4 foyers, à partir de</span>
                <span className="font-semibold text-gray-900"> 175 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Cuisinière - de 4 foyers, à partir de</span>
                <span className="font-semibold text-gray-900">160 €</span>
              </div>

              {/* Autres articles */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Fût Orange: prix de vente vide</span>
                <span className="font-semibold text-gray-900">30 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Fût Orange 220 L</span>
                <span className="font-semibold text-gray-900">170 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Groupe électrogène, à partir de</span>
                <span className="font-semibold text-gray-900">220 €</span>
              </div>

              {/* Lave-linge */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Lave - linge - de 10 kg</span>
                <span className="font-semibold text-gray-900">180 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Lave - linge 6 - 10 kg</span>
                <span className="font-semibold text-gray-900">165 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Matelas, à partir de</span>
                <span className="font-semibold text-gray-900">100 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Micro-ondes standard</span>
                <span className="font-semibold text-gray-900">40 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Moteur véhicule, à partir de</span>
                <span className="font-semibold text-gray-900">400 €</span>
              </div>

              {/* Réfrigérateurs */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Réfrigérateur 140 cm, à partir de</span>
                <span className="font-semibold text-gray-900">220 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Réfrigérateur 170 cm, à partir de</span>
                <span className="font-semibold text-gray-900">280 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Réfrigérateur 190 cm, à partir de</span>
                <span className="font-semibold text-gray-900">310 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Réfrigérateur Américain, à partir de</span>
                <span className="font-semibold text-gray-900">400 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Réfrigérateur de chambre, à partir de</span>
                <span className="font-semibold text-gray-900">120 €</span>
              </div>

              {/* Salon et téléviseurs */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Salon complet (canapé 2/3 places et table basse)</span>
                <span className="font-semibold text-gray-900">800 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Téléviseur jusqu'à 30 pouces</span>
                <span className="font-semibold text-gray-900">100 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Téléviseur jusqu'à 40 pouces</span>
                <span className="font-semibold text-gray-900">150 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Téléviseur 50 pouces et +, à partir de</span>
                <span className="font-semibold text-gray-900">300 €</span>
              </div>

              {/* Vélos */}
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Vélo adulte</span>
                <span className="font-semibold text-gray-900">75 €</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 hover:bg-gray-50">
                <span className="text-gray-800">Vélo enfant</span>
                <span className="font-semibold text-gray-900">{"35 €"}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-center text-gray-600 mb-8">
              Le colis que vous souhaitez envoyer ne fait pas partie de la liste ci-dessus, envoyez nous un mail pour
              demande de devis
            </p>

            <form className="max-w-md mx-auto space-y-6">
              <div>
                <Input placeholder="Nom et prénom" className="w-full" />
              </div>

              <div>
                <Input type="email" placeholder="Adresse e-mail" className="w-full" />
              </div>

              <div>
                <Input placeholder="N° de téléphone" className="w-full" />
              </div>

              <div>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Objet</option>
                  <option>Demande de devis</option>
                  <option>Information générale</option>
                  <option>Suivi de colis</option>
                </select>
              </div>

              <div>
                <Textarea placeholder="Message" rows={4} className="w-full" />
              </div>

              <div className="text-center">
                <Button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2 rounded-md">
                  Soumettre
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
