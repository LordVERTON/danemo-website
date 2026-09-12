"use client"

import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx"
import jsPDF from "jspdf"
import QRCode from "qrcode"

type Company = { name: string; address: string; email: string; phone: string; iban?: string; bic?: string; tva?: string }
type Order = {
  order_number: string
  client_name: string
  client_company?: string | null
  client_email?: string | null
  client_phone?: string | null
  origin: string
  destination: string
  service_type: string
  description?: string | null
  weight?: number | string | null
  estimated_delivery?: string | null
  status?: string | null
  recipient_name?: string | null
  recipient_phone?: string | null
  recipient_address?: string | null
  recipient_city?: string | null
  recipient_postal_code?: string | null
  recipient_country?: string | null
  value?: number | null
  qr_code?: string | null
}

const company: Company = { name: "Danemo", address: "Avenue du Port 108-110, 1000 Bruxelles", email: "info@danemo.be", phone: "+32 488 64 51 83", iban: "À compléter", bic: "À compléter", tva: "À compléter" }
const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value)

const citySpellings: Record<string, string> = {
  anvers: "Anvers",
  antwerp: "Anvers",
  bruxelles: "Bruxelles",
  douala: "Douala",
  yaounde: "Yaoundé",
  "yaoundé": "Yaoundé",
}

function formatLocation(location: string) {
  const cleaned = location.trim().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ")

  return Object.entries(citySpellings).reduce(
    (formatted, [source, replacement]) => formatted.replace(new RegExp(`(^|[\\s,;:/-])${source}(?=$|[\\s,;:/-])`, "gi"), `$1${replacement}`),
    cleaned || "Non renseigné"
  )
}

function serviceLabel(serviceType: string) {
  const labels: Record<string, string> = {
    fret_maritime: "Fret maritime",
    fret_aerien: "Fret aérien",
    demenagement: "Déménagement",
    dedouanement: "Dédouanement",
    negoce: "Négoce",
  }

  return labels[serviceType] || serviceType
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    in_progress: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
  }

  return status ? labels[status] || status : "En attente"
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée"
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR")
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function addHeader(pdf: jsPDF, title: string, reference: string) {
  const width = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(234, 88, 12); pdf.rect(0, 0, width, 30, "F")
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.text("DANEMO", 14, 19)
  pdf.setFontSize(13); pdf.text(title, width - 14, 16, { align: "right" })
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(reference, width - 14, 23, { align: "right" })
  pdf.setTextColor(20, 20, 20)
}

export function downloadInvoicePdf(params: { invoiceNumber: string; order: Order; taxRate?: number; dueDate?: string | null; paidAmount?: number; notes?: string | null }) {
  const pdf = new jsPDF("p", "mm", "a4")
  const { order } = params
  const subtotal = Number(order.value || 0); const taxRate = Number(params.taxRate || 0); const tax = subtotal * taxRate / 100; const total = subtotal + tax
  addHeader(pdf, "FACTURE", params.invoiceNumber)
  pdf.setFontSize(10); pdf.text(company.name, 14, 43); pdf.text(company.address, 14, 49); pdf.text(`${company.email} · ${company.phone}`, 14, 55)
  pdf.setFont("helvetica", "bold"); pdf.text("Facturé à", 112, 43); pdf.setFont("helvetica", "normal"); pdf.text(order.client_name, 112, 49); pdf.text(order.client_email || "", 112, 55); if (order.client_phone) pdf.text(order.client_phone, 112, 61)
  pdf.setFont("helvetica", "bold"); pdf.text("Prestation", 14, 82); pdf.text("Montant", 180, 82, { align: "right" }); pdf.setDrawColor(220, 220, 220); pdf.line(14, 86, 196, 86)
  pdf.setFont("helvetica", "normal"); pdf.text(`${order.service_type} · ${order.origin} → ${order.destination}`, 14, 94, { maxWidth: 135 }); pdf.text(euro(subtotal), 180, 94, { align: "right" })
  pdf.line(14, 102, 196, 102); pdf.text("Sous-total", 138, 112); pdf.text(euro(subtotal), 180, 112, { align: "right" }); pdf.text(`TVA (${taxRate}%)`, 138, 119); pdf.text(euro(tax), 180, 119, { align: "right" }); pdf.setFont("helvetica", "bold"); pdf.text("Total TTC", 138, 129); pdf.text(euro(total), 180, 129, { align: "right" })
  const paid = Number(params.paidAmount || 0); pdf.setFont("helvetica", "normal"); pdf.text(`Réglé : ${euro(Math.min(paid, total))} · Solde : ${euro(Math.max(total - paid, 0))}`, 14, 146)
  if (params.dueDate) pdf.text(`Échéance : ${new Date(params.dueDate).toLocaleDateString("fr-FR")}`, 14, 153)
  if (params.notes) pdf.text(params.notes, 14, 165, { maxWidth: 180 })
  pdf.setFontSize(8); pdf.text(`IBAN : ${company.iban} · BIC : ${company.bic} · TVA : ${company.tva}`, 14, 278)
  pdf.save(`facture-${params.invoiceNumber}.pdf`)
}

