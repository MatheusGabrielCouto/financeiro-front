export type CsvCell = string | number | boolean | null | undefined

export const escapeCsvCell = (value: CsvCell) => {
  if (value == null) return ""
  const raw = String(value)
  if (!/[",\n\r]/.test(raw)) return raw
  return `"${raw.replace(/"/g, '""')}"`
}

export const buildCsv = (headers: string[], rows: CsvCell[][]) => {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ]
  return `${lines.join("\n")}\n`
}

export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
