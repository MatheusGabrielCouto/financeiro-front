import { jsPDF } from "jspdf"
import autoTable, { type Styles } from "jspdf-autotable"
import type { CsvCell } from "@/lib/csv"

const cellText = (value: CsvCell) => {
  if (value == null) return ""
  return String(value)
}

const stripExtension = (filename: string) =>
  filename.replace(/\.(csv|pdf)$/i, "")

const BRAND = {
  teal: [15, 118, 110] as [number, number, number],
  tealDark: [11, 61, 58] as [number, number, number],
  tealSoft: [204, 251, 241] as [number, number, number],
  slate: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  soft: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [5, 150, 105] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
}

const formatCurrencyPt = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

const looksNumeric = (value: string) =>
  /^-?\d+(\.\d+)?$/.test(value.trim())

const looksIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)

const formatCell = (value: CsvCell, header: string) => {
  const raw = cellText(value)
  if (!raw) return ""

  const headerLower = header.toLowerCase()
  if (
    (headerLower.includes("valor") || headerLower === "value") &&
    looksNumeric(raw)
  ) {
    return formatCurrencyPt(Number(raw))
  }

  if (
    (headerLower.includes("data") || headerLower.includes("date")) &&
    looksIsoDate(raw)
  ) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: looksIsoDate(raw) && raw.includes("T") ? "short" : undefined,
    }).format(new Date(raw))
  }

  return raw
}

const drawRoundedRect = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: [number, number, number]
) => {
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, w, h, r, r, "F")
}

const drawHeaderBand = (
  doc: jsPDF,
  title: string,
  subtitle?: string,
  pageWidth = doc.internal.pageSize.getWidth()
) => {
  const bandHeight = subtitle ? 42 : 36

  doc.setFillColor(...BRAND.tealDark)
  doc.rect(0, 0, pageWidth, bandHeight, "F")

  doc.setFillColor(...BRAND.teal)
  doc.rect(0, bandHeight - 3, pageWidth, 3, "F")

  doc.setTextColor(...BRAND.tealSoft)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("FINANCEIRO", 16, 12)

  doc.setTextColor(...BRAND.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(title, 16, 24)

  if (subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(190, 230, 220)
    doc.text(subtitle, 16, 33)
  }

  const generated = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(180, 220, 210)
  doc.text(generated, pageWidth - 16, 12, { align: "right" })

  return bandHeight + 8
}

const drawSummaryCards = (
  doc: jsPDF,
  cards: Array<{ label: string; value: string }>,
  startY: number,
  pageWidth: number,
  marginX: number
) => {
  if (cards.length === 0) return startY

  const gap = 4
  const usable = pageWidth - marginX * 2
  const cols = Math.min(cards.length, 4)
  const cardW = (usable - gap * (cols - 1)) / cols
  const cardH = 22

  cards.slice(0, 8).forEach((card, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = marginX + col * (cardW + gap)
    const y = startY + row * (cardH + gap)

    drawRoundedRect(doc, x, y, cardW, cardH, 2.5, BRAND.soft)
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "S")

    doc.setFillColor(...BRAND.teal)
    doc.rect(x, y, 1.4, cardH, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.muted)
    doc.text(card.label, x + 5, y + 7, {
      maxWidth: cardW - 8,
    })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...BRAND.slate)
    doc.text(card.value, x + 5, y + 16, {
      maxWidth: cardW - 8,
    })
  })

  const rows = Math.ceil(Math.min(cards.length, 8) / cols)
  return startY + rows * (cardH + gap) + 4
}

const drawFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)

    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.3)
    doc.line(16, pageHeight - 12, pageWidth - 16, pageHeight - 12)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.muted)
    doc.text("Financeiro · exportação", 16, pageHeight - 7)
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - 16, pageHeight - 7, {
      align: "right",
    })
  }
}

