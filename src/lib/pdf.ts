import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { CsvCell } from "@/lib/csv"

const cellText = (value: CsvCell) => {
  if (value == null) return ""
  return String(value)
}

const stripExtension = (filename: string) =>
  filename.replace(/\.(csv|pdf)$/i, "")

export const downloadPdfTable = ({
  filename,
  title,
  headers,
  rows,
}: {
  filename: string
  title?: string
  headers: string[]
  rows: CsvCell[][]
}) => {
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length))
  const orientation = columnCount > 4 ? "landscape" : "portrait"
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  const marginX = 14
  let startY = 16

  if (title) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text(title, marginX, startY)
    startY += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")}`,
      marginX,
      startY
    )
    startY += 6
  }

  autoTable(doc, {
    head: [headers.map(cellText)],
    body: rows.map((row) => row.map(cellText)),
    startY,
    margin: { left: marginX, right: marginX },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      overflow: "linebreak",
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  })

  const base = stripExtension(filename)
  doc.save(`${base}.pdf`)
}
