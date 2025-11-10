import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export interface InvoiceData {
  order: {
    id: string
    order_number: string
    client_name: string
    client_email: string
    client_phone?: string
    service_type: string
    origin: string
    destination: string
    weight?: number
    value?: number
    status: string
    created_at: string
  }
  company: {
    name: string
    address: string
    phone: string
    email: string
    siret: string
    tva: string
    iban?: string
    bic?: string
  }
}

export const generateInvoice = async (data: InvoiceData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Couleurs
  const primaryColor = [255, 140, 0] // Orange Danemo
  const secondaryColor = [107, 114, 128] // Gris
  const lightGray = [243, 244, 246]
  
  // Fonction utilitaire pour vérifier la pagination
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition > pageHeight - requiredSpace) {
      pdf.addPage()
      yPosition = 20
      return true
    }
    return false
  }
  
  // Calculs financiers
  const baseAmount = data.order.value || 0
  const tvaRate = 0.20 // TVA 20%
  const commissionRate = 0.10 // Commission 10%
  
  const tvaAmount = baseAmount * tvaRate
  const commissionAmount = baseAmount * commissionRate
  const subtotal = baseAmount - commissionAmount
  const total = subtotal + tvaAmount
  
  // En-tête de la facture (plus compact)
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  // Logo et nom de l'entreprise
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DANEMO', 15, 20)
  
  // Informations de l'entreprise (plus compactes)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.company.name, 15, 28)
  pdf.text(data.company.address, 15, 32)
  pdf.text(`Tél: ${data.company.phone} | Email: ${data.company.email}`, 15, 36)
  pdf.text(`SIRET: ${data.company.siret} | TVA: ${data.company.tva}`, 15, 40)
  if (data.company.iban && data.company.bic) {
    pdf.text(`IBAN: ${data.company.iban} | BIC: ${data.company.bic}`, 15, 44)
  }
  
  // Numéro de facture et date
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FACTURE', pageWidth - 50, 20)
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`N° ${data.order.order_number}`, pageWidth - 50, 28)
  pdf.text(`Date: ${new Date(data.order.created_at).toLocaleDateString('fr-FR')}`, pageWidth - 50, 32)
  pdf.text(`Statut: ${data.order.status}`, pageWidth - 50, 36)
  
  // Informations client (plus compact)
  let yPosition = 50
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FACTURÉ À:', 15, yPosition)
  
  yPosition += 8
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.order.client_name, 15, yPosition)
  yPosition += 4
  pdf.text(data.order.client_email, 15, yPosition)
  if (data.order.client_phone) {
    yPosition += 4
    pdf.text(data.order.client_phone, 15, yPosition)
  }
  
  // Détails de la commande (plus compact)
  yPosition += 15
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DÉTAILS DE LA COMMANDE:', 15, yPosition)
  
  yPosition += 10
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  
  // Tableau des détails (plus compact)
  const tableData = [
    ['Service', data.order.service_type],
    ['Origine', data.order.origin],
    ['Destination', data.order.destination],
    ['Poids', data.order.weight ? `${data.order.weight} kg` : 'N/A'],
    ['Valeur déclarée', data.order.value ? `€${data.order.value.toLocaleString()}` : 'N/A']
  ]
  
  tableData.forEach(([label, value]) => {
    pdf.text(`${label}:`, 15, yPosition)
    pdf.text(value, 70, yPosition)
    yPosition += 6
  })
  
  // Vérifier si on a besoin d'une nouvelle page
  checkPageBreak(80)
  
  // Calculs financiers (plus compact)
  yPosition += 15
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CALCULS FINANCIERS:', 15, yPosition)
  
  yPosition += 10
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  
  // Tableau des calculs (plus compact)
  const calculations = [
    ['Montant de base', `€${baseAmount.toLocaleString()}`],
    ['Commission (10%)', `-€${commissionAmount.toLocaleString()}`],
    ['Sous-total', `€${subtotal.toLocaleString()}`],
    ['TVA (20%)', `€${tvaAmount.toLocaleString()}`],
    ['TOTAL', `€${total.toLocaleString()}`]
  ]
  
  calculations.forEach(([label, value]) => {
    pdf.text(`${label}:`, 15, yPosition)
    pdf.text(value, 100, yPosition)
    yPosition += 6
  })
  
  // Vérifier si on a besoin d'une nouvelle page pour le QR Code
  checkPageBreak(60)
  
  // QR Code avec informations de la commande (plus compact)
  yPosition += 15
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('QR CODE - INFORMATIONS COMMANDE:', 15, yPosition)
  
  // Données pour le QR code
  const qrData = {
    order_number: data.order.order_number,
    client: data.order.client_name,
    service: data.order.service_type,
    route: `${data.order.origin} → ${data.order.destination}`,
    value: data.order.value,
    status: data.order.status,
    created: data.order.created_at,
    total: total,
    invoice_date: new Date().toISOString()
  }
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    pdf.addImage(qrCodeDataURL, 'PNG', 15, yPosition + 8, 25, 25)
    
    // Informations du QR code (plus compactes)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Scanner pour vérifier', 45, yPosition + 15)
    pdf.text('les détails de la commande', 45, yPosition + 20)
    
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error)
    pdf.setFontSize(8)
    pdf.text('QR Code non disponible', 15, yPosition + 20)
  }
  
  // Ajouter le pied de page sur toutes les pages
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    const footerY = pageHeight - 20
    pdf.setFontSize(7)
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    pdf.text('Merci pour votre confiance - Danemo', 15, footerY)
    pdf.text(`Page ${i}/${totalPages}`, pageWidth - 30, footerY)
    
    // Ligne de séparation (plus fine)
    pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
    pdf.line(15, footerY - 8, pageWidth - 15, footerY - 8)
  }
  
  // Télécharger la facture
  pdf.save(`facture-${data.order.order_number}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// Données de l'entreprise par défaut
export const defaultCompanyData = {
  name: 'Danemo',
  address: '123 Rue de la Logistique, 75001 Paris, France',
  phone: '+33 1 23 45 67 89',
  email: 'contact@danemo.be',
  siret: '123 456 789 01234',
  tva: 'FR12 345678901',
  iban: 'BE71 0961 2345 6769',
  bic: 'GKCCBEBB',
}
