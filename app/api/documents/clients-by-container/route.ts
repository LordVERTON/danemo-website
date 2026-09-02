import { NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx"
import ExcelJS from "exceljs"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { searchParams } = new URL(request.url)
    const containerId = searchParams.get("container_id")
    const format = searchParams.get("format") === "docx" ? "docx" : "xlsx"
    if (!containerId) return NextResponse.json({ success: false, error: "container_id requis" }, { status: 400 })
    const [{ data: container, error: containerError }, { data: orders, error: ordersError }] = await Promise.all([
      (supabaseAdmin as any).from("containers").select("id, code").eq("id", containerId).maybeSingle(),
      (supabaseAdmin as any).from("orders").select("client_name, client_email, client_phone, client_address, customer_id").eq("container_id", containerId),
    ])
    if (containerError || ordersError) throw containerError || ordersError
    if (!container) return NextResponse.json({ success: false, error: "Conteneur introuvable" }, { status: 404 })
    const rows = (orders || []).map((order: any) => ({ name: order.client_name || "", email: order.client_email || "", phone: order.client_phone || "", address: order.client_address || "", containerCode: container.code }))
    const safeCode = String(container.code).replace(/[^a-zA-Z0-9_-]/g, "-")
    if (format === "docx") {
      const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ text: `Clients — conteneur ${container.code}`, bold: true, size: 30 })] }), new Paragraph(""), new Table({ rows: [new TableRow({ children: ["Nom", "Email", "Téléphone", "Adresse"].map((label) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] })) }), ...rows.map((row: any) => new TableRow({ children: [row.name, row.email, row.phone, row.address].map((value) => new TableCell({ children: [new Paragraph(value)] })) }))] })] }] })
      const buffer = await Packer.toBuffer(doc)
      return new NextResponse(buffer as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="clients-${safeCode}.docx"` } })
    }
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet(`Clients ${container.code}`)
    sheet.columns = [{ header: "Nom", key: "name", width: 28 }, { header: "Email", key: "email", width: 32 }, { header: "Téléphone", key: "phone", width: 20 }, { header: "Adresse", key: "address", width: 42 }, { header: "Conteneur", key: "containerCode", width: 18 }]
    rows.forEach((row: any) => sheet.addRow(row)); sheet.getRow(1).font = { bold: true }
    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="clients-${safeCode}.xlsx"` } })
  } catch (error) {
    console.error("[documents.clients-by-container]", error)
    return NextResponse.json({ success: false, error: "Impossible de générer le document" }, { status: 500 })
  }
}
