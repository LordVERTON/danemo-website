"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  FileDown,
  FileSpreadsheet,
  QrCode,
  Send,
  Loader2,
} from "lucide-react"
import { useCurrentUser } from "@/lib/use-current-user"
import { generateInvoice, defaultCompanyData, InvoiceData } from "@/lib/invoice-utils"
import { generateProformaDocx, generateProformaPdf } from "@/lib/proforma-utils"
import { generateQRPrintPDF } from "@/lib/qr-print-utils"

interface Order {
  id: string
  order_number: string
  client_name: string
  client_email: string
  client_phone?: string
  recipient_name?: string | null
  recipient_email?: string | null
  recipient_phone?: string | null
  recipient_address?: string | null
  recipient_city?: string | null
  recipient_postal_code?: string | null
  recipient_country?: string | null
  service_type: string
  origin: string
  destination: string
  weight?: number
  value?: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  estimated_delivery?: string
  created_at: string
  updated_at: string
  container_id?: string | null
  container_code?: string | null
  container_status?: string | null
  customer_id?: string | null
}

interface ClientSummary {
  id: string
  name: string
  email: string | null
  phone: string | null
}

type ClientRole = "sender" | "recipient" | "both" | "none"

export default function OrdersPage() {
  const { user: currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterContainer, setFilterContainer] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [containers, setContainers] = useState<Array<{ 
    id: string; 
    code: string; 
    status?: string | null;
    vessel?: string | null;
    departure_port?: string | null;
    arrival_port?: string | null;
    etd?: string | null;
    eta?: string | null;
  }>>([])
  const [isCreateContainerDialogOpen, setIsCreateContainerDialogOpen] = useState(false)
  const [newContainer, setNewContainer] = useState({
    code: "",
    vessel: "",
    departure_port: "",
    arrival_port: "",
    etd: "",
    eta: "",
    status: "planned" as const
  })
  const [isNotifyingOrder, setIsNotifyingOrder] = useState(false)
  const [notifyOrderFeedback, setNotifyOrderFeedback] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })
  const [orderNotificationHistory, setOrderNotificationHistory] = useState<
    Record<string, { status: string; timestamp: string }>
  >({})
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [createSenderClientId, setCreateSenderClientId] = useState<string>("custom")
  const [createRecipientClientId, setCreateRecipientClientId] = useState<string>("custom")
  const [isCreateSenderDetailsOpen, setIsCreateSenderDetailsOpen] = useState(false)
  const [isCreateRecipientDetailsOpen, setIsCreateRecipientDetailsOpen] = useState(false)
  const [useClientForSender, setUseClientForSender] = useState(false)
  const [useClientForRecipient, setUseClientForRecipient] = useState(false)
  const [createClientRole, setCreateClientRole] = useState<ClientRole>("sender")
  const [editClientRole, setEditClientRole] = useState<ClientRole>("sender")
  const [editSenderClientId, setEditSenderClientId] = useState<string>("custom")
  const [editRecipientClientId, setEditRecipientClientId] = useState<string>("custom")

  const findClientIdByEmail = (email?: string | null) => {
    if (!email) return undefined
    const normalized = email.toLowerCase()
    return clients.find((client) => client.email?.toLowerCase() === normalized)?.id
  }

  const computeRoleFromOrder = (order: Order | null, client?: ClientSummary | null): ClientRole => {
    if (!order || !order.customer_id || !client) return "none"
    const matchesSender =
      !!order.client_email &&
      !!client.email &&
      order.client_email.toLowerCase() === client.email.toLowerCase()
    const matchesRecipient =
      !!order.recipient_email &&
      !!client.email &&
      order.recipient_email.toLowerCase() === client.email.toLowerCase()
    if (matchesSender && matchesRecipient) return "both"
    if (matchesSender) return "sender"
    if (matchesRecipient) return "recipient"
    return "none"
  }

  // Formulaire de création
  const [newOrder, setNewOrder] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    recipient_address: "",
    recipient_city: "",
    recipient_postal_code: "",
    recipient_country: "",
    service_type: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    estimated_delivery: "",
    container_id: "",
    container_code: "",
    customer_id: "",
  })

  // Formulaire de modification
  const [editOrder, setEditOrder] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    recipient_address: "",
    recipient_city: "",
    recipient_postal_code: "",
    recipient_country: "",
    service_type: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    estimated_delivery: "",
    status: "",
    container_id: "",
    container_code: "",
    customer_id: "",
  })

  const copyClientToRecipientForCreate = () => {
    setNewOrder((prev) => ({
      ...prev,
      recipient_name: prev.client_name,
      recipient_email: prev.client_email,
      recipient_phone: prev.client_phone,
      recipient_address: prev.recipient_address,
      recipient_city: prev.recipient_city,
      recipient_postal_code: prev.recipient_postal_code,
      recipient_country: prev.recipient_country,
    }))
    setCreateRecipientClientId(createSenderClientId)
    if (newOrder.customer_id) {
      setCreateClientRole("both")
    }
  }

  const copyClientToRecipientForEdit = () => {
    setEditOrder((prev) => ({
      ...prev,
      recipient_name: prev.client_name,
      recipient_email: prev.client_email,
      recipient_phone: prev.client_phone,
      recipient_address: prev.recipient_address,
      recipient_city: prev.recipient_city,
      recipient_postal_code: prev.recipient_postal_code,
      recipient_country: prev.recipient_country,
    }))
    setEditRecipientClientId(editSenderClientId)
    if (editOrder.customer_id) {
      setEditClientRole("both")
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchContainers()
    fetchClients()
  }, [])

  useEffect(() => {
    const handleQRScanResult = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.type === 'orders') {
        fetchContainers().then(() => {
          const data = customEvent.detail.data || {}
          const recipientName = data.recipient_name || data.client_name || ""
          const recipientEmail = data.recipient_email || data.client_email || ""
          const recipientPhone = data.recipient_phone || data.client_phone || ""

          const senderClientId = data.customer_id || findClientIdByEmail(data.client_email) || "custom"
          const recipientClientId = findClientIdByEmail(data.recipient_email || data.client_email) || "custom"

          setNewOrder({
            client_name: data.client_name || "",
            client_email: data.client_email || "",
            client_phone: data.client_phone || "",
            recipient_name: recipientName,
            recipient_email: recipientEmail,
            recipient_phone: recipientPhone,
            recipient_address: data.recipient_address || "",
            recipient_city: data.recipient_city || "",
            recipient_postal_code: data.recipient_postal_code || "",
            recipient_country: data.recipient_country || "",
            service_type: data.service_type || "fret_maritime",
            origin: data.origin || "",
            destination: data.destination || "",
            weight: data.weight || "",
            value: data.value || "",
            estimated_delivery: data.estimated_delivery || "",
            container_id: "",
            container_code: "",
            customer_id: senderClientId === "custom" ? "" : senderClientId,
          })

          setCreateSenderClientId(senderClientId)
          setCreateRecipientClientId(recipientClientId)
          setIsCreateDialogOpen(true)
        })
      }
    }

    window.addEventListener('qrScanResult', handleQRScanResult)
    return () => window.removeEventListener('qrScanResult', handleQRScanResult)
  }, [])

useEffect(() => {
  if (!selectedOrder) {
    setEditClientRole("sender")
    return
  }
  const associatedClient = selectedOrder.customer_id
    ? clients.find((client) => client.id === selectedOrder.customer_id)
    : undefined
  const derivedRole = computeRoleFromOrder(selectedOrder, associatedClient)
  setEditClientRole(derivedRole)

  const fallbackSenderId =
    findClientIdByEmail(selectedOrder.client_email) || "custom"
  const fallbackRecipientId =
    findClientIdByEmail(selectedOrder.recipient_email || selectedOrder.client_email) || "custom"

  if (associatedClient?.id) {
    const senderId =
      derivedRole === "sender" || derivedRole === "both"
        ? associatedClient.id
        : fallbackSenderId
    const recipientId =
      derivedRole === "recipient" || derivedRole === "both"
        ? associatedClient.id
        : fallbackRecipientId
    setEditSenderClientId(senderId)
    setEditRecipientClientId(recipientId)
  } else {
    setEditSenderClientId(fallbackSenderId)
    setEditRecipientClientId(fallbackRecipientId)
  }
}, [clients, selectedOrder])

  useEffect(() => {
    if (createSenderClientId !== "custom" || clients.length === 0) return
    if (!newOrder.customer_id) return
    if (clients.some((client) => client.id === newOrder.customer_id)) {
      setCreateSenderClientId(newOrder.customer_id)
    }
  }, [clients, newOrder.customer_id, createSenderClientId])

  useEffect(() => {
    if (createRecipientClientId !== "custom" || clients.length === 0) return
    const match = findClientIdByEmail(newOrder.recipient_email)
    if (match) {
      setCreateRecipientClientId(match)
    }
  }, [clients, newOrder.recipient_email, createRecipientClientId])