export const downloadPdfTable = ({
  filename,
  title,
  subtitle,
  headers,
  rows,
}: {
  filename: string
  title?: string
  subtitle?: string
  headers: string[]
  rows: CsvCell[][]
}) => {
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length), 1)
  const orientation = columnCount > 5 ? "landscape" : "portrait"
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 14
  const resolvedTitle = title ?? "Exportação"
  let cursorY = drawHeaderBand(doc, resolvedTitle, subtitle, pageWidth)

  const isSectioned = cellText(headers[0]).toLowerCase() === "seção"
  let tableHeaders = headers
  let tableRows = rows
  let summaryCards: Array<{ label: string; value: string }> = []

  if (isSectioned) {
    const summarySource = rows.filter(
      (row) => cellText(row[0]).toLowerCase() === "resumo"
    )
    const detailSource = rows.filter(
      (row) => cellText(row[0]).toLowerCase() !== "resumo"
    )

    summaryCards = summarySource.slice(0, 8).map((row) => ({
      label: cellText(row[1]) || "Resumo",
      value: formatCell(row[2], cellText(headers[2] || "Valor")),
    }))

    if (detailSource.length > 0) {
      tableRows = detailSource
    }
  } else if (headers.length >= 4) {
    // Extrato / generic: lift a few stats into cards
    const valorIdx = headers.findIndex((h) =>
      h.toLowerCase().includes("valor")
    )
    const tipoIdx = headers.findIndex((h) => h.toLowerCase().includes("tipo"))

    if (valorIdx >= 0) {
      let income = 0
      let outflow = 0
      for (const row of rows) {
        const amount = Number(row[valorIdx])
        if (!Number.isFinite(amount)) continue
        if (amount >= 0) income += amount
        else outflow += Math.abs(amount)
      }
      summaryCards = [
        { label: "Lançamentos", value: String(rows.length) },
        { label: "Entradas", value: formatCurrencyPt(income) },
        { label: "Já saiu", value: formatCurrencyPt(outflow) },
        {
          label: "Resultado (extrato)",
          value: formatCurrencyPt(income - outflow),
        },
      ]
    } else if (tipoIdx >= 0) {
      summaryCards = [
        { label: "Linhas", value: String(rows.length) },
        { label: "Colunas", value: String(headers.length) },
      ]
    }
  }

  cursorY = drawSummaryCards(
    doc,
    summaryCards,
    cursorY,
    pageWidth,
    marginX
  )

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...BRAND.slate)
  doc.text(
    isSectioned && tableRows !== rows ? "Detalhamento" : "Dados",
    marginX,
    cursorY + 2
  )
  cursorY += 6

  const formattedBody = tableRows.map((row) =>
    row.map((cell, index) => formatCell(cell, headers[index] ?? ""))
  )

  const valorColumnIndexes = headers
    .map((header, index) =>
      header.toLowerCase().includes("valor") ? index : -1
    )
    .filter((index) => index >= 0)

  const columnStyles: Record<number, Partial<Styles>> = {}
  for (const index of valorColumnIndexes) {
    columnStyles[index] = { halign: "right", fontStyle: "bold" }
  }

  autoTable(doc, {
    head: [tableHeaders.map(cellText)],
    body: formattedBody,
    startY: cursorY,
    margin: { left: marginX, right: marginX, bottom: 18, top: 18 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      overflow: "linebreak",
      textColor: BRAND.slate,
      lineColor: BRAND.border,
      lineWidth: 0.15,
      valign: "middle",
    },
    headStyles: {
      fillColor: BRAND.teal,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
    },
    alternateRowStyles: {
      fillColor: BRAND.soft,
    },
    columnStyles,
    didParseCell: (data) => {
      if (data.section !== "body") return
      const header = headers[data.column.index]?.toLowerCase() ?? ""
      const text = String(data.cell.raw ?? "")

      if (header.includes("tipo")) {
        if (text.toLowerCase().includes("entrada")) {
          data.cell.styles.textColor = BRAND.success
          data.cell.styles.fontStyle = "bold"
        } else if (
          text.toLowerCase().includes("saída") ||
          text.toLowerCase().includes("saida") ||
          text.toLowerCase().includes("pagamento")
        ) {
          data.cell.styles.textColor = BRAND.danger
          data.cell.styles.fontStyle = "bold"
        }
      }

      if (header.includes("valor") && text.includes("-")) {
        data.cell.styles.textColor = BRAND.danger
      }
    },
  })

  drawFooter(doc)

  const base = stripExtension(filename)
  doc.save(`${base}.pdf`)
}
