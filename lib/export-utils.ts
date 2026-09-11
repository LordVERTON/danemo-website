import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

export interface ExportData {
  stats: {
    total: number
    pending: number
    confirmed: number
    in_progress: number
    completed: number
    cancelled: number
  }
  orders: Array<{
    id: string
    order_number: string
    client_name: string
    recipient_name?: string | null
    service_type: string
    status: string
    value?: number
    created_at: string
  }>
  timeRange: string
  periodLabel: string
}

export const exportToCSV = (data: ExportData) => {
  // Préparer les données pour le CSV
  const csvData = [
    // En-têtes
    ['Rapport Analytics', 'Danemo'],
    ['Période', data.periodLabel],
    ['Date de génération', new Date().toLocaleString('fr-FR')],
    [''],
    ['Statistiques générales'],
    ['Total commandes', data.stats.total],
    ['En attente', data.stats.pending],
    ['Confirmées', data.stats.confirmed],
    ['En cours', data.stats.in_progress],
    ['Terminées', data.stats.completed],
    ['Annulées', data.stats.cancelled],
    [''],
    ['Détail des commandes'],
    ['Numéro', 'Expéditeur', 'Destinataire', 'Service', 'Statut', 'Valeur', 'Date']
  ]

  // Ajouter les commandes
  data.orders.forEach(order => {
    csvData.push([
      order.order_number,
      order.client_name,
      order.recipient_name || order.client_name,
      order.service_type,
      order.status,
      order.value?.toString() || 'N/A',
      new Date(order.created_at).toLocaleDateString('fr-FR')
    ])
  })

  // Convertir en CSV
  const csv = Papa.unparse(csvData)
  
  // Créer et télécharger le fichier
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `analytics-danemo-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Fonction alternative pour l'export PDF sans graphiques (en cas d'erreur oklch)
export const exportToPDFSimple = async (data: ExportData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Fonction pour ajouter du texte
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
    pdf.setFontSize(fontSize)
    pdf.setTextColor(color)
    if (isBold) {
      pdf.setFont('helvetica', 'bold')
    } else {
      pdf.setFont('helvetica', 'normal')
    }
    pdf.text(text, 20, yPosition)
    yPosition += fontSize + 2
  }

  // Fonction pour ajouter une ligne
  const addLine = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10
  }

  // En-tête
  pdf.setFillColor(255, 140, 0) // Orange Danemo
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  addText('Rapport Analytics - Danemo', 20, true, '#FFFFFF')
  yPosition = 40

  // Informations générales
  addText(`Période: ${data.periodLabel}`, 14, true)
  addText(`Date de génération: ${new Date().toLocaleString('fr-FR')}`, 12)
  addLine()

  // Statistiques
  addText('Statistiques générales', 16, true, '#FF8C00')
  addText(`Total commandes: ${data.stats.total}`, 12)
  addText(`En attente: ${data.stats.pending}`, 12)
  addText(`Confirmées: ${data.stats.confirmed}`, 12)
  addText(`En cours: ${data.stats.in_progress}`, 12)
  addText(`Terminées: ${data.stats.completed}`, 12)
  addText(`Annulées: ${data.stats.cancelled}`, 12)
  addLine()

  // Tableau des commandes
  addText('Détail des commandes', 16, true, '#FF8C00')
  
  // En-têtes du tableau
  const tableHeaders = ['Numéro', 'Expéditeur', 'Destinataire', 'Service', 'Statut', 'Valeur', 'Date']
  const colWidths = [25, 35, 35, 30, 25, 25, 25]
  let xPosition = 20
  
  pdf.setFillColor(240, 240, 240)
  pdf.rect(xPosition, yPosition - 5, pageWidth - 40, 10, 'F')
  
  tableHeaders.forEach((header, index) => {
    addText(header, 10, true)
    xPosition += colWidths[index]
  })
  
  yPosition += 5
  addLine()

  // Données du tableau
  data.orders.slice(0, 20).forEach((order, index) => { // Limiter à 20 commandes pour éviter le débordement
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
    
    xPosition = 20
    const rowData = [
      order.order_number,
      order.client_name,
      order.recipient_name || order.client_name,
      order.service_type,
      order.status,
      order.value?.toString() || 'N/A',
      new Date(order.created_at).toLocaleDateString('fr-FR')
    ]
    
    rowData.forEach((cell, cellIndex) => {
      addText(cell, 9)
      xPosition += colWidths[cellIndex]
    })
    
    yPosition += 8
  })

  // Pied de page
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  pdf.text('Généré par Danemo Analytics', 20, pageHeight - 10)
  pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - 30, pageHeight - 10)

  // Télécharger le PDF
  pdf.save(`analytics-danemo-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportToPDF = async (data: ExportData, chartElements: HTMLElement[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Fonction pour ajouter du texte
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
    pdf.setFontSize(fontSize)
    pdf.setTextColor(color)
    if (isBold) {
      pdf.setFont('helvetica', 'bold')
    } else {
      pdf.setFont('helvetica', 'normal')
    }
    pdf.text(text, 20, yPosition)
    yPosition += fontSize + 2
  }

  // Fonction pour ajouter une ligne
  const addLine = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10
  }

  // Fonction pour convertir les couleurs oklch en hex
  const convertOklchToHex = (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element)
    const allElements = element.querySelectorAll('*')
    
    // Convertir les couleurs oklch en hex pour tous les éléments
    allElements.forEach((el) => {
      const style = (el as HTMLElement).style
      const computed = window.getComputedStyle(el)
      
      // Convertir les couleurs de fond
      if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
        style.backgroundColor = '#ffffff'
      }
      
      // Convertir les couleurs de bordure
      if (computed.borderColor && computed.borderColor.includes('oklch')) {
        style.borderColor = '#e5e7eb'
      }
      
      // Convertir les couleurs de texte
      if (computed.color && computed.color.includes('oklch')) {
        style.color = '#000000'
      }
    })
  }

  // En-tête
  pdf.setFillColor(255, 140, 0) // Orange Danemo
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  addText('Rapport Analytics - Danemo', 20, true, '#FFFFFF')
  yPosition = 40

  // Informations générales
  addText(`Période: ${data.periodLabel}`, 14, true)
  addText(`Date de génération: ${new Date().toLocaleString('fr-FR')}`, 12)
  addLine()

  // Statistiques
  addText('Statistiques générales', 16, true, '#FF8C00')
  addText(`Total commandes: ${data.stats.total}`, 12)
  addText(`En attente: ${data.stats.pending}`, 12)
  addText(`Confirmées: ${data.stats.confirmed}`, 12)
  addText(`En cours: ${data.stats.in_progress}`, 12)
  addText(`Terminées: ${data.stats.completed}`, 12)
  addText(`Annulées: ${data.stats.cancelled}`, 12)
  addLine()

  // Ajouter les graphiques avec gestion d'erreur oklch
  let hasOklchError = false
  
  for (let i = 0; i < chartElements.length; i++) {
    const element = chartElements[i]
    if (element) {
      try {
        // Convertir les couleurs oklch avant la capture
        convertOklchToHex(element)
        
        // Attendre un court délai pour que les styles soient appliqués
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          foreignObjectRendering: false,
          logging: false,
          removeContainer: true
        })
        
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - 40
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 10
      } catch (error) {
        console.error('Erreur lors de la capture du graphique:', error)
        
        // Si c'est une erreur oklch, utiliser la version simple
        if (error instanceof Error && error.message.includes('oklch')) {
          hasOklchError = true
          break
        }
        
        addText(`Erreur lors de la capture du graphique ${i + 1}`, 10, false, '#FF0000')
      }
    }
  }
  
  // Si erreur oklch détectée, utiliser la version simple
  if (hasOklchError) {
    console.log('Erreur oklch détectée, utilisation de la version simple')
    await exportToPDFSimple(data)
    return
  }

  // Tableau des commandes
  addText('Détail des commandes', 16, true, '#FF8C00')
  
  // En-têtes du tableau
  const tableHeaders = ['Numéro', 'Expéditeur', 'Destinataire', 'Service', 'Statut', 'Valeur', 'Date']
  const colWidths = [25, 35, 35, 30, 25, 25, 25]
  let xPosition = 20
  
  pdf.setFillColor(240, 240, 240)
  pdf.rect(xPosition, yPosition - 5, pageWidth - 40, 10, 'F')
  
  tableHeaders.forEach((header, index) => {
    addText(header, 10, true)
    xPosition += colWidths[index]
  })
  
  yPosition += 5
  addLine()

  // Données du tableau
  data.orders.slice(0, 20).forEach((order, index) => { // Limiter à 20 commandes pour éviter le débordement
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
    
    xPosition = 20
    const rowData = [
      order.order_number,
      order.client_name,
      order.recipient_name || order.client_name,
      order.service_type,
      order.status,
      order.value?.toString() || 'N/A',
      new Date(order.created_at).toLocaleDateString('fr-FR')
    ]
    
    rowData.forEach((cell, cellIndex) => {
      addText(cell, 9)
      xPosition += colWidths[cellIndex]
    })
    
    yPosition += 8
  })

  // Pied de page
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  pdf.text('Généré par Danemo Analytics', 20, pageHeight - 10)
  pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - 30, pageHeight - 10)

  // Télécharger le PDF
  pdf.save(`analytics-danemo-${new Date().toISOString().split('T')[0]}.pdf`)
}
