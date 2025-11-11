import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export interface QRPrintData {
  qrCode: string
  orderNumber: string
  clientName: string
  serviceType?: string
  origin?: string
  destination?: string
}

/**
 * Génère un PDF imprimable avec le QR code de la commande
 */
export const generateQRPrintPDF = async (data: QRPrintData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Couleurs
  const orangeColor = [255, 140, 0]
  const blackColor = [0, 0, 0]
  const grayColor = [200, 200, 200]
  
  // ========== EN-TÊTE ==========
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2])
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DANEMO', 15, 20)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('QR CODE DE COMMANDE', pageWidth - 15, 20, { align: 'right' })
  
  // ========== INFORMATIONS COMMANDE ==========
  let yPos = 50
  
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Informations de la commande', 15, yPos)
  
  yPos += 10
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  pdf.text(`Numéro de commande: ${data.orderNumber}`, 15, yPos)
  yPos += 7
  pdf.text(`Client: ${data.clientName}`, 15, yPos)
  
  if (data.serviceType) {
    yPos += 7
    const serviceLabel = data.serviceType === 'fret_maritime' ? 'Fret maritime' :
                         data.serviceType === 'fret_aerien' ? 'Fret aérien' :
                         data.serviceType === 'demenagement' ? 'Déménagement' :
                         data.serviceType
    pdf.text(`Service: ${serviceLabel}`, 15, yPos)
  }
  
  if (data.origin && data.destination) {
    yPos += 7
    pdf.text(`Trajet: ${data.origin} → ${data.destination}`, 15, yPos)
  }
  
  // ========== QR CODE ==========
  yPos += 20
  
  // Générer le QR code
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const qrUrl = `${baseUrl}/qr?code=${encodeURIComponent(data.qrCode)}`
    
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Centrer le QR code
    const qrSize = 60 // mm
    const qrX = (pageWidth - qrSize) / 2
    const qrY = yPos
    
    pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
    
    // Code QR en texte sous le QR code
    yPos += qrSize + 10
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'mono')
    pdf.text(data.qrCode, pageWidth / 2, yPos, { align: 'center' })
    
    // Instructions
    yPos += 10
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text('Scannez ce QR code pour suivre votre commande', pageWidth / 2, yPos, { align: 'center' })
    
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error)
    pdf.setFontSize(10)
    pdf.setTextColor(255, 0, 0)
    pdf.text('Erreur lors de la génération du QR code', 15, yPos)
  }
  
  // ========== FOOTER ==========
  const footerY = pageHeight - 20
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.line(15, footerY, pageWidth - 15, footerY)
  
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('www.danemo.be | info@danemo.be | 0488 64 51 83', pageWidth / 2, footerY + 10, { align: 'center' })
  
  // Générer le PDF et préparer pour l'impression
  if (typeof window !== 'undefined') {
    // Essayer d'ouvrir la fenêtre d'impression
    try {
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Ouvrir dans une nouvelle fenêtre pour impression
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        // Attendre que le PDF soit chargé avant d'imprimer
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print()
            // Nettoyer l'URL après l'impression
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl)
            }, 1000)
          }, 500)
        }, { once: true })
      } else {
        // Si la popup est bloquée, on télécharge juste le PDF
        console.warn('La fenêtre d\'impression a été bloquée. Le PDF sera téléchargé.')
        // Télécharger le PDF
        pdf.save(`qr-code-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
        URL.revokeObjectURL(pdfUrl)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error)
      // En cas d'erreur, télécharger le PDF
      pdf.save(`qr-code-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
    }
  } else {
    // Côté serveur, juste sauvegarder
    pdf.save(`qr-code-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

