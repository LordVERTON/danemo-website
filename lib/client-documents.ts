"use client"

import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx"
import jsPDF from "jspdf"
import QRCode from "qrcode"

type Company = { name: string; address: string; email: string; phone: string; iban?: string; bic?: string; tva?: string }
type Order = { order_number: string; client_name: string; client_email?: string | null; client_phone?: string | null; origin: string; destination: string; service_type: string; value?: number | null; qr_code?: string | null }

const company: Company = { name: "Danemo", address: "Avenue du Port 108-110, 1000 Bruxelles", email: "info@danemo.be", phone: "+32 488 64 51 83", iban: "À compléter", bic: "À compléter", tva: "À compléter" }
const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value)

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
  const pdf = new jsPDF("p", "mm", "a4")
  addHeader(pdf, "ÉTIQUETTE COLIS", order.order_number)
  const qr = await QRCode.toDataURL(`${window.location.origin}/admin/qr?code=${encodeURIComponent(code)}`, { width: 700, margin: 2 })
  pdf.addImage(qr, "PNG", 55, 65, 100, 100); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text(order.client_name, 105, 185, { align: "center" }); pdf.setFontSize(12); pdf.text(order.order_number, 105, 196, { align: "center" }); pdf.setFont("helvetica", "normal"); pdf.text(`${order.origin} → ${order.destination}`, 105, 206, { align: "center" })
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
