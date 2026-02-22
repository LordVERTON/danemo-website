import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export interface QRPrintData {
  qrCode: string
  orderNumber: string
  clientName: string
  recipientName?: string | null
  parcelsCount?: number | null
  serviceType?: string
  origin?: string
  destination?: string
}

// Convertir WEBP en PNG dataURL pour jsPDF
async function webpUrlToPngDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Impossible de charger le logo: ${url}`)
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  return canvas.toDataURL('image/png')
}

function fitRect(imgW: number, imgH: number, maxW: number, maxH: number): { w: number; h: number } {
  const ratio = Math.min(maxW / imgW, maxH / imgH, 1)
  return { w: imgW * ratio, h: imgH * ratio }
}

// Extraire Nom et Prénom d'un nom complet (format "Prénom Nom" ou "Nom Prénom")
function splitName(fullName: string): { nom: string; prenom: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { nom: fullName || '—', prenom: '—' }
  if (parts.length === 1) return { nom: parts[0], prenom: '—' }
  // Convention française : dernier mot = nom, reste = prénom
  const nom = parts[parts.length - 1] ?? '—'
  const prenom = parts.slice(0, -1).join(' ') || '—'
  return { nom, prenom }
}

/**
 * Génère un PDF imprimable avec le QR code du colis
 * Structure : Logo + Slogan | Nom | Prénom | QR CODE DU COLIS | Numéro de colis
 */
export const generateQRPrintPDF = async (data: QRPrintData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  const orangeColor = [255, 140, 0] as [number, number, number]
  const blackColor = [0, 0, 0] as [number, number, number]
  const grayColor = [180, 180, 180] as [number, number, number]

  const displayName = data.recipientName || data.clientName
  const { nom, prenom } = splitName(displayName)
  const slogan = 'IMPORT & EXPORT GROUPAGE ET TRANSPORT MARITIME'

  let yPos = margin

  // ========== EN-TÊTE : Logo (gauche) + Slogan (droite) ==========
  const logoMaxW = 45
  const logoMaxH = 35
  try {
    const logoUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/images/logo.webp`
      : '/images/logo.webp'
    const logoDataUrl = await webpUrlToPngDataUrl(logoUrl)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Logo load failed'))
      img.src = logoDataUrl
    })
    const { w: logoW, h: logoH } = fitRect(img.width, img.height, logoMaxW, logoMaxH)
    pdf.addImage(logoDataUrl, 'PNG', margin, yPos, logoW, logoH)
  } catch {
    pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2])
    pdf.rect(margin, yPos, logoMaxW, logoMaxH * 0.6, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DANEMO', margin + 5, yPos + logoMaxH * 0.35)
  }

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(slogan, pageWidth - margin, yPos + 12, { align: 'right' })

  yPos += logoMaxH + 15

  // ========== CADRE PRINCIPAL ==========
  const boxTop = yPos
  const boxBottom = pageHeight - margin - 25
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.rect(margin, boxTop, contentWidth, boxBottom - boxTop)

  yPos += 18

  // Nom (police assez grande)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text(nom.toUpperCase(), pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Prénom (police assez grande)
  pdf.setFontSize(20)
  pdf.text(prenom, pageWidth / 2, yPos, { align: 'center' })
  yPos += 25

  // Ligne séparatrice
  pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.line(margin + 20, yPos, pageWidth - margin - 20, yPos)
  yPos += 15

  // "QR CODE DU COLIS"
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('QR CODE DU COLIS', pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Génération du QR code
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const qrUrl = `${baseUrl}/qr?code=${encodeURIComponent(data.qrCode)}`
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    })

    const qrSize = 55
    const qrX = (pageWidth - qrSize) / 2
    pdf.addImage(qrCodeDataURL, 'PNG', qrX, yPos, qrSize, qrSize)
    yPos += qrSize + 15
  } catch (error) {
    console.error('Erreur génération QR:', error)
    pdf.setFontSize(10)
    pdf.setTextColor(255, 0, 0)
    pdf.text('Erreur QR code', pageWidth / 2, yPos, { align: 'center' })
    yPos += 20
  }

  // Ligne séparatrice
  pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.line(margin + 20, yPos, pageWidth - margin - 20, yPos)
  yPos += 18

  // Numéro de colis (numéro de la commande)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Numéro de colis : ${data.orderNumber}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Ligne séparatrice
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.line(margin + 20, yPos, pageWidth - margin - 20, yPos)

  // ========== FOOTER ==========
  const footerY = pageHeight - 18
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.line(margin, footerY, pageWidth - margin, footerY)
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('www.danemo.be | info@danemo.be | 0488 64 51 83', pageWidth / 2, footerY + 8, { align: 'center' })

  // Impression ou téléchargement
  if (typeof window !== 'undefined') {
    try {
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print()
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
          }, 500)
        }, { once: true })
      } else {
        pdf.save(`qr-colis-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
        URL.revokeObjectURL(pdfUrl)
      }
    } catch {
      pdf.save(`qr-colis-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
    }
  } else {
    pdf.save(`qr-colis-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}
