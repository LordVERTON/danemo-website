import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, HeadingLevel } from 'docx'
import jsPDF from 'jspdf'

export interface ProformaItem {
  description: string
  quantity: number
  unitPrice: number
  total?: number
}

export interface ProformaData {
  order: {
    id: string
    order_number: string
    client_name: string
    client_email: string
    client_phone?: string | null
    service_type: string
    origin: string
    destination: string
    value?: number | null
    weight?: number | null
    created_at: string
  }
  company: {
    name: string
    address: string
    phone: string
    email: string
    siret?: string
    tva?: string
    iban: string
    bic: string
    website?: string
  }
  items?: ProformaItem[]
  currency?: string
  notes?: string
  issueDate?: string
  validityDate?: string
}

const numberFormatter = (value: number, currency: string = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value)

export async function generateProformaDocx(data: ProformaData): Promise<Blob> {
  const currency = data.currency || 'EUR'
  const items =
    data.items && data.items.length > 0
      ? data.items
      : [
          {
            description: `Prestations ${data.order.service_type} (${data.order.origin} → ${data.order.destination})`,
            quantity: 1,
            unitPrice: data.order.value || 0,
            total: data.order.value || 0,
          },
        ]

  const total = items.reduce((sum, item) => sum + (item.total ?? item.quantity * item.unitPrice), 0)

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'PROFORMA',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Référence: ${data.order.order_number}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: data.company.name, bold: true, size: 24 }),
              new TextRun({ text: `\n${data.company.address}` }),
              new TextRun({ text: `\nTéléphone: ${data.company.phone}` }),
              new TextRun({ text: `\nEmail: ${data.company.email}` }),
              data.company.website ? new TextRun({ text: `\nSite web: ${data.company.website}` }) : new TextRun(''),
              data.company.siret ? new TextRun({ text: `\nSIRET: ${data.company.siret}` }) : new TextRun(''),
              data.company.tva ? new TextRun({ text: `\nTVA: ${data.company.tva}` }) : new TextRun(''),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Destinataire', bold: true }),
              new TextRun({ text: `\n${data.order.client_name}` }),
              new TextRun({ text: `\n${data.order.client_email}` }),
              data.order.client_phone ? new TextRun({ text: `\n${data.order.client_phone}` }) : new TextRun(''),
            ],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({
                children: ['Description', 'Quantité', 'Prix unitaire', 'Montant'].map(
                  (header) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: header, bold: true })],
                        }),
                      ],
                    }),
                ),
              }),
              ...items.map((item) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(item.description)] }),
                    new TableCell({ children: [new Paragraph(item.quantity.toString())] }),
                    new TableCell({ children: [new Paragraph(numberFormatter(item.unitPrice, currency))] }),
                    new TableCell({
                      children: [new Paragraph(numberFormatter(item.total ?? item.quantity * item.unitPrice, currency))],
                    }),
                  ],
                }),
              ),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })],
                    columnSpan: 3,
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: numberFormatter(total, currency), bold: true })] })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Conditions de paiement', bold: true }),
              new TextRun({
                text: `\nVeuillez effectuer le paiement sur le compte suivant dans les 7 jours ouvrables:`,
              }),
              new TextRun({ text: `\nIBAN: ${data.company.iban}`, bold: true }),
              new TextRun({ text: `\nBIC: ${data.company.bic}`, bold: true }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  data.notes ||
                  "Merci de confirmer la réception de cette proforma et de nous contacter pour toute information complémentaire.",
              }),
            ],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const array: Uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBufferLike)
  return new Blob([array as any], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export async function generateProformaPdf(data: ProformaData) {
  const currency = data.currency || 'EUR'
  const items =
    data.items && data.items.length > 0
      ? data.items
      : [
          {
            description: `Prestations ${data.order.service_type} (${data.order.origin} → ${data.order.destination})`,
            quantity: 1,
            unitPrice: data.order.value || 0,
            total: data.order.value || 0,
          },
        ]

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  const primaryColor = [255, 140, 0]
  const secondaryColor = [55, 65, 81]

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('DANEMO', 15, 20)

  doc.setFontSize(12)
  doc.text('PROFORMA', pageWidth - 60, 20)
  doc.setFontSize(9)
  doc.text(`Référence: ${data.order.order_number}`, pageWidth - 60, 26)
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 60, 30)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Émetteur', 15, 45)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.company.name, 15, 51)
  doc.text(data.company.address, 15, 55)
  doc.text(`Téléphone: ${data.company.phone}`, 15, 59)
  doc.text(`Email: ${data.company.email}`, 15, 63)
  if (data.company.siret) doc.text(`SIRET: ${data.company.siret}`, 15, 67)
  if (data.company.tva) doc.text(`TVA: ${data.company.tva}`, 15, 71)

  doc.setFont('helvetica', 'bold')
  doc.text('Destinataire', pageWidth / 2, 45)
  doc.setFont('helvetica', 'normal')
  doc.text(data.order.client_name, pageWidth / 2, 51)
  doc.text(data.order.client_email, pageWidth / 2, 55)
  if (data.order.client_phone) doc.text(String(data.order.client_phone), pageWidth / 2, 59)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('Détails de la prestation', 15, 85)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Service: ${data.order.service_type}`, 15, 92)
  doc.text(`Trajet: ${data.order.origin} → ${data.order.destination}`, 15, 96)
  if (data.order.weight) doc.text(`Poids estimé: ${data.order.weight} kg`, 15, 100)

  const tableTop = 110
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFillColor(249, 250, 251)

  doc.rect(15, tableTop, pageWidth - 30, 10, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 18, tableTop + 7)
  doc.text('Qté', pageWidth - 90, tableTop + 7)
  doc.text('PU', pageWidth - 60, tableTop + 7)
  doc.text('Montant', pageWidth - 30, tableTop + 7)

  doc.setFont('helvetica', 'normal')
  let currentY = tableTop + 17
  items.forEach((item) => {
    doc.setDrawColor(229, 231, 235)
    doc.line(15, currentY - 6, pageWidth - 15, currentY - 6)
    doc.text(item.description, 18, currentY)
    doc.text(String(item.quantity), pageWidth - 90, currentY)
    doc.text(numberFormatter(item.unitPrice, currency), pageWidth - 60, currentY, { align: 'right' })
    doc.text(numberFormatter(item.total ?? item.unitPrice * item.quantity, currency), pageWidth - 15, currentY, {
      align: 'right',
    })
    currentY += 8
  })

  const total = items.reduce((sum, item) => sum + (item.total ?? item.unitPrice * item.quantity), 0)

  doc.setFont('helvetica', 'bold')
  doc.text('Total', pageWidth - 60, currentY + 6)
  doc.text(numberFormatter(total, currency), pageWidth - 15, currentY + 6, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('Coordonnées bancaires', 15, currentY + 24)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setFont('helvetica', 'normal')
  doc.text(`IBAN: ${data.company.iban}`, 15, currentY + 30)
  doc.text(`BIC: ${data.company.bic}`, 15, currentY + 36)
  doc.text('Paiement à effectuer dans les 7 jours ouvrables.', 15, currentY + 44)

  const notes = data.notes
    ? data.notes
    : "Merci de confirmer la réception de cette proforma. Le traitement logistique commencera après confirmation du paiement."
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(notes, 15, currentY + 54, { maxWidth: pageWidth - 30 })

  doc.save(`proforma-${data.order.order_number}.pdf`)
}