export function downloadProformaPdf(order: Order) {
  const pdf = new jsPDF("p", "mm", "a4")
  addHeader(pdf, "PROFORMA", order.order_number)
  pdf.setFontSize(10); pdf.text(company.name, 14, 43); pdf.text(company.address, 14, 49); pdf.text(`${company.email} · ${company.phone}`, 14, 55)
  pdf.setFont("helvetica", "bold"); pdf.text("Destinataire", 112, 43); pdf.setFont("helvetica", "normal"); pdf.text(order.client_name, 112, 49); pdf.text(order.client_email || "", 112, 55)
  pdf.setFont("helvetica", "bold"); pdf.text("Détail de la prestation", 14, 82); pdf.setFont("helvetica", "normal"); pdf.text(`${order.service_type} · ${order.origin} → ${order.destination}`, 14, 92, { maxWidth: 150 }); pdf.setFont("helvetica", "bold"); pdf.text(euro(Number(order.value || 0)), 180, 92, { align: "right" })
  pdf.setFont("helvetica", "normal"); pdf.text("Document proforma — le traitement logistique débute après confirmation du règlement.", 14, 122, { maxWidth: 180 }); pdf.text(`IBAN : ${company.iban} · BIC : ${company.bic}`, 14, 142)
  pdf.save(`proforma-${order.order_number}.pdf`)
}

