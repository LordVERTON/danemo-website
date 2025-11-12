export type Lang = "fr" | "en"

type TranslationPathValue = string | string[] | TranslationRecord

interface TranslationRecord {
  [key: string]: TranslationPathValue | undefined
}

export type TranslationSchema = {
  languageSwitcher: {
    button: string
    ariaLabel: string
  }
  header: {
    openHours: string
    contact: {
      email: string
      phone: string
    }
    nav: {
      home: string
      services: string
      rates: string
      contact: string
      tracking: string
      blog: string
    }
  }
  footer: {
    copyright: string
  }
  home: {
    hero: {
      title: string
      subtitle: string
    }
    about: {
      title: string
      paragraphs: string[]
      bulletPoints: string[]
      highlights: string[]
    }
    nextDeparture: {
      title: string
      items: { label: string; value: string }[]
    }
    services: {
      title: string
      cards: {
        key: string
        href: string
        image: string
        alt: string
        title: string
        description: string
      }[]
    }
    testimonials: {
      title: string
    }
    contact: {
      brussels: {
        title: string
        addressLines: string[]
        phone: string
      }
      cameroon: {
        title: string
        locations: { title: string; phone: string }[]
      }
    }
  }
  services: {
    title: string
    sections: {
      freight: {
        title: string
        description: string
      }
      commerce: {
        title: string
        intro: string
        items: string[]
      }
      packaging: {
        title: string
        description: string
      }
      customs: {
        title: string
        description: string
      }
      trading: {
        title: string
        description: string
      }
      moving: {
        title: string
        description: string
      }
    }
  }
  rates: {
    title: string
    description: string
    items: { label: string; price: string }[]
    quoteRequest: {
      title: string
      description: string
      form: {
        name: string
        email: string
        phone: string
        subject: string
        subjectOptions: string[]
        message: string
        submit: string
      }
    }
  }
  contactPage: {
    title: string
    subtitle: string
    offices: {
      title: string
      brussels: {
        title: string
        address: string
        phone: string
        email: string
      }
      cameroon: {
        title: string
        address: string
        phone: string
        email: string
      }
    }
    hours: {
      title: string
      weekdays: string
      saturday: string
      sunday: string
    }
    form: {
      title: string
      firstName: string
      lastName: string
      email: string
      phone: string
      service: string
      serviceOptions: string[]
      message: string
      messagePlaceholder: string
      submit: string
    }
    info: {
      title: string
      description: string
      warehouse: string
    }
  }
  contactForm: {
    title: string
    subtitle: string
    form: {
      name: string
      email: string
      subject: string
      message: string
      submit: string
    }
    info: {
      title: string
      description: string
      hours: string
      warehouse: string
      phone: string
      email: string
    }
  }
  tracking: {
    title: string
    subtitle: string
    search: {
      placeholder: string
      button: string
      label: string
    }
    errors: {
      notFound: string
      generic: string
    }
    order: {
      title: string
      clientInfo: string
      shipmentDetails: string
      currentStatus: string
      lastUpdate: string
    }
    container: {
      title: string
      description: string
      copy: string
      follow: string
      vessel: string
      departure: string
      arrival: string
      etd: string
      eta: string
    }
    events: {
      title: string
      description: string
      empty: string
    }
    help: {
      title: string
      description: string
      example: string
    }
    status: {
      pending: string
      confirmed: string
      in_progress: string
      completed: string
      cancelled: string
    }
    containerStatus: {
      planned: string
      departed: string
      in_transit: string
      arrived: string
      delivered: string
      delayed: string
    }
  }
}

