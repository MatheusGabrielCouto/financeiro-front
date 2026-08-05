"use client"

import type { KeyboardEvent } from "react"
import { buildCsv, downloadCsv, type CsvCell } from "@/lib/csv"
import { downloadPdfTable } from "@/lib/pdf"
import {
  downloadReportPdf,
  type ReportPdfData,
} from "@/lib/report-pdf"

type ExportDataButtonsProps = {
  filename: string
  title?: string
  subtitle?: string
  headers: string[]
  rows: CsvCell[][]
  csvLabel?: string
  pdfLabel?: string
  disabled?: boolean
  className?: string
  onExported?: () => void
  /** When set, PDF uses the rich monthly report layout */
  reportData?: ReportPdfData
}

const defaultButtonClass =
  "rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-900/50"

export const ExportDataButtons = ({
  filename,
  title,
  subtitle,
  headers,
  rows,
  csvLabel = "Exportar CSV",
  pdfLabel = "Exportar PDF",
  disabled = false,
  className = defaultButtonClass,
  onExported,
  reportData,
}: ExportDataButtonsProps) => {
  const isDisabled = disabled || (rows.length === 0 && !reportData)

  const handleCsv = () => {
    if (disabled || rows.length === 0) return
    const csv = buildCsv(headers, rows)
    downloadCsv(filename, csv)
    onExported?.()
  }

  const handlePdf = () => {
    if (isDisabled) return
    if (reportData) {
      downloadReportPdf({ filename, data: reportData })
    } else {
      downloadPdfTable({
        filename,
        title,
        subtitle,
        headers,
        rows,
      })
    }
    onExported?.()
  }

  const handleKeyDown =
    (action: () => void) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        action()
      }
    }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCsv}
        onKeyDown={handleKeyDown(handleCsv)}
        disabled={disabled || rows.length === 0}
        tabIndex={0}
        aria-label={csvLabel}
        className={className}
      >
        {csvLabel}
      </button>
      <button
        type="button"
        onClick={handlePdf}
        onKeyDown={handleKeyDown(handlePdf)}
        disabled={isDisabled}
        tabIndex={0}
        aria-label={pdfLabel}
        className={className}
      >
        {pdfLabel}
      </button>
    </div>
  )
}
