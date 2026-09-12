"use client"

import { useSyncExternalStore } from "react"

export interface TrackingEvent {
  id: string
  date: string
  time: string
  status: string
  location: string
  description: string
  operator?: string
}

export interface PackageTracking {
  id: string
  trackingNumber: string
  reference: string
  client: string
  destination: string
  currentStatus: "preparation" | "expedie" | "en_transit" | "arrive_port" | "dedouane" | "livre"
  estimatedDelivery: string
  weight: string
  value: string
  events: TrackingEvent[]
  lastUpdate: string
}

const EMPTY_TRACKING_DATA: PackageTracking[] = []
let cachedStorageValue: string | null | undefined
let cachedTrackingData: PackageTracking[] | undefined

export const getTrackingData = (): PackageTracking[] => {
  if (typeof window === "undefined") return EMPTY_TRACKING_DATA

  const stored = localStorage.getItem("danemo-tracking-data")
  if (stored === cachedStorageValue && cachedTrackingData) {
    return cachedTrackingData
  }

  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        cachedStorageValue = stored
        cachedTrackingData = parsed
        return parsed
      }
    } catch {
      // Une valeur locale corrompue ne doit pas empêcher l'affichage du suivi.
    }
  }

  // Default data
  const defaultData: PackageTracking[] = [
    {
      id: "1",
      trackingNumber: "DN2024001234",
      reference: "COL-2024-001",
      client: "Jean Mballa",
      destination: "Yaoundé, Cameroun",
      currentStatus: "en_transit",
      estimatedDelivery: "2024-02-15",
      weight: "15 kg",
      value: "€1,200",
      lastUpdate: "2024-01-25T10:30:00",
      events: [
        {
          id: "1",
          date: "2024-01-15",
          time: "09:00",
          status: "preparation",
          location: "Bruxelles, Belgique",
          description: "Colis reçu et préparé pour l'expédition",
          operator: "Marie Dupont",
        },
        {
          id: "2",
          date: "2024-01-18",
          time: "14:30",
          status: "expedie",
          location: "Port d'Anvers, Belgique",
          description: "Colis chargé sur le navire MSC Flaminia",
          operator: "Pierre Martin",
        },
        {
          id: "3",
          date: "2024-01-25",
          time: "10:30",
          status: "en_transit",
          location: "Océan Atlantique",
          description: "Navire en route vers Douala",
        },
      ],
    },
    {
      id: "2",
      trackingNumber: "DN2024001235",
      reference: "COL-2024-002",
      client: "Sophie Atangana",
      destination: "Douala, Cameroun",
      currentStatus: "arrive_port",
      estimatedDelivery: "2024-02-10",
      weight: "8 kg",
      value: "€450",
      lastUpdate: "2024-01-28T08:15:00",
      events: [
        {
          id: "1",
          date: "2024-01-05",
          time: "11:00",
          status: "preparation",
          location: "Bruxelles, Belgique",
          description: "Colis reçu et conditionné",
        },
        {
          id: "2",
          date: "2024-01-08",
          time: "16:00",
          status: "expedie",
          location: "Port d'Anvers, Belgique",
          description: "Départ du navire",
        },
        {
          id: "3",
          date: "2024-01-28",
          time: "08:15",
          status: "arrive_port",
          location: "Port de Douala, Cameroun",
          description: "Navire arrivé au port de Douala",
        },
      ],
    },
    {
      id: "3",
      trackingNumber: "DN2024001236",
      reference: "VEH-2024-001",
      client: "Marie Nguema",
      destination: "Yaoundé, Cameroun",
      currentStatus: "dedouane",
      estimatedDelivery: "2024-02-05",
      weight: "1500 kg",
      value: "€28,000",
      lastUpdate: "2024-01-30T14:20:00",
      events: [
        {
          id: "1",
          date: "2024-01-10",
          time: "10:00",
          status: "preparation",
          location: "Bruxelles, Belgique",
          description: "Véhicule réceptionné et préparé",
        },
        {
          id: "2",
          date: "2024-01-12",
          time: "15:00",
          status: "expedie",
          location: "Port d'Anvers, Belgique",
          description: "Véhicule embarqué",
        },
        {
          id: "3",
          date: "2024-01-28",
          time: "09:00",
          status: "arrive_port",
          location: "Port de Douala, Cameroun",
          description: "Arrivée au port de Douala",
        },
        {
          id: "4",
          date: "2024-01-30",
          time: "14:20",
          status: "dedouane",
          location: "Douane de Douala, Cameroun",
          description: "Procédures de dédouanement en cours",
          operator: "Paul Essomba",
        },
      ],
    },
    {
      id: "4",
      trackingNumber: "DN2024001237",
      reference: "COL-2024-003",
      client: "Paul Essono",
      destination: "Libreville, Gabon",
      currentStatus: "livre",
      estimatedDelivery: "2024-01-30",
      weight: "12 kg",
      value: "€800",
      lastUpdate: "2024-01-30T16:45:00",
      events: [
        {
          id: "1",
          date: "2024-01-08",
          time: "14:00",
          status: "preparation",
          location: "Bruxelles, Belgique",
          description: "Colis préparé pour l'expédition",
        },
        {
          id: "2",
          date: "2024-01-10",
          time: "10:00",
          status: "expedie",
          location: "Port d'Anvers, Belgique",
          description: "Colis expédié",
        },
        {
          id: "3",
          date: "2024-01-25",
          time: "08:00",
          status: "arrive_port",
          location: "Port de Libreville, Gabon",
          description: "Arrivée au port de destination",
        },
        {
          id: "4",
          date: "2024-01-28",
          time: "11:30",
          status: "dedouane",
          location: "Douane de Libreville, Gabon",
          description: "Dédouanement terminé",
        },
        {
          id: "5",
          date: "2024-01-30",
          time: "16:45",
          status: "livre",
          location: "Libreville, Gabon",
          description: "Colis livré au destinataire",
          operator: "Service de livraison local",
        },
      ],
    },
  ]

  cachedStorageValue = stored
  cachedTrackingData = defaultData
  return defaultData
}