export async function downloadQrLabel(order: Order) {
  const code = order.qr_code || order.order_number
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a6" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const x = 4
  const y = 4
  const labelWidth = pageWidth - x * 2
  const labelHeight = pageHeight - y * 2
  const origin = formatLocation(order.origin)
  const destination = formatLocation(order.destination)
  const recipientName = order.recipient_name?.trim() || order.client_name
  const recipientAddress = [
    order.recipient_address?.trim(),
    [order.recipient_postal_code?.trim(), order.recipient_city?.trim()].filter(Boolean).join(" "),
    order.recipient_country?.trim(),
  ].filter(Boolean).join(", ") || "Adresse non renseignée"
  const shopName = order.client_company?.trim() || order.client_name
  const drawText = (text: string, textX: number, textY: number, maxWidth: number, maxLines = 2, fontSize = 7) => {
    const lines = pdf.splitTextToSize(text || "—", maxWidth).slice(0, maxLines)
    if (pdf.splitTextToSize(text || "—", maxWidth).length > maxLines) lines[maxLines - 1] = `${lines[maxLines - 1].replace(/…$/, "")}…`
    pdf.setFontSize(fontSize)
    pdf.text(lines, textX, textY)
  }
  const drawCellTitle = (title: string, cellX: number, cellY: number, cellWidth: number, fill: [number, number, number]) => {
    pdf.setFillColor(...fill)
    pdf.rect(cellX, cellY, cellWidth, 6, "F")
    pdf.setTextColor(15, 23, 42)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.text(title.toUpperCase(), cellX + 2, cellY + 4)
  }

  // Grille compacte inspirée de l'étiquette de référence, adaptée à une impression A6.
  const topBottom = y + 43
  const middleBottom = y + 92
  const firstColumn = x + 25
  const secondColumn = x + 57
  const middleColumn = x + 31
  pdf.setDrawColor(15, 23, 42)
  pdf.setLineWidth(0.45)
  pdf.rect(x, y, labelWidth, labelHeight)
  pdf.line(x, topBottom, x + labelWidth, topBottom)
  pdf.line(x, middleBottom, x + labelWidth, middleBottom)
  pdf.line(firstColumn, y, firstColumn, topBottom)
  pdf.line(secondColumn, y, secondColumn, topBottom)
  pdf.line(middleColumn, topBottom, middleColumn, y + labelHeight)

  drawCellTitle("Boutique", x, y, 25, [247, 242, 227])
  drawCellTitle("N° commande", firstColumn, y, 32, [247, 242, 227])
  drawCellTitle("Contact", secondColumn, y, labelWidth - 57, [247, 242, 227])
  drawCellTitle("Destinataire", x, topBottom, 31, [232, 246, 238])
  drawCellTitle("Suivi opérationnel", middleColumn, topBottom, labelWidth - 31, [232, 246, 238])
  drawCellTitle("Service", x, middleBottom, 31, [255, 247, 237])
  drawCellTitle("QR suivi opérateur", middleColumn, middleBottom, labelWidth - 31, [255, 247, 237])

  pdf.setTextColor(20, 20, 20)
  pdf.setFont("helvetica", "bold")
  drawText(shopName, x + 2, y + 12, 21, 2, 7.5)
  pdf.setFont("helvetica", "normal")
  drawText(`Client : ${order.client_name}`, x + 2, y + 25, 21, 2, 6)

  pdf.setFont("helvetica", "bold")
  drawText(order.order_number, firstColumn + 2, y + 14, 28, 2, 8)
  pdf.setFont("helvetica", "normal")
  drawText(`Suivi : ${code}`, firstColumn + 2, y + 28, 28, 2, 6)

  drawText(order.client_email || "E-mail non renseigné", secondColumn + 2, y + 13, labelWidth - 61, 2, 6.5)
  drawText(order.client_phone || "Téléphone non renseigné", secondColumn + 2, y + 28, labelWidth - 61, 2, 6.5)

  pdf.setFont("helvetica", "bold")
  drawText(recipientName, x + 2, topBottom + 12, 27, 2, 7)
  pdf.setFont("helvetica", "normal")
  drawText(recipientAddress, x + 2, topBottom + 25, 27, 4, 6)
  if (order.recipient_phone) drawText(`Tél. ${order.recipient_phone}`, x + 2, topBottom + 45, 27, 1, 6)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6)
  pdf.text("DÉPART", middleColumn + 2, topBottom + 13)
  pdf.text("DESTINATION", middleColumn + 2, topBottom + 26)
  pdf.text("STATUT", middleColumn + 2, topBottom + 39)
  pdf.setFont("helvetica", "normal")
  drawText(origin, middleColumn + 18, topBottom + 13, labelWidth - 51, 1, 7)
  drawText(destination, middleColumn + 18, topBottom + 26, labelWidth - 51, 1, 7)
  drawText(statusLabel(order.status), middleColumn + 18, topBottom + 39, labelWidth - 51, 1, 7)

  pdf.setFont("helvetica", "bold")
  drawText(serviceLabel(order.service_type), x + 2, middleBottom + 13, 27, 2, 7)
  pdf.setFont("helvetica", "normal")
  if (order.description) drawText(order.description, x + 2, middleBottom + 25, 27, 2, 6)
  drawText(`Poids : ${order.weight || "—"} kg`, x + 2, middleBottom + 37, 27, 1, 6)
  drawText(`ETA : ${formatDate(order.estimated_delivery)}`, x + 2, middleBottom + 44, 27, 1, 6)

  const qr = await QRCode.toDataURL(`${window.location.origin}/admin/qr?code=${encodeURIComponent(code)}`, { width: 700, margin: 2 })
  const qrSize = 34
  const qrX = middleColumn + (labelWidth - 31 - qrSize) / 2
  const qrY = middleBottom + 9
  pdf.addImage(qr, "PNG", qrX, qrY, qrSize, qrSize)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(5.5)
  pdf.text("Scanner avec l’outil opérateur Danemo", middleColumn + (labelWidth - 31) / 2, middleBottom + 46, { align: "center" })
  pdf.save(`qr-colis-${order.order_number}.pdf`)
}

export async function downloadProformaDocx(order: Order) {
  const doc = new Document({ sections: [{ children: [
    new Paragraph({ children: [new TextRun({ text: "DANEMO — PROFORMA", bold: true, size: 32 })] }),
    new Paragraph(`${company.address}\n${company.email} · ${company.phone}`), new Paragraph(""),
    new Paragraph({ children: [new TextRun({ text: `Référence : ${order.order_number}`, bold: true })] }), new Paragraph(`Client : ${order.client_name}\n${order.client_email || ""}`),
    new Table({ rows: [new TableRow({ children: ["Description", "Montant"].map((text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })) }), new TableRow({ children: [new TableCell({ children: [new Paragraph(`${order.service_type} — ${order.origin} → ${order.destination}`)] }), new TableCell({ children: [new Paragraph(euro(Number(order.value || 0)))] })] })] }),
    new Paragraph(""), new Paragraph("Cette proforma est valable 7 jours. Le traitement logistique commence après confirmation du règlement."),
  ] }] })
  download(await Packer.toBlob(doc), `proforma-${order.order_number}.docx`)
}
