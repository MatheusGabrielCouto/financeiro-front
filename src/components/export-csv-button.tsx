"use client"

import { buildCsv, downloadCsv, type CsvCell } from "@/lib/csv"

type ExportCsvButtonProps = {
  filename: string
  headers: string[]
  rows: CsvCell[][]
  label?: string
  disabled?: boolean
  ariaLabel?: string
  className?: string
  onExported?: () => void
}

export const ExportCsvButton = ({
  filename,
  headers,
  rows,
  label = "Exportar CSV",
  disabled = false,
  ariaLabel,
  className,
  onExported,
}: ExportCsvButtonProps) => {
  const isDisabled = disabled || rows.length === 0

  const handleClick = () => {
    if (isDisabled) return
    const csv = buildCsv(headers, rows)
    downloadCsv(filename, csv)
    onExported?.()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      tabIndex={0}
      aria-label={ariaLabel ?? label}
      className={
        className ??
        "rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {label}
    </button>
  )
}