export const saveTrackingData = (data: PackageTracking[]) => {
  if (typeof window !== "undefined") {
    const serializedData = JSON.stringify(data)
    cachedStorageValue = serializedData
    cachedTrackingData = data
    localStorage.setItem("danemo-tracking-data", serializedData)

    // Déclencher l'événement personnalisé immédiatement
    const customEvent = new CustomEvent("danemo-tracking-update", {
      detail: { data, timestamp: Date.now() },
    })
    window.dispatchEvent(customEvent)

    // Forcer une mise à jour avec un délai minimal pour s'assurer que tous les composants se mettent à jour
    setTimeout(() => {
      const delayedEvent = new CustomEvent("danemo-tracking-update", {
        detail: { data, timestamp: Date.now() },
      })
      window.dispatchEvent(delayedEvent)
    }, 100)

    // Garder l'événement storage pour la synchronisation entre onglets
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "danemo-tracking-data",
        newValue: serializedData,
      }),
    )

    console.log("Données sauvegardées et événements déclenchés:", data.length, "colis")
  }
}

export const useTrackingData = (): PackageTracking[] => {
  return useSyncExternalStore(
    (onStoreChange) => {
      const handleCustomUpdate = () => onStoreChange()
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === "danemo-tracking-data") onStoreChange()
      }

      window.addEventListener("danemo-tracking-update", handleCustomUpdate)
      window.addEventListener("storage", handleStorageChange)

      return () => {
        window.removeEventListener("danemo-tracking-update", handleCustomUpdate)
        window.removeEventListener("storage", handleStorageChange)
      }
    },
    getTrackingData,
    () => EMPTY_TRACKING_DATA,
  )
}

export const findPackageByTrackingNumber = (trackingNumber: string): PackageTracking | null => {
  const data = getTrackingData()
  return data.find((pkg) => pkg.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()) || null
}

export const useFindPackageByTrackingNumber = (trackingNumber: string): PackageTracking | null => {
  const data = useTrackingData()
  return data.find((pkg) => pkg.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()) || null
}

export const getStatusLabel = (status: string): string => {
  const statusLabels = {
    preparation: "En préparation",
    expedie: "Expédié",
    en_transit: "En transit",
    arrive_port: "Arrivé au port",
    dedouane: "En dédouanement",
    livre: "Livré",
  }
  return statusLabels[status as keyof typeof statusLabels] || status
}