useEffect(() => {
  if (!newOrder.customer_id) {
    if (useClientForSender) setUseClientForSender(false)
    if (useClientForRecipient) setUseClientForRecipient(false)
    return
  }
  const shouldSender = createClientRole === "sender" || createClientRole === "both"
  const shouldRecipient = createClientRole === "recipient" || createClientRole === "both"
  if (useClientForSender !== shouldSender) {
    setUseClientForSender(shouldSender)
  }
  if (useClientForRecipient !== shouldRecipient) {
    setUseClientForRecipient(shouldRecipient)
  }
}, [createClientRole, newOrder.customer_id, useClientForSender, useClientForRecipient])

  useEffect(() => {
    if (!newOrder.customer_id) return
    const client = clients.find((c) => c.id === newOrder.customer_id)
    if (!client) return

    if (useClientForSender) {
      setNewOrder((prev) => {
        const nextName = client.name || ""
        const nextEmail = client.email || ""
        const nextPhone = client.phone || ""
        if (
          prev.client_name === nextName &&
          prev.client_email === nextEmail &&
          (prev.client_phone || "") === (nextPhone || "")
        ) {
          return prev
        }
        return {
          ...prev,
          client_name: nextName,
          client_email: nextEmail,
          client_phone: nextPhone || "",
        }
      })
      if (createSenderClientId !== client.id) {
        setCreateSenderClientId(client.id)
      }
    }

    if (useClientForRecipient) {
      setNewOrder((prev) => {
        const nextName = client.name || ""
        const nextEmail = client.email || ""
        const nextPhone = client.phone || ""
        if (
          prev.recipient_name === nextName &&
          prev.recipient_email === nextEmail &&
          (prev.recipient_phone || "") === (nextPhone || "")
        ) {
          return prev
        }
        return {
          ...prev,
          recipient_name: nextName,
          recipient_email: nextEmail,
          recipient_phone: nextPhone || "",
        }
      })
      if (createRecipientClientId !== client.id) {
        setCreateRecipientClientId(client.id)
      }
    }
  }, [
    newOrder.customer_id,
    clients,
    useClientForSender,
    useClientForRecipient,
    createSenderClientId,
    createRecipientClientId,
  ])

