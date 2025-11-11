import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoiceData {
  invoiceNumber?: string
  issueDate?: string
  issueLocation?: string
  order: {
    id: string
    order_number: string
    client_name: string
    client_email: string
    client_phone?: string
    client_address?: string
    client_city?: string
    client_postal_code?: string
    client_country?: string
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
    website?: string
    siret: string
    tva: string
    iban?: string
    bic?: string
  }
  items?: InvoiceItem[]
  billingAddress?: {
    name: string
    address?: string
    postal_code?: string
    city?: string
    country?: string
  }
  shippingAddress?: {
    name: string
    address?: string
    postal_code?: string
    city?: string
    country?: string
  }
  taxRate?: number
  paymentMethod?: string
}

export const generateInvoice = async (data: InvoiceData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Couleurs
  const orangeColor = [255, 140, 0] // Orange Danemo
  const whiteColor = [255, 255, 255]
  const blackColor = [0, 0, 0]
  const grayColor = [128, 128, 128]
  
  // Calculs financiers
  let subtotal = 0
  let taxRate = data.taxRate || 0
  let taxAmount = 0
  let total = 0
  
  // Si des items sont fournis, calculer depuis les items
  if (data.items && data.items.length > 0) {
    subtotal = data.items.reduce((sum, item) => sum + item.total, 0)
    taxAmount = subtotal * (taxRate / 100)
    total = subtotal + taxAmount
  } else {
    // Sinon, utiliser la valeur de la commande
    subtotal = data.order.value || 0
    taxAmount = subtotal * (taxRate / 100)
    total = subtotal + taxAmount
  }
  
  // Formatage de la date
  const issueDate = data.issueDate 
    ? new Date(data.issueDate)
    : new Date(data.order.created_at)
  const dateStr = issueDate.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase()
  const location = data.issueLocation || 'Bruxelles'
  
  // Numéro de facture
  const invoiceNumber = data.invoiceNumber || data.order.order_number
  
  // Adresses
  const billingAddress = data.billingAddress || {
    name: data.order.client_name,
    address: data.order.client_address,
    postal_code: data.order.client_postal_code,
    city: data.order.client_city,
    country: data.order.client_country
  }
  
  const shippingAddress = data.shippingAddress || billingAddress
  
  // Marges
  const margin = 15
  const rightMargin = pageWidth - margin
  
  // Fonction pour tronquer le texte si nécessaire
  const truncateText = (text: string, maxWidth: number, fontSize: number) => {
    pdf.setFontSize(fontSize)
    const textWidth = pdf.getTextWidth(text)
    if (textWidth <= maxWidth) return text
    // Tronquer avec "..."
    let truncated = text
    while (pdf.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '...'
  }
  
  // ========== EN-TÊTE ==========
  // Bandeau orange avec "FACTURE"
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.rect(0, 0, 60, 25, 'F')
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FACTURE', 5, 18)
  
  // Numéro de facture sous "FACTURE"
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`N°${invoiceNumber}`, 5, 25)
  
  // Logo et informations entreprise (haut droite)
  const logoX = rightMargin - 50
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  
  // Logo (cercle orange avec D)
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.circle(logoX + 15, 12, 8, 'F')
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  // Centrer le D dans le cercle
  const dWidth = pdf.getTextWidth('D')
  pdf.text('D', logoX + 15 - dWidth / 2, 15.5)
  
  // Nom entreprise
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DANEMO', logoX, 22)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.text('SRL', logoX + 22, 22)
  
  // Slogan (tronquer si trop long)
  pdf.setFontSize(7)
  const slogan = 'IMPORT & EXPORT GROUPAGE ET TRANSPORT MARITIME'
  const sloganWidth = pdf.getTextWidth(slogan)
  const maxSloganWidth = rightMargin - logoX
  if (sloganWidth > maxSloganWidth) {
    // Réduire la taille de police si nécessaire
    pdf.setFontSize(6)
  }
  pdf.text(slogan, logoX, 27)
  
  // Date et lieu (en orange, à droite du numéro de facture, mais ne pas dépasser)
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const dateLocationText = `${location}, le ${dateStr}`
  const dateLocationWidth = pdf.getTextWidth(dateLocationText)
  const dateLocationX = Math.min(70, rightMargin - dateLocationWidth - 5)
  pdf.text(dateLocationText, dateLocationX, 25)
  
  // ========== ADRESSES ==========
  let yPos = 50
  
  // Adresse de facturation (gauche)
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Adresse de facturation:', margin, yPos)
  
  yPos += 6
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  
  const maxAddressWidth = (pageWidth / 2) - margin - 10
  const billingName = truncateText(billingAddress.name, maxAddressWidth, 9)
  pdf.text(billingName, margin, yPos)
  if (billingAddress.postal_code) {
    yPos += 5
    pdf.text(billingAddress.postal_code, margin, yPos)
  }
  if (billingAddress.city && billingAddress.country) {
    yPos += 5
    const cityCountry = truncateText(`${billingAddress.city.toUpperCase()} - ${billingAddress.country.toUpperCase()}`, maxAddressWidth, 9)
    pdf.text(cityCountry, margin, yPos)
  } else if (billingAddress.city) {
    yPos += 5
    const city = truncateText(billingAddress.city.toUpperCase(), maxAddressWidth, 9)
    pdf.text(city, margin, yPos)
  } else if (billingAddress.country) {
    yPos += 5
    const country = truncateText(billingAddress.country.toUpperCase(), maxAddressWidth, 9)
    pdf.text(country, margin, yPos)
  }
  
  // Adresse de livraison (droite)
  yPos = 50
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  const shippingLabelX = Math.max(logoX, pageWidth / 2 + 5)
  pdf.text('Adresse de livraison', shippingLabelX, yPos)
  
  yPos += 6
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const maxShippingWidth = rightMargin - shippingLabelX
  const shippingName = truncateText(shippingAddress.name, maxShippingWidth, 9)
  pdf.text(shippingName, shippingLabelX, yPos)
  if (shippingAddress.postal_code) {
    yPos += 5
    pdf.text(shippingAddress.postal_code, shippingLabelX, yPos)
  }
  if (shippingAddress.city && shippingAddress.country) {
    yPos += 5
    const cityCountry = truncateText(`${shippingAddress.city.toUpperCase()} - ${shippingAddress.country.toUpperCase()}`, maxShippingWidth, 9)
    pdf.text(cityCountry, shippingLabelX, yPos)
  } else if (shippingAddress.city) {
    yPos += 5
    const city = truncateText(shippingAddress.city.toUpperCase(), maxShippingWidth, 9)
    pdf.text(city, shippingLabelX, yPos)
  } else if (shippingAddress.country) {
    yPos += 5
    const country = truncateText(shippingAddress.country.toUpperCase(), maxShippingWidth, 9)
    pdf.text(country, shippingLabelX, yPos)
  }
  
  // ========== TABLEAU DES PRODUITS ==========
  yPos = 85
  
  // En-têtes du tableau (fond orange, texte blanc)
  const tableStartX = margin
  const tableWidth = pageWidth - (margin * 2)
  const colWidths = [tableWidth * 0.45, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.25]
  const colPositions = [
    tableStartX,
    tableStartX + colWidths[0],
    tableStartX + colWidths[0] + colWidths[1],
    tableStartX + colWidths[0] + colWidths[1] + colWidths[2]
  ]
  
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.rect(tableStartX, yPos - 6, tableWidth, 8, 'F')
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DESCRIPTION', colPositions[0] + 2, yPos)
  pdf.text('QUANTITES', colPositions[1] + 2, yPos)
  pdf.text('P.U', colPositions[2] + 2, yPos)
  pdf.text('PRIX TOTAL', colPositions[3] + 2, yPos)
  
  // Lignes du tableau
  yPos += 8
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  
  const items = data.items || [
    {
      description: data.order.service_type,
      quantity: 1,
      unitPrice: subtotal,
      total: subtotal
    }
  ]
  
  items.forEach((item, index) => {
    const rowY = yPos + (index * 8)
    
    // Bordures du tableau
    pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2])
    pdf.setLineWidth(0.1)
    pdf.line(tableStartX, rowY - 4, tableStartX + tableWidth, rowY - 4)
    
    // Contenu - tronquer les descriptions longues
    const maxDescWidth = colWidths[0] - 4
    const description = truncateText(item.description, maxDescWidth, 9)
    pdf.text(description, colPositions[0] + 2, rowY)
    pdf.text(item.quantity.toString(), colPositions[1] + 2, rowY)
    // Format français : prix unitaire avec décimales si nécessaire
    const unitPriceStr = item.unitPrice % 1 === 0 
      ? `${item.unitPrice.toFixed(0)}€`
      : `${item.unitPrice.toFixed(2).replace('.', ',')}€`
    pdf.text(unitPriceStr, colPositions[2] + 2, rowY)
    // Format français : prix total sans décimales (arrondi)
    const totalStr = `${Math.round(item.total).toLocaleString('fr-FR')} €`
    pdf.text(totalStr, colPositions[3] + 2, rowY)
  })
  
  // Bordure inférieure du tableau
  const tableEndY = yPos + (items.length * 8)
  pdf.line(tableStartX, tableEndY, tableStartX + tableWidth, tableEndY)
  
  // ========== RÉSUMÉ FINANCIER ==========
  yPos = tableEndY + 15
  
  // Aligner le résumé à droite avec une marge
  const summaryLabelWidth = 50
  const summaryValueWidth = 30
  const summaryX = rightMargin - summaryLabelWidth - summaryValueWidth
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  
  // Sous-total
  pdf.text('Sous-total', summaryX, yPos)
  const subtotalText = `${subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
  const subtotalWidth = pdf.getTextWidth(subtotalText)
  pdf.text(subtotalText, rightMargin - subtotalWidth, yPos)
  
  yPos += 6
  pdf.text('Taux de TVA', summaryX, yPos)
  const taxRateText = `${taxRate}`
  const taxRateWidth = pdf.getTextWidth(taxRateText)
  pdf.text(taxRateText, rightMargin - taxRateWidth, yPos)
  
  yPos += 6
  pdf.text('TVA', summaryX, yPos)
  const taxAmountText = `${taxAmount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const taxAmountWidth = pdf.getTextWidth(taxAmountText)
  pdf.text(taxAmountText, rightMargin - taxAmountWidth, yPos)
  
  yPos += 8
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.text('TOTAL', summaryX, yPos)
  const totalText = `${total.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
  const totalWidth = pdf.getTextWidth(totalText)
  pdf.text(totalText, rightMargin - totalWidth, yPos)
  
  // ========== DÉTAILS DE PAIEMENT ==========
  yPos += 20
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Détails de payement:', margin, yPos)
  
  yPos += 6
  pdf.setFont('helvetica', 'normal')
  const paymentMethod = data.paymentMethod || 'Par virement bancaire'
  const maxPaymentWidth = rightMargin - margin
  const paymentMethodText = truncateText(paymentMethod, maxPaymentWidth, 9)
  pdf.text(paymentMethodText, margin, yPos)
  
  if (data.company.bic && data.company.iban) {
    yPos += 6
    const bankInfo = `BIC: ${data.company.bic} - IBAN: ${data.company.iban}`
    const bankInfoText = truncateText(bankInfo, maxPaymentWidth, 9)
    pdf.text(bankInfoText, margin, yPos)
  }
  
  // ========== FOOTER ==========
  const footerY = pageHeight - 15
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.rect(0, footerY, pageWidth, 15, 'F')
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  
  // Footer avec informations alignées horizontalement
  const footerYText = footerY + 10
  let footerX = margin
  const footerSpacing = 5
  const maxFooterWidth = rightMargin - margin
  
  // Calculer la largeur totale pour vérifier si tout rentre
  let totalFooterWidth = 0
  const footerParts: string[] = []
  
  if (data.company.website) {
    const website = data.company.website.replace(/^https?:\/\//, '').replace(/^www\./, '')
    footerParts.push(`www.${website}`)
  }
  
  if (data.company.phone) {
    footerParts.push(data.company.phone)
  }
  
  if (data.company.email) {
    footerParts.push(data.company.email)
  }
  
  if (data.company.tva) {
    footerParts.push(`TVA: ${data.company.tva}`)
  }
  
  if (data.company.address) {
    footerParts.push(data.company.address)
  }
  
  // Calculer si on doit réduire l'espacement ou la taille
  totalFooterWidth = footerParts.reduce((sum, part) => {
    pdf.setFontSize(8)
    return sum + pdf.getTextWidth(part) + footerSpacing
  }, 0) - footerSpacing
  
  // Si le footer dépasse, réduire la taille de police
  let footerFontSize = 8
  if (totalFooterWidth > maxFooterWidth) {
    footerFontSize = 7
    pdf.setFontSize(footerFontSize)
    totalFooterWidth = footerParts.reduce((sum, part) => {
      return sum + pdf.getTextWidth(part) + footerSpacing
    }, 0) - footerSpacing
  }
  
  // Si ça dépasse encore, réduire l'espacement
  let actualSpacing = footerSpacing
  if (totalFooterWidth > maxFooterWidth) {
    actualSpacing = Math.max(2, (maxFooterWidth - (totalFooterWidth - (footerParts.length - 1) * footerSpacing)) / (footerParts.length - 1))
  }
  
  // Afficher les parties du footer
  pdf.setFontSize(footerFontSize)
  footerParts.forEach((part, index) => {
    if (index > 0) {
      footerX += actualSpacing
    }
    // Tronquer si nécessaire
    const partWidth = pdf.getTextWidth(part)
    const remainingWidth = rightMargin - footerX
    if (partWidth > remainingWidth) {
      const truncated = truncateText(part, remainingWidth, footerFontSize)
      pdf.text(truncated, footerX, footerYText)
      footerX += pdf.getTextWidth(truncated)
    } else {
      pdf.text(part, footerX, footerYText)
      footerX += partWidth
    }
  })
  
  // Télécharger la facture
  pdf.save(`facture-${invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// Données de l'entreprise par défaut
export const defaultCompanyData = {
  name: 'DANEMO SRL',
  address: 'Rue de la croix de pierre 55 - 1060 Bruxelles - Belgique',
  phone: '0488 64 51 83',
  email: 'info@danemo.be',
  website: 'www.danemo.be',
  siret: '123 456 789 01234',
  tva: 'BE0769.814.467',
  iban: 'BE94 3632 1173 8714',
  bic: 'BBRUBEBB',
}
