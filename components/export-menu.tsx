"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, Table } from "lucide-react"
import { exportToCSV, exportToPDF, exportToPDFSimple, ExportData } from "@/lib/export-utils"

interface ExportMenuProps {
  data: ExportData
  chartElements: HTMLElement[]
  onExportStart?: () => void
  onExportComplete?: () => void
}

export default function ExportMenu({ 
  data, 
  chartElements, 
  onExportStart, 
  onExportComplete 
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleCSVExport = async () => {
    try {
      setIsExporting(true)
      onExportStart?.()
      
      // Petite pause pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      exportToCSV(data)
      onExportComplete?.()
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePDFExport = async () => {
    try {
      setIsExporting(true)
      onExportStart?.()
      
      await exportToPDF(data, chartElements)
      onExportComplete?.()
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      
      // Si erreur oklch, essayer la version simple
      if (error instanceof Error && error.message.includes('oklch')) {
        try {
          await exportToPDFSimple(data)
          onExportComplete?.()
        } catch (fallbackError) {
          console.error('Erreur lors de l\'export PDF simple:', fallbackError)
        }
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={isExporting}
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Export en cours...' : 'Exporter'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handleCSVExport}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Table className="h-4 w-4" />
          <span>Export CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handlePDFExport}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          <span>Export PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
