import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {Countdown} from "@/components/countdown/Countdown"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  Boxes,
  Clock3,
  FileCheck,
  FileSignature,
  Handshake,
  Headset,
  Layers,
  MessageSquare,
  PackageCheck,
  Radar,
  Search,
  Ship,
  ShieldCheck,
  Warehouse,
} from "lucide-react"

const SERVICES = [
  {
    id: "fret",
    icon: Ship,
    title: "Fret maritime et aérien",
    description:
      "Expédition de colis et de marchandises entre l'Europe et le Cameroun, par voie maritime ou aérienne selon vos besoins.",
    benefit: "4 départs par mois depuis le port d'Anvers.",
    image: "/images/fret-maritime-aerien.png",
  },
  {
    id: "dedouanement",
    icon: FileCheck,
    title: "Dédouanement véhicules, conteneurs et marchandises",
    description:
      "Assistance à l'achat de véhicules, mise en relation avec des déclarants agréés, suivi, dédouanement et acheminement.",
    benefit: "Pour la diaspora comme pour les résidents en Afrique.",
    image: "/images/dedouanement-vehicules-updated.png",
  },
  {
    id: "negoce",
    icon: Handshake,
    title: "Négoce",
    description:
      "Danemo met en relation les PME africaines avec des fournisseurs de qualité en Europe pour développer leurs affaires.",
    benefit: "Un réseau de fournisseurs identifiés et fiables.",
    image: "/images/entreprises-africaines-bureau.png",
  },
  {
    id: "demenagement",
    icon: Boxes,
    title: "Déménagement international",
    description:
      "Conditionnement professionnel de meubles, machines et équipements, puis expédition sécurisée en conteneur.",
    benefit: "Pour particuliers, entreprises et ambassades.",
    image: "/images/demenagement-couple-moderne.png",
  },
]

const JOURNEY = [
  { icon: MessageSquare, title: "Prise de contact", description: "Vous exposez votre projet à Danemo." },
  { icon: Headset, title: "Écoute du besoin", description: "Nous analysons votre situation pour cerner le besoin réel." },
  { icon: FileSignature, title: "Proposition adaptée", description: "Nous vous orientons vers le service adapté et établissons un devis." },
  { icon: PackageCheck, title: "Préparation", description: "Conditionnement des biens et préparation des formalités." },
  { icon: Ship, title: "Expédition", description: "Acheminement par voie maritime ou aérienne, ou après dédouanement." },
  { icon: Radar, title: "Suivi", description: "Vous recevez des informations claires et honnêtes à chaque étape." },
]

const WHY_DANEMO = [
  { icon: Award, title: "Plus de 5 ans d'expérience", description: "Un interlocuteur installé sur l'axe Europe – Afrique, qui connaît les réalités du terrain." },
  { icon: Layers, title: "Une offre complète", description: "Négoce, fret, dédouanement et déménagement sous un même toit, avec un seul interlocuteur." },
  { icon: ShieldCheck, title: "Un réseau structuré", description: "Fournisseurs de qualité et déclarants agréés, déjà identifiés pour vous." },
  { icon: Clock3, title: "Le respect des délais", description: "Un engagement central, pour une meilleure prévisibilité de votre réception." },
  { icon: Headset, title: "Une écoute réelle", description: "Chaque situation est étudiée pour une réponse adaptée, pas une offre standardisée." },
  { icon: Warehouse, title: "Un entrepôt de 500 m²", description: "Une équipe dédiée à la réception, au conditionnement et au dispatching de vos colis au Cameroun." },
]

const ROUTES = [
  { from: "France", to: "Cameroun" },
  { from: "Luxembourg", to: "Cameroun" },
  { from: "Belgique", to: "Cameroun" },
  { from: "Pays-Bas", to: "Cameroun" },
  { from: "Allemagne", to: "Cameroun" },
]