useEffect(() => {
  if (!editOrder.customer_id) return
  const client = clients.find((c) => c.id === editOrder.customer_id)
  if (!client) return

  if (editClientRole === "sender" || editClientRole === "both") {
    setEditOrder((prev) => {
      const nextName = client.name || ""
      const nextEmail = client.email || ""
      const nextPhone = client.phone || ""
      if (
        prev.client_name === nextName &&
        prev.client_email === nextEmail &&
        (prev.client_phone || "") === (nextPhone || "")
      ) {
        return prev
      }
      return {
        ...prev,
        client_name: nextName,
        client_email: nextEmail,
        client_phone: nextPhone || "",
      }
    })
    if (editSenderClientId !== client.id) {
      setEditSenderClientId(client.id)
    }
  }

  if (editClientRole === "recipient" || editClientRole === "both") {
    setEditOrder((prev) => {
      const nextName = client.name || ""
      const nextEmail = client.email || ""
      const nextPhone = client.phone || ""
      if (
        prev.recipient_name === nextName &&
        prev.recipient_email === nextEmail &&
        (prev.recipient_phone || "") === (nextPhone || "")
      ) {
        return prev
      }
      return {
        ...prev,
        recipient_name: nextName,
        recipient_email: nextEmail,
        recipient_phone: nextPhone || "",
      }
    })
    if (editRecipientClientId !== client.id) {
      setEditRecipientClientId(client.id)
    }
  }
}, [
  editOrder.customer_id,
  clients,
  editClientRole,
  editSenderClientId,
  editRecipientClientId,
])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/orders')
      const result = await response.json()
      
      if (result.success) {
        setOrders(result.data)
      } else {
        console.error('Error fetching orders:', result.error)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/containers')
      const result = await response.json()
      if (result.success && result.data) {
        const containersList = result.data.map((container: any) => ({
          id: container.id,
          code: container.code,
          status: container.status ?? null,
          vessel: container.vessel ?? null,
          departure_port: container.departure_port ?? null,
          arrival_port: container.arrival_port ?? null,
          etd: container.etd ?? null,
          eta: container.eta ?? null,
        }))
        setContainers(containersList)
        console.log('Containers loaded:', containersList.length)
      } else {
        console.error('Failed to fetch containers:', result.error)
        setContainers([])
      }
    } catch (error) {
      console.error('Error fetching containers:', error)
      setContainers([])
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setClients(
          result.data.map((client: any) => ({
            id: client.id,
            name: client.name,
            email: client.email || null,
            phone: client.phone || null,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!newContainer.code.trim()) {
        setError('Le code du conteneur est requis')
        return
      }

      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newContainer.code.trim(),
          vessel: newContainer.vessel.trim() || null,
          departure_port: newContainer.departure_port.trim() || null,
          arrival_port: newContainer.arrival_port.trim() || null,
          etd: newContainer.etd || null,
          eta: newContainer.eta || null,
          status: newContainer.status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Recharger la liste complète des conteneurs depuis l'API
        await fetchContainers()
        
        // Sélectionner automatiquement le nouveau conteneur dans le formulaire actif
        const createdContainer = result.data
        if (isCreateDialogOpen) {
          setNewOrder({
            ...newOrder,
            container_id: createdContainer.id,
            container_code: createdContainer.code,
          })
        } else if (isEditDialogOpen) {
          setEditOrder({
            ...editOrder,
            container_id: createdContainer.id,
            container_code: createdContainer.code,
          })
        }
        
        // Réinitialiser le formulaire et fermer le dialog
        setNewContainer({
          code: "",
          vessel: "",
          departure_port: "",
          arrival_port: "",
          etd: "",
          eta: "",
          status: "planned"
        })
        setIsCreateContainerDialogOpen(false)
        setError("")
      } else {
        setError(result.error || 'Erreur lors de la création du conteneur')
      }
    } catch (error) {
      console.error('Error creating container:', error)
      setError('Erreur de connexion')
    }
  }

  const handleCreateSenderSelect = (value: string) => {
    setCreateSenderClientId(value)
    if (value === "custom") {
      return
    }
    const client = clients.find((c) => c.id === value)
    if (client) {
      setNewOrder((prev) => ({
        ...prev,
        customer_id: useClientForSender ? client.id : prev.customer_id,
        client_name: client.name || "",
        client_email: client.email || "",
        client_phone: client.phone || "",
      }))
    }
  }

  const handleCreateRecipientSelect = (value: string) => {
    setCreateRecipientClientId(value)
    if (value === "custom") return
    const client = clients.find((c) => c.id === value)
    if (client) {
      setNewOrder((prev) => ({
        ...prev,
        recipient_name: client.name || "",
        recipient_email: client.email || "",
        recipient_phone: client.phone || "",
        recipient_address: prev.recipient_address,
        recipient_city: prev.recipient_city,
        recipient_postal_code: prev.recipient_postal_code,
        recipient_country: prev.recipient_country,
        customer_id: useClientForRecipient ? client.id : prev.customer_id,
      }))
    }
  }

  const handleCreateOrderClientSelect = (value: string) => {
    if (value === "custom") {
      setNewOrder((prev) => ({
        ...prev,
        customer_id: "",
      }))
      setCreateClientRole("none")
    setCreateSenderClientId("custom")
    setCreateRecipientClientId("custom")
      return
    }
    const client = clients.find((c) => c.id === value)
    const nextRole: ClientRole =
      createClientRole === "none" || !client ? "sender" : createClientRole
    const shouldUseSender = nextRole === "sender" || nextRole === "both"
    const shouldUseRecipient = nextRole === "recipient" || nextRole === "both"

    setNewOrder((prev) => ({
      ...prev,
      customer_id: value,
      ...(shouldUseSender || !prev.client_name
        ? {
            client_name: client?.name || "",
            client_email: client?.email || "",
            client_phone: client?.phone || "",
          }
        : {}),
      ...(shouldUseRecipient || (!prev.recipient_name && !prev.recipient_email && !prev.recipient_phone)
        ? {
            recipient_name: client?.name || "",
            recipient_email: client?.email || "",
            recipient_phone: client?.phone || "",
          }
        : {}),
    }))
    if (shouldUseSender && value !== createSenderClientId) {
      setCreateSenderClientId(value)
    }
    if (shouldUseRecipient && value !== createRecipientClientId) {
      setCreateRecipientClientId(value)
    }
    setCreateClientRole(nextRole)
  }

const handleCreateClientRoleChange = (role: ClientRole) => {
  if (!newOrder.customer_id && role !== "none") {
    setCreateClientRole("none")
    return
  }
  setCreateClientRole(role)
  if (!newOrder.customer_id) return
  if ((role === "sender" || role === "both") && createSenderClientId !== newOrder.customer_id) {
    setCreateSenderClientId(newOrder.customer_id)
  }
  if ((role === "recipient" || role === "both") && createRecipientClientId !== newOrder.customer_id) {
    setCreateRecipientClientId(newOrder.customer_id)
  }
  if (role === "none") {
    setCreateSenderClientId("custom")
    setCreateRecipientClientId("custom")
  }
}

const handleEditOrderClientSelect = (value: string) => {
  if (value === "custom") {
    setEditOrder((prev) => ({
      ...prev,
      customer_id: "",
    }))
    setEditClientRole("none")
    setEditSenderClientId("custom")
    setEditRecipientClientId("custom")
    return
  }
  const client = clients.find((c) => c.id === value)
  const nextRole: ClientRole =
    editClientRole === "none" || !client ? "sender" : editClientRole
  setEditOrder((prev) => ({
    ...prev,
    customer_id: value,
  }))
  if ((nextRole === "sender" || nextRole === "both") && value !== editSenderClientId) {
    setEditSenderClientId(value)
  }
  if ((nextRole === "recipient" || nextRole === "both") && value !== editRecipientClientId) {
    setEditRecipientClientId(value)
  }
  setEditClientRole(nextRole)
}

const handleEditClientRoleChange = (role: ClientRole) => {
  if (!editOrder.customer_id && role !== "none") {
    setEditClientRole("none")
    return
  }
  setEditClientRole(role)
  if (!editOrder.customer_id) return
  if ((role === "sender" || role === "both") && editSenderClientId !== editOrder.customer_id) {
    setEditSenderClientId(editOrder.customer_id)
  }
  if ((role === "recipient" || role === "both") && editRecipientClientId !== editOrder.customer_id) {
    setEditRecipientClientId(editOrder.customer_id)
  }
  if (role === "none") {
    setEditSenderClientId("custom")
    setEditRecipientClientId("custom")
  }
}

  const handleEditSenderSelect = (value: string) => {
    setEditSenderClientId(value)
    if (value === "custom") {
      return
    }
    const client = clients.find((c) => c.id === value)
    if (client) {
      setEditOrder((prev) => ({
        ...prev,
        client_name: client.name || "",
        client_email: client.email || "",
        client_phone: client.phone || "",
        ...(editClientRole === "sender" || editClientRole === "both"
          ? { customer_id: client.id }
          : {}),
      }))
    }
  }

  const handleEditRecipientSelect = (value: string) => {
    setEditRecipientClientId(value)
    if (value === "custom") return
    const client = clients.find((c) => c.id === value)
    if (client) {
      setEditOrder((prev) => ({
        ...prev,
        recipient_name: client.name || "",
        recipient_email: client.email || "",
        recipient_phone: client.phone || "",
        recipient_address: prev.recipient_address,
        recipient_city: prev.recipient_city,
        recipient_postal_code: prev.recipient_postal_code,
        recipient_country: prev.recipient_country,
        ...(editClientRole === "recipient" || editClientRole === "both"
          ? { customer_id: client.id }
          : {}),
      }))
    }
  }

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      setCreateSenderClientId("custom")
      setCreateRecipientClientId("custom")
      setIsCreateSenderDetailsOpen(false)
      setIsCreateRecipientDetailsOpen(false)
      setUseClientForSender(false)
      setUseClientForRecipient(false)
      setCreateClientRole("sender")
    }
  }

  const handleCreateOrder = async (e: React.FormEvent, printQR: boolean = false) => {
    e.preventDefault()
    setError("") // Réinitialiser les erreurs
    
    try {
      if (!newOrder.client_name.trim() || !newOrder.client_email.trim()) {
        setError("Renseigne le nom et l’adresse email de l’expéditeur.")
        return
      }
      if (!newOrder.service_type) {
        setError("Sélectionne un type de service pour la commande.")
        return
      }
      const selectedContainer = containers.find((container) => container.id === newOrder.container_id)
      const recipientName = newOrder.recipient_name?.trim() || newOrder.client_name
      const recipientEmail = newOrder.recipient_email?.trim() || newOrder.client_email
      const recipientPhone = newOrder.recipient_phone?.trim() || newOrder.client_phone || ""
      const recipientAddress = newOrder.recipient_address?.trim() || ""
      const recipientCity = newOrder.recipient_city?.trim() || ""
      const recipientPostalCode = newOrder.recipient_postal_code?.trim() || ""
      const recipientCountry = newOrder.recipient_country?.trim() || ""
      const orderData = {
        ...newOrder,
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
        recipient_address: recipientAddress || null,
        recipient_city: recipientCity || null,
        recipient_postal_code: recipientPostalCode || null,
        recipient_country: recipientCountry || null,
        weight: newOrder.weight ? parseFloat(newOrder.weight) : null,
        value: newOrder.value ? parseFloat(newOrder.value) : null,
        estimated_delivery: newOrder.estimated_delivery || null,
        container_id: newOrder.container_id || null,
        container_code: selectedContainer?.code || null,
        container_status: selectedContainer?.status || null,
        customer_id: newOrder.customer_id || null,
      }

      // Étape 1: Créer la commande dans la base de données
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      
      if (!result.success) {
        console.error('Error creating order:', result.error)
        setError(result.error || 'Erreur lors de la création de la commande')
        return
      }

      // La commande a été créée avec succès
      const createdOrder = result.data
      
      // Étape 2: Réinitialiser le formulaire et fermer la modal
      setNewOrder({
        client_name: "",
        client_email: "",
        client_phone: "",
        recipient_name: "",
        recipient_email: "",
        recipient_phone: "",
        recipient_address: "",
        recipient_city: "",
        recipient_postal_code: "",
        recipient_country: "",
        service_type: "",
        origin: "",
        destination: "",
        weight: "",
        value: "",
        estimated_delivery: "",
        container_id: "",
        container_code: "",
        customer_id: "",
      })
      setCreateSenderClientId("custom")
      setCreateRecipientClientId("custom")
      setUseClientForSender(false)
      setUseClientForRecipient(false)
      setIsCreateSenderDetailsOpen(false)
      setIsCreateRecipientDetailsOpen(false)
      setCreateClientRole("sender")
      setIsCreateDialogOpen(false)
      
      // Étape 3: Rafraîchir la liste des commandes pour afficher la nouvelle commande
      await fetchOrders()
      
      // Étape 4: Générer et imprimer le QR code si demandé (après le rafraîchissement)
      if (printQR && createdOrder?.qr_code) {
        try {
          await generateQRPrintPDF({
            qrCode: createdOrder.qr_code,
            orderNumber: createdOrder.order_number,
            clientName: createdOrder.client_name,
            serviceType: createdOrder.service_type,
            origin: createdOrder.origin,
            destination: createdOrder.destination
          })
        } catch (error) {
          console.error('Erreur lors de la génération du QR code:', error)
          // Ne pas bloquer - la commande est déjà créée et affichée
          setError('Commande créée avec succès, mais erreur lors de l\'impression du QR code')
        }
      }
    } catch (error) {
      console.error('Error creating order:', error)
      setError('Erreur de connexion lors de la création de la commande')
    }
  }

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setSelectedOrder(null)
      setNotifyOrderFeedback({ type: null, message: "" })
      setIsNotifyingOrder(false)
      setEditSenderClientId("custom")
      setEditRecipientClientId("custom")
      setEditClientRole("sender")
    }
  }

  const handleEditOrder = async (order: Order) => {
    // Recharger les conteneurs pour s'assurer d'avoir les données à jour
    await fetchContainers()
    
    setNotifyOrderFeedback({ type: null, message: "" })
    setEditClientRole("sender")
    setSelectedOrder(order)
    setEditOrder({
      client_name: order.client_name,
      client_email: order.client_email,
      client_phone: order.client_phone || "",
      recipient_name: order.recipient_name || order.client_name,
      recipient_email: order.recipient_email || order.client_email,
      recipient_phone: order.recipient_phone || order.client_phone || "",
      recipient_address: order.recipient_address || "",
      recipient_city: order.recipient_city || "",
      recipient_postal_code: order.recipient_postal_code || "",
      recipient_country: order.recipient_country || "",
      service_type: order.service_type,
      origin: order.origin,
      destination: order.destination,
      weight: order.weight ? String(order.weight) : "",
      value: order.value ? String(order.value) : "",
      estimated_delivery: order.estimated_delivery || "",
      status: order.status,
      container_id: order.container_id || "",
      container_code: order.container_code || "",
      customer_id: order.customer_id || "",
    })
    const senderClientId =
      order.customer_id || findClientIdByEmail(order.client_email) || "custom"
    const recipientClientId =
      findClientIdByEmail(order.recipient_email || order.client_email) || "custom"
    setEditSenderClientId(senderClientId)
    setEditRecipientClientId(recipientClientId)
    setIsEditDialogOpen(true)
  }

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      const selectedContainer = containers.find((container) => container.id === editOrder.container_id)
      const recipientName = editOrder.recipient_name?.trim() || editOrder.client_name
      const recipientEmail = editOrder.recipient_email?.trim() || editOrder.client_email
      const recipientPhone = editOrder.recipient_phone?.trim() || editOrder.client_phone || ""
      const recipientAddress = editOrder.recipient_address?.trim() || ""
      const recipientCity = editOrder.recipient_city?.trim() || ""
      const recipientPostalCode = editOrder.recipient_postal_code?.trim() || ""
      const recipientCountry = editOrder.recipient_country?.trim() || ""
      const orderData = {
        ...editOrder,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress || null,
        recipient_city: recipientCity || null,
        recipient_postal_code: recipientPostalCode || null,
        recipient_country: recipientCountry || null,
        weight: editOrder.weight ? parseFloat(editOrder.weight) : null,
        value: editOrder.value ? parseFloat(editOrder.value) : null,
        estimated_delivery: editOrder.estimated_delivery || null,
        container_id: editOrder.container_id || null,
        container_code: selectedContainer?.code || null,
        container_status: selectedContainer?.status || null,
        customer_id: editOrder.customer_id || null,
      }

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          user_name: currentUser?.name || 'Utilisateur inconnu'
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setIsEditDialogOpen(false)
        fetchOrders()
      } else {
        console.error('Error updating order:', result.error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const triggerOrderNotification = async () => {
    if (!selectedOrder) return
    setIsNotifyingOrder(true)
    setNotifyOrderFeedback({ type: null, message: "" })
    try {
      const statusToSend = editOrder.status || selectedOrder.status
      const res = await fetch('/api/notifications/order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          status: statusToSend,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setNotifyOrderFeedback({
          type: 'error',
          message: json.error || 'Échec de l’envoi de la notification.',
        })
      } else {
        if (statusToSend) {
          const timestamp = new Date().toISOString()
          setOrderNotificationHistory((prev) => ({
            ...prev,
            [selectedOrder.id]: {
              status: statusToSend,
              timestamp,
            },
          }))
          setNotifyOrderFeedback({
            type: 'success',
            message: `Notification envoyée pour le statut "${getStatusLabel(statusToSend)}" le ${new Date(
              timestamp
            ).toLocaleString('fr-FR')}.`,
          })
        } else {
          setNotifyOrderFeedback({
            type: 'success',
            message: 'Notification envoyée au client.',
          })
        }
      }
    } catch (error) {
      console.error('Failed to notify order client', error)
      setNotifyOrderFeedback({
        type: 'error',
        message: 'Impossible d’envoyer la notification, réessaie plus tard.',
      })
    } finally {
      setIsNotifyingOrder(false)
    }
  }


  const handleQRScan = async (qrData: string) => {
    try {
      const data = JSON.parse(qrData)
      
      // Pré-remplir le formulaire avec les données du QR code
      const senderClientId = data.customer_id || findClientIdByEmail(data.client_email) || "custom"
      const recipientClientId =
        findClientIdByEmail(data.recipient_email || data.client_email) || "custom"

      setNewOrder({
        client_name: data.client_name || "",
        client_email: data.client_email || "",
        client_phone: data.client_phone || "",
        recipient_name: data.recipient_name || data.client_name || "",
        recipient_email: data.recipient_email || data.client_email || "",
        recipient_phone: data.recipient_phone || data.client_phone || "",
        recipient_address: data.recipient_address || "",
        recipient_city: data.recipient_city || "",
        recipient_postal_code: data.recipient_postal_code || "",
        recipient_country: data.recipient_country || "",
        service_type: data.service_type || "fret_maritime",
        origin: data.origin || "",
        destination: data.destination || "",
        weight: data.weight || "",
        value: data.value || "",
        estimated_delivery: data.estimated_delivery || "",
        container_id: "",
        container_code: "",
        customer_id: senderClientId === "custom" ? "" : senderClientId,
      })
      setCreateSenderClientId(senderClientId)
      setCreateRecipientClientId(recipientClientId)
      
      // Recharger les conteneurs et ouvrir le dialog de création
      await fetchContainers()
      setIsCreateDialogOpen(true)
    } catch (error) {
      setError('Format de QR code invalide')
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()
      
      if (result.success) {
        fetchOrders()
      } else {
        console.error('Error updating order:', result.error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const handleGenerateInvoice = async (order: Order) => {
    try {
      const invoiceData: InvoiceData = {
        order: order,
        company: defaultCompanyData
      }
      
      await generateInvoice(invoiceData)
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error)
      setError('Erreur lors de la génération de la facture')
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleGenerateProformaPdf = async (order: Order) => {
    try {
      await generateProformaPdf({
        order,
        company: defaultCompanyData,
      })
    } catch (error) {
      console.error('Erreur lors de la génération de la proforma PDF:', error)
      setError('Erreur lors de la génération de la proforma PDF')
    }
  }

  const handleGenerateProformaDocx = async (order: Order) => {
    try {
      const blob = await generateProformaDocx({
        order,
        company: defaultCompanyData,
      })
      downloadBlob(blob, `proforma-${order.order_number}.docx`)
    } catch (error) {
      console.error('Erreur lors de la génération de la proforma DOCX:', error)
      setError('Erreur lors de la génération de la proforma DOCX')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      confirmed: { label: "Confirmée", variant: "secondary" as const, icon: CheckCircle, color: "text-blue-600" },
      in_progress: { label: "En cours", variant: "default" as const, icon: Truck, color: "text-orange-600" },
      completed: { label: "Terminée", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      cancelled: { label: "Annulée", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    in_progress: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
  }
  return labels[status] || status
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const getServiceTypeLabel = (type: string) => {
    const types = {
      fret_maritime: "Fret maritime",
      fret_aerien: "Fret aérien",
      demenagement: "Déménagement",
      dedouanement: "Dédouanement",
      negoce: "Négoce"
    }
    return types[type as keyof typeof types] || type
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.recipient_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    const matchesContainer =
      filterContainer === "all" ||
      order.container_id === filterContainer ||
      order.container_code === filterContainer
    return matchesSearch && matchesStatus && matchesContainer
  })

  const selectedCreateCustomer = newOrder.customer_id
    ? clients.find((client) => client.id === newOrder.customer_id)
    : null

const selectedEditCustomer = editOrder.customer_id
  ? clients.find((client) => client.id === editOrder.customer_id)
  : null

const clientRoleChoices: Array<{ value: ClientRole; label: string }> = [
  { value: "sender", label: "Client expéditeur" },
  { value: "recipient", label: "Client destinataire" },
  { value: "both", label: "Client expéditeur & destinataire" },
  { value: "none", label: "Client ni expéditeur ni destinataire" },
]

  const currentOrderStatusForNotification = selectedOrder
    ? (editOrder.status || selectedOrder.status || "")
    : ""
  const orderNotificationInfo = selectedOrder
    ? orderNotificationHistory[selectedOrder.id]
    : undefined
  const hasNotifiedCurrentStatus =
    !!orderNotificationInfo &&
    !!currentOrderStatusForNotification &&
    orderNotificationInfo.status === currentOrderStatusForNotification

  if (isLoading) {
    return (
      <AdminLayout title="Gestion des commandes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Chargement des commandes...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Gestion des commandes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Gérez toutes les commandes et suivez leur statut
            </p>
          </div>
          <div className="flex items-center gap-2">
            
            <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle commande
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl w-full sm:w-[92vw] lg:w-[80vw] max-h-[90vh] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out p-4 sm:p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg sm:text-xl">Créer une nouvelle commande</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Remplissez les informations pour créer une nouvelle commande
                </DialogDescription>
                {currentUser && (
                  <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    Créé par : <span className="font-medium">{currentUser.name}</span>
                  </div>
                )}
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6 rounded-lg border border-orange-100 bg-orange-50/20 p-4">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,240px)] sm:items-start">
                    <div className="space-y-2">
                      <Label htmlFor="order_customer">Client associé</Label>
                      <Select
                        value={newOrder.customer_id || "custom"}
                        onValueChange={handleCreateOrderClientSelect}
                      >
                        <SelectTrigger id="order_customer" className="w-full text-left">
                          <SelectValue placeholder="Associer la commande à un client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Client personnalisé</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name || "Sans nom"} {client.email ? `– ${client.email}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-md border border-orange-100 bg-white/80 p-3 text-xs sm:text-sm">
                      {selectedCreateCustomer ? (
                        <div className="space-y-1">
                          <p className="font-medium leading-tight">
                            {selectedCreateCustomer.name || "Sans nom"}
                          </p>
                          {selectedCreateCustomer.email && (
                            <p className="text-muted-foreground break-words">
                              {selectedCreateCustomer.email}
                            </p>
                          )}
                          {selectedCreateCustomer.phone && (
                            <p className="text-muted-foreground">
                              {selectedCreateCustomer.phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Sélectionne un client pour le lier à cette commande ou laisse “Client personnalisé”.
                        </p>
                      )}
                    </div>
                </div>
                <div className="space-y-2">
                  <Label>Rôle du client</Label>
                  <div className="flex flex-wrap gap-2">
                    {clientRoleChoices.map((option) => (
                      <label
                        key={option.value}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm transition-colors ${
                          createClientRole === option.value
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-orange-200 bg-white text-muted-foreground hover:border-orange-300"
                        } ${!newOrder.customer_id && option.value !== "none" ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                          value={option.value}
                          checked={createClientRole === option.value}
                          onChange={() => handleCreateClientRoleChange(option.value)}
                          disabled={!newOrder.customer_id && option.value !== "none"}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {!newOrder.customer_id && (
                    <p className="text-xs text-muted-foreground">
                      Sélectionne un client avant d’assigner son rôle.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-md border border-orange-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                        Expéditeur
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coordonnées utilisées comme point d'expédition.
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        createClientRole === "sender" || createClientRole === "both"
                          ? "border-orange-300 bg-orange-50 text-orange-700"
                          : "border-dashed border-orange-200 text-muted-foreground"
                      }
                    >
                      {createClientRole === "sender" || createClientRole === "both"
                        ? "Client associé"
                        : "Formulaire manuel"}
                    </Badge>
                  </div>
                      <div className="space-y-1 rounded-md border border-dashed border-orange-200 bg-orange-50/50 p-3 text-sm">
                        <p className="font-medium break-words">
                          {newOrder.client_name || "Non renseigné"}
                        </p>
                        <p className="text-muted-foreground break-words">
                          {newOrder.client_email || "—"}
                        </p>
                        {(newOrder.client_phone || "").trim() && (
                          <p className="text-muted-foreground">{newOrder.client_phone}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => setIsCreateSenderDetailsOpen(true)}
                        >
                          Modifier les détails
                        </Button>
                        {(createClientRole === "sender" || createClientRole === "both") &&
                          selectedCreateCustomer && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              Synchronisé avec {selectedCreateCustomer.name || "le client"}
                            </Badge>
                          )}
                      </div>
                    </div>
                <div className="space-y-3 rounded-md border border-orange-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                        Destinataire
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Personne qui recevra la commande.
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        createClientRole === "recipient" || createClientRole === "both"
                          ? "border-orange-300 bg-orange-50 text-orange-700"
                          : "border-dashed border-orange-200 text-muted-foreground"
                      }
                    >
                      {createClientRole === "recipient" || createClientRole === "both"
                        ? "Client associé"
                        : "Formulaire manuel"}
                    </Badge>
                  </div>
                      <div className="space-y-1 rounded-md border border-dashed border-orange-200 bg-orange-50/50 p-3 text-sm">
                        <p className="font-medium break-words">
                          {newOrder.recipient_name || newOrder.client_name || "Non renseigné"}
                        </p>
                        <p className="text-muted-foreground break-words">
                          {newOrder.recipient_email || newOrder.client_email || "—"}
                        </p>
                        {(newOrder.recipient_phone || newOrder.client_phone) && (
                          <p className="text-muted-foreground">
                            {newOrder.recipient_phone || newOrder.client_phone}
                          </p>
                        )}
                        {(newOrder.recipient_address ||
                          newOrder.recipient_postal_code ||
                          newOrder.recipient_city ||
                          newOrder.recipient_country) && (
                          <div className="space-y-1 pt-2 text-muted-foreground">
                            {newOrder.recipient_address && (
                              <p className="break-words">{newOrder.recipient_address}</p>
                            )}
                            {(newOrder.recipient_postal_code || newOrder.recipient_city) && (
                              <p className="break-words">
                                {[newOrder.recipient_postal_code, newOrder.recipient_city]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>
                            )}
                            {newOrder.recipient_country && <p>{newOrder.recipient_country}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => setIsCreateRecipientDetailsOpen(true)}
                        >
                          Modifier les détails
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={copyClientToRecipientForCreate}
                          className="text-orange-700 hover:text-orange-800"
                        >
                          Copier l’expéditeur
                        </Button>
                        {(createClientRole === "recipient" || createClientRole === "both") &&
                          selectedCreateCustomer && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              Synchronisé avec {selectedCreateCustomer.name || "le client"}
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="service_type">Type de service *</Label>
                  <Select
                    value={newOrder.service_type}
                    onValueChange={(value) => setNewOrder({ ...newOrder, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fret_maritime">Fret maritime</SelectItem>
                      <SelectItem value="fret_aerien">Fret aérien</SelectItem>
                      <SelectItem value="demenagement">Déménagement</SelectItem>
                      <SelectItem value="dedouanement">Dédouanement</SelectItem>
                      <SelectItem value="negoce">Négoce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="origin">Origine *</Label>
                    <Input
                      id="origin"
                      value={newOrder.origin}
                      onChange={(e) => setNewOrder({...newOrder, origin: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination *</Label>
                    <Input
                      id="destination"
                      value={newOrder.destination}
                      onChange={(e) => setNewOrder({...newOrder, destination: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="container_id">Conteneur</Label>
                  <Select
                    value={newOrder.container_id || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setNewOrder({
                          ...newOrder,
                          container_id: "",
                          container_code: "",
                        })
                      } else {
                        const selected = containers.find((container) => container.id === value)
                        setNewOrder({
                          ...newOrder,
                          container_id: value,
                          container_code: selected?.code || "",
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="text-base sm:text-sm">
                      <SelectValue placeholder="Aucun conteneur assigné" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {containers.length === 0 ? (
                        <SelectItem value="no-containers" disabled>
                          Aucun conteneur disponible
                        </SelectItem>
                      ) : (
                        containers.map((container) => (
                          <SelectItem key={container.id} value={container.id}>
                            {container.code} {container.status && `(${container.status.replace(/_/g, " ")})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setIsCreateContainerDialogOpen(true)}
                  >
                    + Créer un nouveau conteneur
                  </Button>
                  {newOrder.container_id && (() => {
                    const selectedContainer = containers.find((container) => container.id === newOrder.container_id)
                    return (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedContainer?.code || newOrder.container_code || "N/A"}
                          </Badge>
                          {selectedContainer?.status && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedContainer.status.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        {selectedContainer && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {selectedContainer.vessel && (
                              <div>Navire: <span className="font-medium">{selectedContainer.vessel}</span></div>
                            )}
                            {selectedContainer.departure_port && (
                              <div>Départ: <span className="font-medium">{selectedContainer.departure_port}</span></div>
                            )}
                            {selectedContainer.arrival_port && (
                              <div>Arrivée: <span className="font-medium">{selectedContainer.arrival_port}</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="weight">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={newOrder.weight}
                      onChange={(e) => setNewOrder({...newOrder, weight: e.target.value})}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Valeur (€)</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={newOrder.value}
                      onChange={(e) => setNewOrder({...newOrder, value: e.target.value})}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_delivery">Livraison estimée</Label>
                    <Input
                      id="estimated_delivery"
                      type="date"
                      value={newOrder.estimated_delivery}
                      onChange={(e) => setNewOrder({...newOrder, estimated_delivery: e.target.value})}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap md:justify-end gap-2 sm:gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                    Annuler
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => handleCreateOrder(e, true)} 
                    className="w-full sm:w-auto flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Créer et imprimer QR
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">Créer la commande</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        <Dialog
          modal={false}
          open={isCreateSenderDetailsOpen}
          onOpenChange={setIsCreateSenderDetailsOpen}
        >
          <DialogContent className="w-full max-w-lg sm:max-w-xl" showCloseButton>
            <DialogHeader className="pb-2">
              <DialogTitle>Informations expéditeur</DialogTitle>
              <DialogDescription>
                Sélectionne un client existant ou renseigne l’expéditeur manuellement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-sender-select">Importer depuis un client</Label>
                <Select value={createSenderClientId} onValueChange={handleCreateSenderSelect}>
                  <SelectTrigger id="create-sender-select" className="w-full text-left">
                    <SelectValue placeholder="Choisir un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Saisie manuelle</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name || "Sans nom"} {client.email ? `– ${client.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="modal_client_name">Nom de l’expéditeur</Label>
                  <Input
                    id="modal_client_name"
                    value={newOrder.client_name}
                    onChange={(e) => setNewOrder({ ...newOrder, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="modal_client_email">Email de l’expéditeur</Label>
                  <Input
                    id="modal_client_email"
                    type="email"
                    value={newOrder.client_email}
                    onChange={(e) => setNewOrder({ ...newOrder, client_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="modal_client_phone">Téléphone de l’expéditeur</Label>
                  <Input
                    id="modal_client_phone"
                    value={newOrder.client_phone}
                    onChange={(e) => setNewOrder({ ...newOrder, client_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateSenderDetailsOpen(false)}
              >
                Fermer
              </Button>
              <Button type="button" onClick={() => setIsCreateSenderDetailsOpen(false)}>
                Valider
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          modal={false}
          open={isCreateRecipientDetailsOpen}
          onOpenChange={setIsCreateRecipientDetailsOpen}
        >
          <DialogContent className="w-full max-w-lg sm:max-w-xl" showCloseButton>
            <DialogHeader className="pb-2">
              <DialogTitle>Informations destinataire</DialogTitle>
              <DialogDescription>
                Renseigne les coordonnées du destinataire de la commande.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="create-recipient-select">Importer depuis un client</Label>
                  <Select value={createRecipientClientId} onValueChange={handleCreateRecipientSelect}>
                    <SelectTrigger id="create-recipient-select" className="w-full text-left">
                      <SelectValue placeholder="Choisir un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Saisie manuelle</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name || "Sans nom"} {client.email ? `– ${client.email}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyClientToRecipientForCreate}
                  className="self-end"
                >
                  Copier l’expéditeur
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal_recipient_name">Nom du destinataire</Label>
                  <Input
                    id="modal_recipient_name"
                    value={newOrder.recipient_name}
                    onChange={(e) => setNewOrder({ ...newOrder, recipient_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="modal_recipient_email">Email du destinataire</Label>
                  <Input
                    id="modal_recipient_email"
                    type="email"
                    value={newOrder.recipient_email}
                    onChange={(e) => setNewOrder({ ...newOrder, recipient_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="modal_recipient_phone">Téléphone du destinataire</Label>
                  <Input
                    id="modal_recipient_phone"
                    value={newOrder.recipient_phone}
                    onChange={(e) => setNewOrder({ ...newOrder, recipient_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="modal_recipient_address">Adresse</Label>
                  <Input
                    id="modal_recipient_address"
                    value={newOrder.recipient_address}
                    onChange={(e) => setNewOrder({ ...newOrder, recipient_address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="modal_recipient_postal">Code postal</Label>
                  <Input
                    id="modal_recipient_postal"
                    value={newOrder.recipient_postal_code}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, recipient_postal_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="modal_recipient_city">Ville</Label>
                  <Input
                    id="modal_recipient_city"
                    value={newOrder.recipient_city}
                    onChange={(e) => setNewOrder({ ...newOrder, recipient_city: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="modal_recipient_country">Pays</Label>
                  <Input
                    id="modal_recipient_country"
                    value={newOrder.recipient_country}
                    onChange={(e) => setNewOrder({ ...newOrder, recipient_country: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateRecipientDetailsOpen(false)}
              >
                Fermer
              </Button>
              <Button type="button" onClick={() => setIsCreateRecipientDetailsOpen(false)}>
                Valider
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          {/* Dialog pour créer un nouveau conteneur */}
          <Dialog open={isCreateContainerDialogOpen} onOpenChange={setIsCreateContainerDialogOpen}>
            <DialogContent className="max-w-2xl w-full sm:w-[92vw] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>Créer un nouveau conteneur</DialogTitle>
                <DialogDescription>
                  Créez un nouveau conteneur pour l'assigner à cette commande
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateContainer} className="space-y-4">
                <div>
                  <Label htmlFor="container_code">Code du conteneur *</Label>
                  <Input
                    id="container_code"
                    value={newContainer.code}
                    onChange={(e) => setNewContainer({ ...newContainer, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: MSKU1234567"
                    required
                    className="text-base sm:text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="container_vessel">Navire</Label>
                    <Input
                      id="container_vessel"
                      value={newContainer.vessel}
                      onChange={(e) => setNewContainer({ ...newContainer, vessel: e.target.value })}
                      placeholder="Ex: MSC OSCAR"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="container_status">Statut</Label>
                    <Select
                      value={newContainer.status}
                      onValueChange={(value: any) => setNewContainer({ ...newContainer, status: value })}
                    >
                      <SelectTrigger className="text-base sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planifié</SelectItem>
                        <SelectItem value="departed">Parti</SelectItem>
                        <SelectItem value="in_transit">En transit</SelectItem>
                        <SelectItem value="arrived">Arrivé</SelectItem>
                        <SelectItem value="delivered">Livré</SelectItem>
                        <SelectItem value="delayed">Retardé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="container_departure_port">Port de départ</Label>
                    <Input
                      id="container_departure_port"
                      value={newContainer.departure_port}
                      onChange={(e) => setNewContainer({ ...newContainer, departure_port: e.target.value })}
                      placeholder="Ex: Port d'Anvers, Belgique"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="container_arrival_port">Port d'arrivée</Label>
                    <Input
                      id="container_arrival_port"
                      value={newContainer.arrival_port}
                      onChange={(e) => setNewContainer({ ...newContainer, arrival_port: e.target.value })}
                      placeholder="Ex: Port de Douala, Cameroun"
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="container_etd">Date de départ estimée (ETD)</Label>
                    <Input
                      id="container_etd"
                      type="datetime-local"
                      value={newContainer.etd}
                      onChange={(e) => setNewContainer({ ...newContainer, etd: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="container_eta">Date d'arrivée estimée (ETA)</Label>
                    <Input
                      id="container_eta"
                      type="datetime-local"
                      value={newContainer.eta}
                      onChange={(e) => setNewContainer({ ...newContainer, eta: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                {error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateContainerDialogOpen(false)
                      setError("")
                    }} 
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">Créer le conteneur</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par numéro, nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterContainer} onValueChange={setFilterContainer}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Filtrer par conteneur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les conteneurs</SelectItem>
                    {containers.map((container) => (
                      <SelectItem key={container.id} value={container.id}>
                        {container.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Commandes ({filteredOrders.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Eye className="h-4 w-4" />
              <span>Cliquez sur une ligne pour modifier la commande</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Version Desktop - Tableau */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    return (
                    <TableRow 
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50 hover:shadow-sm hover:scale-[1.01] transition-all duration-200 ease-in-out group"
                      onClick={() => handleEditOrder(order)}
                    >
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-2">
                          {order.order_number}
                          <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.client_name}</div>
                          <div className="text-sm text-muted-foreground">{order.client_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.recipient_name || order.client_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.recipient_email || order.client_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getServiceTypeLabel(order.service_type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.origin}</div>
                          <div className="text-muted-foreground">→ {order.destination}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.container_code ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {order.container_code}
                            </Badge>
                            {order.container_status && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {order.container_status.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.value ? `€${order.value.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center gap-1"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                                <span className="hidden xl:inline">Proforma</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateProformaPdf(order)
                                }}
                                className="flex items-center gap-2"
                              >
                                <FileDown className="h-4 w-4" />
                                PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateProformaDocx(order)
                                }}
                                className="flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                DOCX
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateInvoice(order)
                            }}
                            className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Version Mobile - Cartes */}
            <div className="lg:hidden space-y-4">
              {filteredOrders.map((order) => {
                return (
                <Card 
                  key={order.id} 
                  className="p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-in-out cursor-pointer"
                  onClick={() => handleEditOrder(order)}
                >
                  <div className="space-y-3">
                    {/* Header avec numéro et statut */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-lg font-mono">{order.order_number}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.client_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Service:</span>
                        <p className="font-medium">{getServiceTypeLabel(order.service_type)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valeur:</span>
                        <p className="font-medium">{order.value ? `€${order.value.toLocaleString()}` : '-'}</p>
                      </div>
                    </div>

                    {/* Destinataire */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Destinataire:</span>
                      <p className="font-medium">{order.recipient_name || order.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.recipient_email || order.client_email}
                      </p>
                    </div>

                    {/* Trajet */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Trajet:</span>
                      <p className="font-medium">{order.origin} → {order.destination}</p>
                    </div>

                    {/* Conteneur */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Conteneur:</span>
                      {order.container_code ? (
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {order.container_code}
                          </Badge>
                          {order.container_status && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {order.container_status.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="font-medium text-muted-foreground">Aucun</p>
                      )}
                    </div>

                    {/* Date et actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center gap-1"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                              <span className="ml-1">Proforma</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGenerateProformaPdf(order)
                              }}
                              className="flex items-center gap-2"
                            >
                              <FileDown className="h-4 w-4" />
                              PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGenerateProformaDocx(order)
                              }}
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              DOCX
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateInvoice(order)
                          }}
                          className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Facture</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de visualisation */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la commande</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Numéro de commande</Label>
                    <p className="font-mono">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <p>{selectedOrder.client_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.client_email}</p>
                    {selectedOrder.client_phone && (
                      <p className="text-sm text-muted-foreground">{selectedOrder.client_phone}</p>
                    )}
                  </div>
                  <div>
                    <Label>Service</Label>
                    <p>{getServiceTypeLabel(selectedOrder.service_type)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Destinataire</Label>
                    <p>{selectedOrder.recipient_name || selectedOrder.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.recipient_email || selectedOrder.client_email}
                    </p>
                    {(selectedOrder.recipient_phone || selectedOrder.client_phone) && (
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.recipient_phone || selectedOrder.client_phone}
                      </p>
                    )}
                    {selectedOrder.recipient_address && (
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.recipient_address}
                      </p>
                    )}
                    {(selectedOrder.recipient_postal_code || selectedOrder.recipient_city) && (
                      <p className="text-sm text-muted-foreground">
                        {[selectedOrder.recipient_postal_code, selectedOrder.recipient_city]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    )}
                    {selectedOrder.recipient_country && (
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.recipient_country}
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:block" />
                </div>
                <div>
                  <Label>Trajet</Label>
                  <p>{selectedOrder.origin} → {selectedOrder.destination}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Poids</Label>
                    <p>{selectedOrder.weight ? `${selectedOrder.weight} kg` : '-'}</p>
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <p>{selectedOrder.value ? `€${selectedOrder.value.toLocaleString()}` : '-'}</p>
                  </div>
                  <div>
                    <Label>Livraison estimée</Label>
                    <p>{selectedOrder.estimated_delivery ? new Date(selectedOrder.estimated_delivery).toLocaleDateString('fr-FR') : '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de création</Label>
                    <p>{new Date(selectedOrder.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <Label>Dernière mise à jour</Label>
                    <p>{new Date(selectedOrder.updated_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>

              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de modification */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
          <DialogContent className="max-w-4xl w-full sm:w-[92vw] lg:w-[80vw] max-h-[90vh] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out p-4 sm:p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl">Modifier la commande {selectedOrder?.order_number}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Modifiez les informations de la commande
              </DialogDescription>
              {currentUser && (
                <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  Modifié par : <span className="font-medium">{currentUser.name}</span>
                </div>
              )}
            </DialogHeader>

            {notifyOrderFeedback.type && (
              <Alert variant={notifyOrderFeedback.type === 'error' ? 'destructive' : undefined}>
                <AlertDescription>{notifyOrderFeedback.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdateOrder} className="space-y-4 sm:space-y-6">
              <div className="space-y-3 rounded-lg border border-orange-100 bg-orange-50/20 p-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,240px)] sm:items-start">
                  <div className="space-y-2">
                    <Label htmlFor="edit_order_customer">Client associé</Label>
                    <Select
                      value={editOrder.customer_id || "custom"}
                      onValueChange={handleEditOrderClientSelect}
                    >
                      <SelectTrigger id="edit_order_customer" className="w-full text-left">
                        <SelectValue placeholder="Associer la commande à un client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Client personnalisé</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || "Sans nom"} {client.email ? `– ${client.email}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-md border border-orange-100 bg-white/80 p-3 text-xs sm:text-sm">
                    {selectedEditCustomer ? (
                      <div className="space-y-1">
                        <p className="font-medium leading-tight">
                          {selectedEditCustomer.name || "Sans nom"}
                        </p>
                        {selectedEditCustomer.email && (
                          <p className="text-muted-foreground break-words">
                            {selectedEditCustomer.email}
                          </p>
                        )}
                        {selectedEditCustomer.phone && (
                          <p className="text-muted-foreground">{selectedEditCustomer.phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Sélectionne un client ou laisse “Client personnalisé”.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rôle du client</Label>
                  <div className="flex flex-wrap gap-2">
                    {clientRoleChoices.map((option) => (
                      <label
                        key={option.value}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm transition-colors ${
                          editClientRole === option.value
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-orange-200 bg-white text-muted-foreground hover:border-orange-300"
                        } ${!editOrder.customer_id && option.value !== "none" ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                          value={option.value}
                          checked={editClientRole === option.value}
                          onChange={() => handleEditClientRoleChange(option.value)}
                          disabled={!editOrder.customer_id && option.value !== "none"}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {!editOrder.customer_id && (
                    <p className="text-xs text-muted-foreground">
                      Sélectionne un client avant d’assigner son rôle.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Expéditeur */}
                <div className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-semibold">Expéditeur</h3>
                      <Badge
                        variant="outline"
                        className={
                          editClientRole === "sender" || editClientRole === "both"
                            ? "border-orange-300 bg-orange-50 text-orange-700"
                            : "border-dashed border-orange-200 text-muted-foreground"
                        }
                      >
                        {editClientRole === "sender" || editClientRole === "both"
                          ? "Client associé"
                          : "Formulaire manuel"}
                      </Badge>
                    </div>
                    <Select value={editSenderClientId} onValueChange={handleEditSenderSelect}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Sélectionner un expéditeur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Saisie manuelle</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || "Sans nom"} {client.email ? `– ${client.email}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_client_name">Nom de l’expéditeur *</Label>
                    <Input
                      id="edit_client_name"
                      value={editOrder.client_name}
                      onChange={(e) => setEditOrder({ ...editOrder, client_name: e.target.value })}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_client_email">Email de l’expéditeur *</Label>
                    <Input
                      id="edit_client_email"
                      type="email"
                      value={editOrder.client_email}
                      onChange={(e) => setEditOrder({ ...editOrder, client_email: e.target.value })}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_client_phone">Téléphone de l’expéditeur</Label>
                    <Input
                      id="edit_client_phone"
                      value={editOrder.client_phone}
                      onChange={(e) => setEditOrder({ ...editOrder, client_phone: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>

                {/* Informations de service */}
                <div className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-300" style={{ animationDelay: '100ms' }}>
                  <h3 className="text-base sm:text-lg font-semibold">Service</h3>
                  <div>
                    <Label htmlFor="edit_service_type">Type de service *</Label>
                    <Select
                      value={editOrder.service_type}
                      onValueChange={(value) => setEditOrder({ ...editOrder, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fret_maritime">Fret Maritime</SelectItem>
                        <SelectItem value="fret_aerien">Fret Aérien</SelectItem>
                        <SelectItem value="demenagement">Déménagement</SelectItem>
                        <SelectItem value="colis">Colis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_status">Statut *</Label>
                    <Select
                      value={editOrder.status}
                      onValueChange={(value) => setEditOrder({ ...editOrder, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-orange-100 bg-orange-50/30 p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-orange-700">Destinataire</p>
                    <p className="text-xs text-muted-foreground">
                      Si le destinataire diffère de l’expéditeur, renseigne ses coordonnées ci-dessous.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      editClientRole === "recipient" || editClientRole === "both"
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-dashed border-orange-200 text-muted-foreground"
                    }
                  >
                    {editClientRole === "recipient" || editClientRole === "both"
                      ? "Client associé"
                      : "Formulaire manuel"}
                  </Badge>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
                    <Select value={editRecipientClientId} onValueChange={handleEditRecipientSelect}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Sélectionner un destinataire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Saisie manuelle</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || "Sans nom"} {client.email ? `– ${client.email}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={copyClientToRecipientForEdit}>
                      Copier l’expéditeur
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="edit_recipient_name">Nom du destinataire</Label>
                    <Input
                      id="edit_recipient_name"
                      value={editOrder.recipient_name}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_name: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_recipient_email">Email du destinataire</Label>
                    <Input
                      id="edit_recipient_email"
                      type="email"
                      value={editOrder.recipient_email}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_email: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="edit_recipient_phone">Téléphone du destinataire</Label>
                    <Input
                      id="edit_recipient_phone"
                      value={editOrder.recipient_phone}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_phone: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="hidden lg:block" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="edit_recipient_address">Adresse du destinataire</Label>
                    <Input
                      id="edit_recipient_address"
                      value={editOrder.recipient_address}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_address: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_recipient_postal_code">Code postal du destinataire</Label>
                    <Input
                      id="edit_recipient_postal_code"
                      value={editOrder.recipient_postal_code}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_postal_code: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_recipient_city">Ville du destinataire</Label>
                    <Input
                      id="edit_recipient_city"
                      value={editOrder.recipient_city}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_city: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Label htmlFor="edit_recipient_country">Pays du destinataire</Label>
                    <Input
                      id="edit_recipient_country"
                      value={editOrder.recipient_country}
                      onChange={(e) => setEditOrder({ ...editOrder, recipient_country: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Trajet */}
                <div className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300" style={{ animationDelay: '200ms' }}>
                  <h3 className="text-base sm:text-lg font-semibold">Trajet</h3>
                  <div>
                    <Label htmlFor="edit_origin">Origine *</Label>
                    <Input
                      id="edit_origin"
                      value={editOrder.origin}
                      onChange={(e) => setEditOrder({ ...editOrder, origin: e.target.value })}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_destination">Destination *</Label>
                    <Input
                      id="edit_destination"
                      value={editOrder.destination}
                      onChange={(e) => setEditOrder({ ...editOrder, destination: e.target.value })}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>

                {/* Détails */}
                <div className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-300" style={{ animationDelay: '300ms' }}>
                  <h3 className="text-base sm:text-lg font-semibold">Détails</h3>
                  <div>
                    <Label htmlFor="edit_weight">Poids</Label>
                    <Input
                      id="edit_weight"
                      value={editOrder.weight}
                      onChange={(e) => setEditOrder({ ...editOrder, weight: e.target.value })}
                      placeholder="Ex: 25 kg"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_value">Valeur</Label>
                    <Input
                      id="edit_value"
                      value={editOrder.value}
                      onChange={(e) => setEditOrder({ ...editOrder, value: e.target.value })}
                      placeholder="Ex: 500€"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_estimated_delivery">Livraison estimée</Label>
                    <Input
                      id="edit_estimated_delivery"
                      type="date"
                      value={editOrder.estimated_delivery}
                      onChange={(e) => setEditOrder({ ...editOrder, estimated_delivery: e.target.value })}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_container_id">Conteneur</Label>
                    <Select
                      value={editOrder.container_id || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setEditOrder({
                            ...editOrder,
                            container_id: "",
                            container_code: "",
                          })
                        } else {
                          const selected = containers.find((container) => container.id === value)
                          setEditOrder({
                            ...editOrder,
                            container_id: value,
                            container_code: selected?.code || "",
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun conteneur assigné" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {containers.length === 0 ? (
                          <SelectItem value="no-containers" disabled>
                            Aucun conteneur disponible
                          </SelectItem>
                        ) : (
                          containers.map((container) => (
                            <SelectItem key={container.id} value={container.id}>
                              {container.code} {container.status && `(${container.status.replace(/_/g, " ")})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setIsCreateContainerDialogOpen(true)}
                    >
                      + Créer un nouveau conteneur
                    </Button>
                    {editOrder.container_id && (() => {
                      const selectedContainer = containers.find((container) => container.id === editOrder.container_id)
                      return (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {editOrder.container_code || selectedContainer?.code || "N/A"}
                            </Badge>
                            {selectedContainer?.status && (
                              <Badge variant="secondary" className="text-xs">
                                {selectedContainer.status.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                          {selectedContainer && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {selectedContainer.vessel && (
                                <div>Navire: <span className="font-medium">{selectedContainer.vessel}</span></div>
                              )}
                              {selectedContainer.departure_port && (
                                <div>Départ: <span className="font-medium">{selectedContainer.departure_port}</span></div>
                              )}
                              {selectedContainer.arrival_port && (
                                <div>Arrivée: <span className="font-medium">{selectedContainer.arrival_port}</span></div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>


              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => selectedOrder && handleGenerateInvoice(selectedOrder)}
                    className="w-full sm:w-auto flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden xs:inline">Générer une facture</span>
                    <span className="xs:hidden">Facture</span>
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={triggerOrderNotification}
                    disabled={isNotifyingOrder || !selectedOrder}
                    className="w-full sm:w-auto flex items-center gap-2"
                  >
                    {isNotifyingOrder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Notifier le client
                  </Button>
                </div>
                {selectedOrder && (
                  <div className="pt-2 text-xs text-muted-foreground lg:flex-1 lg:max-w-sm">
                    {hasNotifiedCurrentStatus && orderNotificationInfo
                      ? `Destinataire déjà notifié pour le statut "${getStatusLabel(currentOrderStatusForNotification)}" le ${formatDateTime(orderNotificationInfo.timestamp)}.`
                      : orderNotificationInfo
                      ? `Dernière notification envoyée : statut "${getStatusLabel(orderNotificationInfo.status)}" le ${formatDateTime(orderNotificationInfo.timestamp)}.`
                      : "Aucune notification envoyée via cette interface pour le moment."}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleEditDialogChange(false)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    Mettre à jour la commande
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
