import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx'
import ExcelJS from 'exceljs'

export interface ContainerExportRow {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  company?: string | null
  recipientName?: string | null
  recipientEmail?: string | null
  recipientPhone?: string | null
  recipientAddress?: string | null
  orderNumber?: string | null
  serviceType?: string | null
  description?: string | null
  origin?: string | null
  destination?: string | null
  parcelsCount?: number | null
  weight?: number | null
  value?: number | null
  status?: string | null
  containerCode?: string | null
}

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function contactDetails(name?: string | null, phone?: string | null, email?: string | null, address?: string | null) {
  return [name, phone, email, address].filter(Boolean).join('\n') || '—'
}

function exportTableRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
      new TableCell({ children: value.split('\n').map((line) => new Paragraph({ text: line })) }),
    ],
  })
}

export async function generateClientsDocx(title: string, rows: ContainerExportRow[]): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({ text: `${rows.length} commande${rows.length > 1 ? 's' : ''} / colis exporté${rows.length > 1 ? 's' : ''}.` }),
          ...rows.flatMap((row) => [
            new Paragraph({
              text: row.orderNumber ? `Commande ${row.orderNumber}` : `Client ${displayValue(row.name)}`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: 'pct' },
              rows: [
                exportTableRow('Client', displayValue(row.name)),
                exportTableRow('Coordonnées client', contactDetails(null, row.phone, row.email, row.address)),
                exportTableRow('Société', displayValue(row.company)),
                exportTableRow('Destinataire', contactDetails(row.recipientName, row.recipientPhone, row.recipientEmail, row.recipientAddress)),
                exportTableRow('Conteneur', displayValue(row.containerCode)),
                exportTableRow('Service', displayValue(row.serviceType)),
                exportTableRow('Contenu du colis', displayValue(row.description)),
                exportTableRow('Nombre de colis', displayValue(row.parcelsCount)),
                exportTableRow('Trajet', `${displayValue(row.origin)} → ${displayValue(row.destination)}`),
                exportTableRow('Poids', row.weight === null || row.weight === undefined ? '—' : `${row.weight} kg`),
                exportTableRow('Valeur', row.value === null || row.value === undefined ? '—' : `${row.value} €`),
                exportTableRow('Statut', displayValue(row.status)),
              ],
            }),
            new Paragraph({ text: '' }),
          ]),
          new Paragraph({
            children: [new TextRun({ text: 'TVA: 0%', italics: true })],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const array: Uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBufferLike)
  return new Blob([array as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

export async function generateClientsExcel(sheetName: string, rows: ContainerExportRow[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  ws.columns = [
    { header: 'Nom', key: 'name', width: 28 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Téléphone', key: 'phone', width: 16 },
    { header: 'Adresse', key: 'address', width: 32 },
    { header: 'Société', key: 'company', width: 20 },
    { header: 'Destinataire', key: 'recipientName', width: 28 },
    { header: 'E-mail destinataire', key: 'recipientEmail', width: 28 },
    { header: 'Téléphone destinataire', key: 'recipientPhone', width: 20 },
    { header: 'Adresse destinataire', key: 'recipientAddress', width: 32 },
    { header: 'Conteneur', key: 'containerCode', width: 18 },
    { header: 'Référence commande', key: 'orderNumber', width: 22 },
    { header: 'Service', key: 'serviceType', width: 18 },
    { header: 'Contenu du colis', key: 'description', width: 40 },
    { header: 'Nombre de colis', key: 'parcelsCount', width: 16 },
    { header: 'Origine', key: 'origin', width: 24 },
    { header: 'Destination', key: 'destination', width: 24 },
    { header: 'Poids (kg)', key: 'weight', width: 14 },
    { header: 'Valeur (€)', key: 'value', width: 14 },
    { header: 'Statut', key: 'status', width: 16 },
  ]
  rows.forEach((r) => ws.addRow(r))
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: 'A1', to: 'S1' }
  ws.getColumn('weight').numFmt = '0.00'
  ws.getColumn('value').numFmt = '#,##0.00 €'
  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}


