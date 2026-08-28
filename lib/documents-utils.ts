import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx'
import ExcelJS from 'exceljs'

export interface ClientExportRow {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  company?: string | null
  containerCode?: string | null
}

export async function generateClientsDocx(title: string, rows: ClientExportRow[]): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({
                children: ['Nom', 'Email', 'Téléphone', 'Société', 'Conteneur'].map((t) =>
                  new TableCell({ children: [new Paragraph({ text: t })] })
                ),
              }),
              ...rows.map((r) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(r.name || '')] }),
                    new TableCell({ children: [new Paragraph(r.email || '')] }),
                    new TableCell({ children: [new Paragraph(r.phone || '')] }),
                    new TableCell({ children: [new Paragraph(r.company || '')] }),
                    new TableCell({ children: [new Paragraph(r.containerCode || '')] }),
                  ],
                })
              ),
            ],
          }),
          new Paragraph({ text: '' }),
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

export async function generateClientsExcel(sheetName: string, rows: ClientExportRow[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  ws.columns = [
    { header: 'Nom', key: 'name', width: 28 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Téléphone', key: 'phone', width: 16 },
    { header: 'Société', key: 'company', width: 20 },
    { header: 'Conteneur', key: 'containerCode', width: 18 },
  ]
  rows.forEach((r) => ws.addRow(r))
  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}