const FAQS = [
  {
    q: "Que fait Danemo ?",
    a: "Danemo SRL est un partenaire de l'import-export de marchandises et de l'acheminement de colis entre l'Europe et l'Afrique. L'entreprise propose quatre services : le négoce, le fret maritime et aérien, le dédouanement de véhicules, conteneurs et marchandises, et le déménagement international.",
  },
  {
    q: "Depuis combien de temps Danemo est-elle active ?",
    a: "L'équipe de Danemo accompagne ses clients depuis plus de cinq ans sur l'axe Europe – Afrique.",
  },
  {
    q: "Puis-je envoyer un colis personnel à ma famille ?",
    a: "Oui. Le service de fret maritime et aérien s'adresse aussi bien aux particuliers qu'aux entreprises, et répond directement au besoin de la diaspora d'envoyer des colis à ses proches.",
  },
  {
    q: "Quelle est la différence entre le fret maritime et le fret aérien ?",
    a: "Danemo propose les deux voies d'acheminement : la voie maritime convient aux volumes importants, la voie aérienne aux envois où la rapidité prime. Le choix se fait selon vos besoins et préférences.",
  },
  {
    q: "Quel est le tarif du fret maritime ?",
    a: "Le tarif du fret maritime est proposé à partir de 600 €/m³. Le tarif définitif peut dépendre des caractéristiques de l'expédition. Retrouvez le détail sur notre page Tarifs.",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: "À titre indicatif, comptez environ 3 semaines après le départ du conteneur du port d'Anvers. Danemo organise 4 départs par mois. Ce délai peut varier selon les conditions portuaires et douanières.",
  },
  {
    q: "Danemo peut-elle m'aider à acheter un véhicule et à le dédouaner ?",
    a: "Oui. L'entreprise propose une assistance à l'achat de véhicules, met le client en relation avec des déclarants agréés, et prend en charge le dédouanement ainsi que l'acheminement.",
  },
  {
    q: "Danemo peut-elle m'aider à trouver un fournisseur ?",
    a: "Oui. Le service de négoce positionne Danemo comme intermédiaire entre les PME africaines et des fournisseurs de qualité en Europe.",
  },
  {
    q: "Comment puis-je suivre mon envoi ?",
    a: "Danemo assure le suivi des commandes dans le cadre de ses services, avec des informations transmises à chaque étape. Utilisez votre numéro de suivi sur notre page dédiée.",
  },
  {
    q: "Comment vous contacter ?",
    a: "Par téléphone ou e-mail depuis la Belgique (+32 488 64 51 83, info@danemo.be), ou directement auprès de nos bureaux de Yaoundé et Douala au Cameroun. Retrouvez toutes les coordonnées sur notre page Contact.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* 01 — Hero */}
      <section className="relative flex items-center min-h-[88vh] overflow-hidden bg-[#0d0f11]">
        <div className="absolute inset-0">
          <Image
            src="/images/services-fret.webp"
            alt="Navire porte-conteneurs en pleine mer"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f11] via-[#0d0f11]/70 to-[#0d0f11]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f11]/80 via-[#0d0f11]/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 w-full">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-orange-300 text-xs font-semibold tracking-wide uppercase px-4 py-1.5 rounded-full backdrop-blur-sm">
              Depuis plus de 5 ans · Europe → Cameroun
            </span>

            <h1 className="text-balance mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
              Vos expéditions entre l&apos;Europe et le Cameroun, prises en main de bout en bout.
            </h1>

            <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-xl">
              Fret maritime et aérien, dédouanement, négoce et déménagement international : Danemo accompagne
              particuliers, entreprises et diaspora avec un seul interlocuteur, de la prise en charge à la livraison.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <Link
                href="/contactez-nous"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-7 py-3.5 rounded-full transition-colors shadow-lg shadow-orange-600/30"
              >
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-full backdrop-blur-sm transition-colors"
              >
                Découvrir nos services
              </Link>
            </div>

            <p className="mt-8 italic text-gray-400 text-sm">
              &laquo; Rapprocher plus vite l&apos;Afrique de la diaspora. &raquo;
            </p>
          </div>
        </div>
      </section>

      {/* 02 — Trust strip */}
      <section className="bg-[#14171a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-white/10 md:divide-y-0 md:divide-x">
            {[
              { value: "+5 ans", label: "d'expérience sur l'axe Europe – Afrique" },
              { value: "4 départs", label: "maritimes par mois depuis Anvers" },
              { value: "~3 semaines", label: "délai indicatif après le départ" },
              { value: "500 m²", label: "d'entrepôt au Cameroun" },
            ].map((stat) => (
              <div key={stat.label} className="py-8 px-4 md:px-6 text-center md:text-left">
                <p className="text-2xl md:text-3xl font-extrabold text-orange-500">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-400 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — À propos */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div>
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">À propos de Danemo</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                  Un partenaire logistique unique, entre l&apos;Europe et l&apos;Afrique.
                </h2>
                <p className="mt-6 text-gray-600 leading-relaxed">
                  Danemo SRL accompagne les particuliers, les entreprises et la diaspora africaine dans leurs
                  expéditions, leurs échanges commerciaux et leurs projets d&apos;installation, en s&apos;appuyant sur
                  son expertise et son réseau. Envoyer un colis à ses proches n&apos;est pas qu&apos;une démarche
                  logistique : c&apos;est une manière de rester présent malgré la distance.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Des déclarants agréés spécialisés dans le dédouanement de véhicules et conteneurs.",
                    "Une équipe dédiée au conditionnement des colis, avec la sécurité comme priorité.",
                    "Un entrepôt de 500 m² au Cameroun pour la réception et le stockage.",
                    "Une équipe spécialisée dans le dépotage et le dispatching des colis.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-gray-700">
                      <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="/images/conteneurs-colorés-final-new.png"
                  alt="Conteneurs Danemo prêts pour l'expédition"
                  fill
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 04 — Services */}
      <section id="services" className="py-20 md:py-28 bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Nos services</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Quatre domaines d&apos;expertise, un seul interlocuteur.
              </h2>
            </div>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, i) => (
              <Reveal key={service.id} delay={i * 80}>
                <Link
                  href={`/services#${service.id}`}
                  className="group flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3]">
                    <Image src={service.image} alt={service.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-[#14171a] leading-snug">{service.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">{service.description}</p>
                    <p className="mt-3 text-xs font-medium text-orange-700">{service.benefit}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 group-hover:gap-2.5 transition-all">
                      Découvrir
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — Comment ça fonctionne */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Comment ça fonctionne</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Un parcours clair, à chaque étape.
              </h2>
            </div>
          </Reveal>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-4">
            {JOURNEY.map((step, i) => (
              <Reveal key={step.title} delay={i * 70}>
                <div className="relative text-center lg:text-left">
                  <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-0">
                    <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="lg:mt-4">
                      <p className="text-xs font-semibold text-orange-600">Étape {i + 1}</p>
                      <h3 className="font-bold text-[#14171a] mt-0.5">{step.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — Zones desservies */}
      <section className="relative py-20 md:py-28 bg-[#14171a] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/port-conteneurs-grues.png" alt="" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#14171a] via-[#14171a]/95 to-[#14171a]/70" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Zones desservies</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight text-balance">
                Cinq pays de départ, une destination : le Cameroun.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {ROUTES.map((route) => (
                <div
                  key={route.from}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <p className="text-white font-semibold">{route.from}</p>
                  <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
                    <span className="h-px flex-1 bg-gray-600" />
                    <ArrowRight className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  </div>
                  <p className="mt-2 text-orange-400 font-semibold">{route.to}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-10 text-center text-gray-400 text-sm">
              Livraison sur les zones de Douala et Yaoundé · Départs depuis le port d&apos;Anvers
            </p>
          </Reveal>
        </div>
      </section>

      {/* 07 — Tarifs */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-10 md:p-14 text-center">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Tarifs</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Fret maritime à partir de 600 €/m³.
              </h2>
              <p className="mt-4 text-gray-600 max-w-xl mx-auto leading-relaxed">
                Le tarif définitif dépend des caractéristiques de votre expédition. Retrouvez nos tarifs indicatifs par
                article ou demandez un devis personnalisé.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/tarifs"
                  className="inline-flex items-center justify-center gap-2 bg-[#14171a] hover:bg-[#14171a]/90 text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
                >
                  Voir les tarifs
                </Link>
                <Link
                  href="/contactez-nous"
                  className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
                >
                  Demander un devis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 08 — Suivi d'expédition */}
      <section className="py-20 md:py-28 bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-10 items-center bg-white rounded-3xl border border-gray-200 p-10 md:p-14 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Suivi d&apos;expédition</p>
                <h2 className="text-3xl font-extrabold text-[#14171a] tracking-tight text-balance">
                  Suivez votre colis en temps réel.
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Entrez votre numéro de suivi pour connaître l&apos;état de votre expédition, à chaque étape, avec
                  des informations claires et honnêtes.
                </p>
                <Link
                  href="/tracking"
                  className="mt-7 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Suivre mon envoi
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm bg-[#faf9f7] border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <Search className="w-4 h-4" />
                    <span className="text-sm">Ex : DN2024001234</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {["Prise en charge", "En transit", "Arrivé au port", "Livré"].map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-orange-600" : "bg-gray-300"}`} />
                        <span className="text-sm text-gray-500">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 09 — Pourquoi Danemo */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Pourquoi Danemo</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Une relation de confiance, fondée sur des engagements concrets.
              </h2>
            </div>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_DANEMO.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className="h-full p-7 rounded-2xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-orange-600 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mt-5 font-bold text-[#14171a]">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10 — Témoignages */}
      <section className="py-20 md:py-28 bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Témoignages</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Ce que nos clients en disent.
              </h2>
            </div>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              "https://www.youtube-nocookie.com/embed/L1e6I_c57jI",
              "https://www.youtube-nocookie.com/embed/46S7xTtEFaM",
              "https://www.youtube-nocookie.com/embed/M1l--qBwoCk",
            ].map((src, i) => (
              <Reveal key={src} delay={i * 90}>
                <div className="aspect-video rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                  <iframe
                    src={src}
                    className="w-full h-full"
                    title={`Témoignage client Danemo ${i + 1}`}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11 — FAQ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Questions fréquentes</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Tout ce qu&apos;il faut savoir avant de vous lancer.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <Accordion type="single" collapsible className="mt-12">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* 12 — CTA final avec compte à rebours */}
      
      <section className="relative py-24 md:py-32 bg-[#14171a] overflow-hidden">
        
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
              Votre prochaine expédition commence ici.
            </h2>
            <p className="mt-5 text-gray-400 text-lg max-w-xl mx-auto">
              Parlez-nous de votre projet, quel que soit le service concerné : notre équipe vous propose une solution
              adaptée sous peu.
            </p>

            {/* Compte à rebours DANEMO */}
            <div className="mt-10">
              <Countdown />
            </div>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contactez-nous"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-full transition-colors shadow-lg shadow-orange-600/30"
              >
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:+32488645183"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-full backdrop-blur-sm transition-colors"
              >
                +32 488 64 51 83
              </a>
            </div>
          </Reveal>
        </div>

      </section>

      <Footer />
    </div>
  )
}
