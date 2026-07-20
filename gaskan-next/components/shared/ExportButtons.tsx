"use client"

import * as React from "react"
import ExcelJS from "exceljs"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { saveAs } from "file-saver"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExportColumn {
  header: string
  key: string
}

export interface ExportButtonsProps<T = Record<string, any>> {
  data: T[]
  columns: ExportColumn[]
  fileName?: string
  title?: string
  excelButtonText?: string
  pdfButtonText?: string
  disabled?: boolean
  className?: string
}

export function ExportButtons<T extends Record<string, any>>({
  data,
  columns,
  fileName = "export_data",
  title = "Exported Data",
  excelButtonText = "Export to Excel",
  pdfButtonText = "Export to PDF",
  disabled = false,
  className,
}: ExportButtonsProps<T>) {
  const [isExportingExcel, setIsExportingExcel] = React.useState(false)
  const [isExportingPdf, setIsExportingPdf] = React.useState(false)

  const handleExportExcel = async () => {
    if (!data || data.length === 0) return
    setIsExportingExcel(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(title.slice(0, 31))

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: Math.max(col.header.length + 5, 15),
      }))

      data.forEach((item) => {
        const rowData: Record<string, any> = {}
        columns.forEach((col) => {
          rowData[col.key] = item[col.key] ?? ""
        })
        worksheet.addRow(rowData)
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      saveAs(blob, `${fileName}.xlsx`)
    } catch (error) {
      console.error("Failed to export Excel:", error)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = () => {
    if (!data || data.length === 0) return
    setIsExportingPdf(true)
    try {
      const doc = new jsPDF()

      if (title) {
        doc.setFontSize(16)
        doc.text(title, 14, 15)
      }

      const tableHeaders = [columns.map((col) => col.header)]
      const tableData = data.map((item) =>
        columns.map((col) => String(item[col.key] ?? ""))
      )

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: title ? 22 : 15,
      })

      doc.save(`${fileName}.pdf`)
    } catch (error) {
      console.error("Failed to export PDF:", error)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const isBtnDisabled = disabled || !data || data.length === 0

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={isBtnDisabled || isExportingExcel}
        className="gap-1.5"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        )}
        <span>{excelButtonText}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isBtnDisabled || isExportingPdf}
        className="gap-1.5"
      >
        {isExportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 text-rose-600" />
        )}
        <span>{pdfButtonText}</span>
      </Button>
    </div>
  )
}