export const translations: Record<Lang, TranslationSchema> = {
  fr: {
    languageSwitcher: {
      button: "EN",
      ariaLabel: "Passer le site en anglais",
    },
    header: {
      openHours: "Nous sommes ouverts du Lun - Sam 9h- 18h",
      contact: {
        email: "info@danemo.be",
        phone: "+32488645183",
      },
      nav: {
        home: "Accueil",
        services: "Services",
        rates: "Tarifs",
        contact: "Contactez-nous",
        tracking: "Tracking",
        blog: "Blog",
      },
    },
    footer: {
      copyright: "© 2025 Danemo Srl. Tous droits réservés.",
    },
    home: {
      hero: {
        title: "Transit entre Bruxelles - Douala- Yaoundé",
        subtitle: "\"Rapprocher plus vite l'Afrique de la Diaspora\"",
      },
      about: {
        title: "À propos",
        paragraphs: [
          "Crée en Juin 2021, Danemo Srl est une entreprise de transport international qui s'occupe de l'envoi des colis de toute nature entre l'Europe et le Cameroun.",
          "Nous sommes spécialisés dans le réception, le reconditionnement, le transport et le dédouanement de vos marchandises, véhicules, effets personnels et autres.",
          "Pour tous vos besoins, nous mettons à votre disposition :",
        ],
        bulletPoints: [
          "Des déclarants agrées et spécialisés dans le dédouanent des véhicules et conteneur.",
          "Une équipe spécialisée dans le conditionnement des colis mettant ainsi un point d'honneur sur leur sécurité.",
          "Un grand entrepôt de 500 m carré au Cameroun qui sert à stocker vos colis.",
          "Une équipe spécialisé au dépotage et dispatching des dits colis.",
        ],
        highlights: [
          "Nous vous rassurons de la sécurité de vos envois et d'un délai de livraison de 1 mois maximum après confirmation du départ du bateau.",
          "Nous organisons un chargement tous les 2 semaines pour satisfaire la demande.",
        ],
      },
      nextDeparture: {
        title: "Prochain départ",
        items: [
          { label: "Date de départ :", value: "À confirmer" },
          { label: "Date d'arrivée prévue :", value: "À confirmer" },
          { label: "Statut du chargement :", value: "En préparation" },
        ],
      },
      services: {
        title: "Nos activités",
        cards: [
          {
            key: "freight",
            href: "/services",
            image: "/images/fret-maritime-aerien.png",
            alt: "Fret maritime et aérien",
            title: "Fret maritime et aérien",
            description: "Nous vous offrons le transport maritime et aérien.",
          },
          {
            key: "commerce",
            href: "/services",
            image: "/images/services-commerce.webp",
            alt: "Commerce général",
            title: "Commerce général",
            description: "Nous vendons dans nos magasins au Cameroun plusieurs produits.",
          },
          {
            key: "customs",
            href: "/services",
            image: "/images/dedouanement-vehicules-updated.png",
            alt: "Dédouanement",
            title: "Dédouanement véhicules, Conteneur et Marchandises",
            description: "Nous effectuons vos procédures de dédouanement de voiture au Cameroun.",
          },
          {
            key: "trading",
            href: "/services",
            image: "/images/negoce.png",
            alt: "Négoce",
            title: "Négoce",
            description: "Nous mettons en contact les petites et moyennes entreprises avec les fournisseurs.",
          },
          {
            key: "moving",
            href: "/services",
            image: "/images/demenagement-international.png",
            alt: "Déménagement",
            title: "Déménagement",
            description: "Danemo mets à la disposition des personnes désireuse déménager pour l'étranger, le conteneur et autres.",
          },
          {
            key: "handling",
            href: "/services",
            image: "/images/conditionnement-colis-updated.png",
            alt: "Manutention",
            title: "Manutention",
            description: "Nous disposons d'un grand entrepôt pour la réception de colis et véhicules à destination de l'Afrique.",
          },
        ],
      },
      testimonials: {
        title: "Témoignages",
      },
      contact: {
        brussels: {
          title: "Contact à Bruxelles",
          addressLines: [
            "Danemo Srl",
            "Avenue du port 108 - 110, 1000 Bruxelles",
            "Kai 299 porte 2.60",
            "info@danemo.be",
            "+32488645183",
          ],
          phone: "+32488645183",
        },
        cameroon: {
          title: "Contact au Cameroun",
          locations: [
            {
              title: "YAOUNDE : Biyem-assi Tam-Tam Week-end",
              phone: "Tel : +237690262004",
            },
            {
              title: "DOUALA : Youpwe",
              phone: "Tel : +237655512598",
            },
          ],
        },
      },
    },
    services: {
      title: "Services",
      sections: {
        freight: {
          title: "Fret maritime et Aérien",
          description:
            "Nous sommes spécialisés dans le transport de vos colis vers le Cameroun, mais recevons vos colis, après conditionnement, les voila sont transportés et livrés dans un délai moyen d'un mois.",
        },
        commerce: {
          title: "Commerce général",
          intro: "Nous vendons dans nos magasins au Cameroun :",
          items: [
            "Produits de bureau (rame de papiers...)",
            "Électroménager (frigos, micro-ondes, télévisions, ventilateurs, Mixeurs, fer repassé...)",
            "Les produits d'hygiène",
            "Ustensiles de cuisine (marmites, couverts, poêles...)",
          ],
        },
        packaging: {
          title: "Conditionnement des colis",
          description:
            "Conscient qu'un bon emballage garantit à 90% la sécurité d'un colis, Danemo met à la disposition des clients un service approprié pour le conditionnement des colis.",
        },
        customs: {
          title: "Dédouanement Véhicules, Conteneurs et Marchandises",
          description:
            "Dans le souci d'aider la diaspora, Danemo a mis sur pieds un service de aide dans l'achat des véhicules, facilite sa procédure de dédouanement en mettant à disposition des clients des déclarants agréés, en outre Danemo Srl fait le suivi des commandes de marchandises, dédouane et les achemine pour des clients qui résident en Afrique ou dans la diaspora.",
        },
        trading: {
          title: "Négoce",
          description:
            "Danemo mets en contact les petites et moyennes entreprise avec les fournisseurs pour faciliter l'achat et le transport des marchandises et matières premières.",
        },
        moving: {
          title: "Déménagement international",
          description:
            "Danemo mets à la disposition des personnes désireuses déménager à l'étranger, le conteneur et un service spécialisé dans le déménagement international des meubles, le conditionnement et le chargement dans le conteneur.",
        },
      },
    },
    rates: {
      title: "Tarifs",
      description: "Les prix indiqués ci-dessous peuvent varier en fonction de la valeur marchande des colis",
      items: [
        { label: "Canapé 2 places à partir de", price: "250 €" },
        { label: "Canapé 3 places à partir de", price: "350 €" },
        { label: "Canapé d'angle à partir de", price: "350 €" },
        { label: "Cantine 100 cm", price: "140 €" },
        { label: "Cantine 80/90 cm", price: "125 €" },
        { label: "Carreaux (prix par palette)", price: "700 €/㎥" },
        { label: "Congélateur + de 500 litres, à partir de", price: "550 €" },
        { label: "Congélateur 150 - 250 litres à partir de", price: "275 €" },
        { label: "Congélateur 251 - 490 litres à partir de", price: "350 €" },
        { label: "Cuisinière + de 4 foyers, à partir de", price: "175 €" },
        { label: "Cuisinière - de 4 foyers, à partir de", price: "160 €" },
        { label: "Fût Orange: prix de vente vide", price: "30 €" },
        { label: "Fût Orange 220 L", price: "170 €" },
        { label: "Groupe électrogène, à partir de", price: "220 €" },
        { label: "Lave - linge - de 10 kg", price: "180 €" },
        { label: "Lave - linge 6 - 10 kg", price: "165 €" },
        { label: "Matelas, à partir de", price: "100 €" },
        { label: "Micro-ondes standard", price: "40 €" },
        { label: "Moteur véhicule, à partir de", price: "400 €" },
        { label: "Réfrigérateur 140 cm, à partir de", price: "220 €" },
        { label: "Réfrigérateur 170 cm, à partir de", price: "280 €" },
        { label: "Réfrigérateur 190 cm, à partir de", price: "310 €" },
        { label: "Réfrigérateur Américain, à partir de", price: "400 €" },
        { label: "Réfrigérateur de chambre, à partir de", price: "120 €" },
        { label: "Salon complet (canapé 2/3 places et table basse)", price: "800 €" },
        { label: "Téléviseur jusqu'à 30 pouces", price: "100 €" },
        { label: "Téléviseur jusqu'à 40 pouces", price: "150 €" },
        { label: "Téléviseur 50 pouces et +, à partir de", price: "300 €" },
        { label: "Vélo adulte", price: "75 €" },
        { label: "Vélo enfant", price: "35 €" },
      ],
      quoteRequest: {
        title: "",
        description: "Le colis que vous souhaitez envoyer ne fait pas partie de la liste ci-dessus, envoyez nous un mail pour demande de devis",
        form: {
          name: "Nom et prénom",
          email: "Adresse e-mail",
          phone: "N° de téléphone",
          subject: "Objet",
          subjectOptions: ["Objet", "Demande de devis", "Information générale", "Suivi de colis"],
          message: "Message",
          submit: "Soumettre",
        },
      },
    },
    contactPage: {
      title: "Contactez-nous",
      subtitle: "N'hésitez pas à nous contacter pour tout renseignement complémentaire",
      offices: {
        title: "Nos Bureaux",
        brussels: {
          title: "Bruxelles, Belgique",
          address: "Rue de la Loi 123\n1000 Bruxelles, Belgique",
          phone: "+32 488 645 183",
          email: "info@danemo.be",
        },
        cameroon: {
          title: "Douala, Cameroun",
          address: "Boulevard de la Liberté\nDouala, Cameroun",
          phone: "+237 123 456 789",
          email: "cameroun@danemo.be",
        },
      },
      hours: {
        title: "Horaires d'ouverture",
        weekdays: "Lundi - Vendredi : 9h00 - 18h00",
        saturday: "Samedi : 9h00 - 14h00",
        sunday: "Dimanche : Fermé",
      },
      form: {
        title: "Envoyez-nous un message",
        firstName: "Prénom *",
        lastName: "Nom *",
        email: "Email *",
        phone: "Téléphone",
        service: "Service concerné",
        serviceOptions: [
          "Sélectionnez un service",
          "Fret maritime et aérien",
          "Commerce général",
          "Conditionnement des colis",
          "Dédouanement",
          "Négoce",
          "Déménagement international",
        ],
        message: "Message *",
        messagePlaceholder: "Décrivez votre demande...",
        submit: "Envoyer le message",
      },
      info: {
        title: "",
        description: "",
        warehouse: "",
      },
    },
    contactForm: {
      title: "Contactez-nous",
      subtitle: "N'hésitez pas à nous contacter pour tout renseignement complémentaire",
      form: {
        name: "Votre nom et prénom :",
        email: "Adresse e-mail :",
        subject: "Sujet :",
        message: "Message :",
        submit: "Soumettre",
      },
      info: {
        title: "Message",
        description:
          "Nous serons heureux de répondre à toutes vos questions. Contactez-nous par téléphone ou par mail et n'hésitez pas à venir nous rendre visite dans nos entrepôts.",
        hours: "Horaires : Lun - Sam : 09h - 18h",
        warehouse: "Entrepôt : Avenue du port 108 - 110, 1000 Bruxelles, kai 299 - porte 2.60",
        phone: "Tél :",
        email: "Mail :",
      },
    },
    tracking: {
      title: "Suivi de colis",
      subtitle: "Suivez votre expédition en temps réel avec votre numéro de suivi",
      search: {
        placeholder: "Ex: DN2024001234",
        button: "Rechercher",
        label: "Numéro de suivi",
      },
      errors: {
        notFound: "Aucune commande trouvée avec ce numéro de suivi",
        generic: "Erreur lors de la recherche",
      },
      order: {
        title: "Informations client",
        clientInfo: "Informations client",
        shipmentDetails: "Détails de l'expédition",
        currentStatus: "Statut actuel",
        lastUpdate: "Dernière mise à jour",
      },
      container: {
        title: "Conteneur associé",
        description: "Informations sur le conteneur affecté à votre expédition.",
        copy: "Copier",
        follow: "Suivre le conteneur",
        vessel: "Navire",
        departure: "Départ",
        arrival: "Arrivée",
        etd: "ETD:",
        eta: "ETA:",
      },
      events: {
        title: "Historique des événements",
        description: "Suivi détaillé de votre expédition",
        empty: "Aucun événement de suivi disponible pour cette commande",
      },
      help: {
        title: "Comment utiliser le suivi",
        description:
          "Entrez votre numéro de suivi dans le champ ci-dessus pour voir l'état de votre expédition.",
        example: "Votre numéro de suivi se trouve sur votre facture ou dans l'email de confirmation.\nExemple de format: DN2024001234",
      },
      status: {
        pending: "En attente",
        confirmed: "Confirmée",
        in_progress: "En cours",
        completed: "Terminée",
        cancelled: "Annulée",
      },
      containerStatus: {
        planned: "Planifié",
        departed: "Départ confirmé",
        in_transit: "En transit",
        arrived: "Arrivé",
        delivered: "Livré",
        delayed: "Retard",
      },
    },
  },
  en: {
    languageSwitcher: {
      button: "FR",
      ariaLabel: "Switch the website to French",
    },
    header: {
      openHours: "We are open Mon - Sat 9am - 6pm",
      contact: {
        email: "info@danemo.be",
        phone: "+32488645183",
      },
      nav: {
        home: "Home",
        services: "Services",
        rates: "Rates",
        contact: "Contact us",
        tracking: "Tracking",
        blog: "Blog",
      },
    },
    footer: {
      copyright: "© 2025 Danemo Srl. All rights reserved.",
    },
    home: {
      hero: {
        title: "Transit between Brussels - Douala - Yaoundé",
        subtitle: '"Bringing Africa and the Diaspora closer, faster"',
      },
      about: {
        title: "About",
        paragraphs: [
          "Founded in June 2021, Danemo Srl is an international transport company that handles shipments of all kinds between Europe and Cameroon.",
          "We specialise in receiving, repackaging, transporting and clearing your goods, vehicles, personal belongings and more.",
          "To support every need, we provide:",
        ],
        bulletPoints: [
          "Licensed customs brokers specialised in clearing vehicles and containers.",
          "A dedicated team for parcel preparation, ensuring maximum security for every shipment.",
          "A 500 m² warehouse in Cameroon to store your parcels.",
          "A specialised team for unloading and dispatching your goods.",
        ],
        highlights: [
          "We guarantee the security of your shipments and a delivery time of a maximum of one month after the vessel's departure is confirmed.",
          "We organise a loading every two weeks to meet demand.",
        ],
      },
      nextDeparture: {
        title: "Next departure",
        items: [
          { label: "Departure date:", value: "To be confirmed" },
          { label: "Estimated arrival:", value: "To be confirmed" },
          { label: "Loading status:", value: "In preparation" },
        ],
      },
      services: {
        title: "Our services",
        cards: [
          {
            key: "freight",
            href: "/services",
            image: "/images/fret-maritime-aerien.png",
            alt: "Sea and air freight",
            title: "Sea and air freight",
            description: "We organise maritime and air transport for your shipments.",
          },
          {
            key: "commerce",
            href: "/services",
            image: "/images/services-commerce.webp",
            alt: "General trading",
            title: "General trading",
            description: "We supply our stores in Cameroon with a wide range of products.",
          },
          {
            key: "customs",
            href: "/services",
            image: "/images/dedouanement-vehicules-updated.png",
            alt: "Customs clearance",
            title: "Customs clearance",
            description: "We manage vehicle and container customs procedures on your behalf in Cameroon.",
          },
          {
            key: "trading",
            href: "/services",
            image: "/images/negoce.png",
            alt: "Trade services",
            title: "Brokerage",
            description: "We connect SMEs with trusted suppliers to simplify purchasing and logistics.",
          },
          {
            key: "moving",
            href: "/services",
            image: "/images/demenagement-international.png",
            alt: "International moving",
            title: "International moving",
            description: "We provide containers and tailored support for people moving abroad.",
          },
          {
            key: "handling",
            href: "/services",
            image: "/images/conditionnement-colis-updated.png",
            alt: "Handling",
            title: "Handling",
            description: "We operate a large warehouse to receive parcels and vehicles bound for Africa.",
          },
        ],
      },
      testimonials: {
        title: "Testimonials",
      },
      contact: {
        brussels: {
          title: "Contact in Brussels",
          addressLines: [
            "Danemo Srl",
            "Avenue du port 108 - 110, 1000 Brussels",
            "Kai 299 door 2.60",
            "info@danemo.be",
            "+32488645183",
          ],
          phone: "+32488645183",
        },
        cameroon: {
          title: "Contact in Cameroon",
          locations: [
            {
              title: "YAOUNDE: Biyem-Assi Tam-Tam Week-end",
              phone: "Tel: +237690262004",
            },
            {
              title: "DOUALA: Youpwe",
              phone: "Tel: +237655512598",
            },
          ],
        },
      },
    },
    services: {
      title: "Services",
      sections: {
        freight: {
          title: "Sea and Air Freight",
          description:
            "We specialise in transporting your parcels to Cameroon. We receive your parcels, package them, and then transport and deliver them within an average timeframe of one month.",
        },
        commerce: {
          title: "General Trading",
          intro: "We sell in our stores in Cameroon:",
          items: [
            "Office supplies (reams of paper...)",
            "Household appliances (fridges, microwaves, televisions, fans, blenders, irons...)",
            "Hygiene products",
            "Kitchen utensils (pots, cutlery, pans...)",
          ],
        },
        packaging: {
          title: "Parcel Packaging",
          description:
            "Aware that good packaging guarantees 90% of a parcel's security, Danemo provides customers with an appropriate service for parcel packaging.",
        },
        customs: {
          title: "Customs Clearance for Vehicles, Containers and Goods",
          description:
            "To help the diaspora, Danemo has set up a service to assist with vehicle purchases, facilitates customs clearance procedures by providing customers with licensed customs brokers, and Danemo Srl also tracks merchandise orders, clears customs and ships them for clients residing in Africa or the diaspora.",
        },
        trading: {
          title: "Brokerage",
          description:
            "Danemo connects small and medium-sized businesses with suppliers to facilitate the purchase and transport of goods and raw materials.",
        },
        moving: {
          title: "International Moving",
          description:
            "Danemo provides containers and a specialised service for people wishing to move abroad, including international furniture moving, packaging and container loading.",
        },
      },
    },
    rates: {
      title: "Rates",
      description: "The prices shown below may vary depending on the market value of the parcels",
      items: [
        { label: "2-seater sofa from", price: "€250" },
        { label: "3-seater sofa from", price: "€350" },
        { label: "Corner sofa from", price: "€350" },
        { label: "100 cm storage unit", price: "€140" },
        { label: "80/90 cm storage unit", price: "€125" },
        { label: "Tiles (price per palette)", price: "€700/m³" },
        { label: "Freezer over 500 litres, from", price: "€550" },
        { label: "Freezer 150 - 250 litres from", price: "€275" },
        { label: "Freezer 251 - 490 litres from", price: "€350" },
        { label: "Stove with 4+ burners, from", price: "€175" },
        { label: "Stove with less than 4 burners, from", price: "€160" },
        { label: "Orange drum: empty sale price", price: "€30" },
        { label: "Orange drum 220 L", price: "€170" },
        { label: "Generator, from", price: "€220" },
        { label: "Washing machine under 10 kg", price: "€180" },
        { label: "Washing machine 6 - 10 kg", price: "€165" },
        { label: "Mattress, from", price: "€100" },
        { label: "Standard microwave", price: "€40" },
        { label: "Vehicle engine, from", price: "€400" },
        { label: "140 cm refrigerator, from", price: "€220" },
        { label: "170 cm refrigerator, from", price: "€280" },
        { label: "190 cm refrigerator, from", price: "€310" },
        { label: "American refrigerator, from", price: "€400" },
        { label: "Bedroom refrigerator, from", price: "€120" },
        { label: "Complete living room set (2/3-seater sofa and coffee table)", price: "€800" },
        { label: "TV up to 30 inches", price: "€100" },
        { label: "TV up to 40 inches", price: "€150" },
        { label: "TV 50 inches and above, from", price: "€300" },
        { label: "Adult bicycle", price: "€75" },
        { label: "Children's bicycle", price: "€35" },
      ],
      quoteRequest: {
        title: "",
        description: "The parcel you wish to send is not on the list above, please send us an email to request a quote",
        form: {
          name: "Full name",
          email: "Email address",
          phone: "Phone number",
          subject: "Subject",
          subjectOptions: ["Subject", "Quote request", "General information", "Parcel tracking"],
          message: "Message",
          submit: "Submit",
        },
      },
    },
    contactPage: {
      title: "Contact us",
      subtitle: "Please do not hesitate to contact us for any additional information",
      offices: {
        title: "Our Offices",
        brussels: {
          title: "Brussels, Belgium",
          address: "Rue de la Loi 123\n1000 Brussels, Belgium",
          phone: "+32 488 645 183",
          email: "info@danemo.be",
        },
        cameroon: {
          title: "Douala, Cameroon",
          address: "Boulevard de la Liberté\nDouala, Cameroon",
          phone: "+237 123 456 789",
          email: "cameroun@danemo.be",
        },
      },
      hours: {
        title: "Opening hours",
        weekdays: "Monday - Friday: 9:00 AM - 6:00 PM",
        saturday: "Saturday: 9:00 AM - 2:00 PM",
        sunday: "Sunday: Closed",
      },
      form: {
        title: "Send us a message",
        firstName: "First name *",
        lastName: "Last name *",
        email: "Email *",
        phone: "Phone",
        service: "Service concerned",
        serviceOptions: [
          "Select a service",
          "Sea and air freight",
          "General trading",
          "Parcel packaging",
          "Customs clearance",
          "Brokerage",
          "International moving",
        ],
        message: "Message *",
        messagePlaceholder: "Describe your request...",
        submit: "Send message",
      },
      info: {
        title: "",
        description: "",
        warehouse: "",
      },
    },
    contactForm: {
      title: "Contact us",
      subtitle: "Please do not hesitate to contact us for any additional information",
      form: {
        name: "Your full name:",
        email: "Email address:",
        subject: "Subject:",
        message: "Message:",
        submit: "Submit",
      },
      info: {
        title: "Message",
        description:
          "We will be happy to answer all your questions. Contact us by phone or email and feel free to visit us at our warehouses.",
        hours: "Hours: Mon - Sat: 9am - 6pm",
        warehouse: "Warehouse: Avenue du port 108 - 110, 1000 Brussels, kai 299 - door 2.60",
        phone: "Tel:",
        email: "Email:",
      },
    },
    tracking: {
      title: "Parcel Tracking",
      subtitle: "Track your shipment in real time with your tracking number",
      search: {
        placeholder: "Ex: DN2024001234",
        button: "Search",
        label: "Tracking number",
      },
      errors: {
        notFound: "No order found with this tracking number",
        generic: "Error during search",
      },
      order: {
        title: "Client Information",
        clientInfo: "Client Information",
        shipmentDetails: "Shipment Details",
        currentStatus: "Current Status",
        lastUpdate: "Last Update",
      },
      container: {
        title: "Associated Container",
        description: "Information about the container assigned to your shipment.",
        copy: "Copy",
        follow: "Track this container",
        vessel: "Vessel",
        departure: "Departure",
        arrival: "Arrival",
        etd: "ETD:",
        eta: "ETA:",
      },
      events: {
        title: "Event History",
        description: "Detailed tracking of your shipment",
        empty: "No tracking events available for this order",
      },
      help: {
        title: "How to use tracking",
        description: "Enter your tracking number in the field above to see the status of your shipment.",
        example: "Your tracking number can be found on your invoice or in the confirmation email.\nExample format: DN2024001234",
      },
      status: {
        pending: "Pending",
        confirmed: "Confirmed",
        in_progress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
      },
      containerStatus: {
        planned: "Planned",
        departed: "Departure Confirmed",
        in_transit: "In Transit",
        arrived: "Arrived",
        delivered: "Delivered",
        delayed: "Delayed",
      },
    },
  },
}

export type TranslationPath = keyof TranslationSchema | string

export function resolveTranslationValue(source: TranslationPathValue | undefined, path: string[]): string | undefined {
  if (!source) return undefined
  if (path.length === 0) {
    return typeof source === "string" ? source : undefined
  }

  const [segment, ...rest] = path

  if (typeof source !== "object" || Array.isArray(source)) {
    return undefined
  }

  return resolveTranslationValue(source[segment], rest)
}
