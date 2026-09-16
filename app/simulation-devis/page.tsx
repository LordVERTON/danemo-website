"use client"

import Footer from "@/components/footer";
import Header from "@/components/header";
import { Reveal } from "@/components/reveal";
import VolumeCalculator from "@/components/VolumeCalculator";
import He from "zod/v4/locales/he.js";

export default function SimulationDevisPage() {
    return (
        <div className = "min-h-screen bg-white" >
            <Header />
            
            <main>
                <section className = "bg-[#14171a] pt-20 pb-16" >
                    <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                        <Reveal>
                        <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Simulation de devis</p>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                            Simulez votre devis de fret maritime
                        </h1>

                        <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                            Expédiez vos marchandises vers le Cameroun en toute simplicité.
                            Renseignez le volume et la destination de votre envoi maritime.
                            Obtenez une estimation personnalisée adaptée à votre besoin.

                        </p>
                        </Reveal>
                    </div>
                </section>

                <section className="bg-white py-16 md:py-24">
                    <Reveal>
                        <div className="max-w-4xl mx-auto px-6 lg:px-8">
                            <VolumeCalculator/>
                        </div>
                    </Reveal>
                </section>
            </main>

            <Footer />
        </div>
    )
}