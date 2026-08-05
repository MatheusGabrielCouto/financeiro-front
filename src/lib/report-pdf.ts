import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type ReportPdfData = {
  monthLabel: string
  summary: {
    income: number
    commitments: number
    surplus: number
    structuralSurplus: number
    expenses: number
  }
  previous?: {
    label: string
    income: number
    expenses: number
    surplus: number
  } | null
  categories: Array<{ title: string; total: number; share: number }>
  incomes: Array<{ title: string; value: number; detail: string }>
  recurrings: Array<{ title: string; value: number; detail: string }>
  debts: Array<{ title: string; value: number; detail: string }>
  planned: Array<{ title: string; value: number; detail: string }>
}

const BRAND = {
  teal: [15, 118, 110] as [number, number, number],
  tealDark: [11, 61, 58] as [number, number, number],
  tealSoft: [204, 251, 241] as [number, number, number],
  slate: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  soft: [248, 250, 252] as [number, number, number],
  softTeal: [240, 253, 250] as [number, number, number],
  softAmber: [255, 251, 235] as [number, number, number],
  softRed: [254, 242, 242] as [number, number, number],
  softGreen: [236, 253, 245] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [5, 150, 105] as [number, number, number],
  warning: [217, 119, 6] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
}

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

const deltaLabel = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "0%" : "novo"
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : ""
  return `${sign}${Math.abs(pct).toFixed(0)}%`
}

const getFinalY = (doc: jsPDF, fallback: number) => {
  const extended = doc as jsPDF & { lastAutoTable?: { finalY?: number } }
  return extended.lastAutoTable?.finalY ?? fallback
}

const ensureSpace = (doc: jsPDF, cursorY: number, needed: number) => {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (cursorY + needed < pageHeight - 18) return cursorY
  doc.addPage()
  return 18
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
    doc.text("Financeiro · relatório mensal", 16, pageHeight - 7)
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - 16, pageHeight - 7, {
      align: "right",
    })
  }
}

const drawSectionTitle = (doc: jsPDF, title: string, y: number, x = 16) => {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...BRAND.slate)
  doc.text(title, x, y)
  doc.setDrawColor(...BRAND.teal)
  doc.setLineWidth(0.8)
  doc.line(x, y + 2, x + 28, y + 2)
  return y + 8
}

const drawKpiCards = (
  doc: jsPDF,
  cards: Array<{
    label: string
    value: string
    hint?: string
    tone: "teal" | "amber" | "green" | "red" | "slate"
  }>,
  startY: number,
  pageWidth: number
) => {
  const marginX = 16
  const gap = 4
  const cols = 4
  const cardW = (pageWidth - marginX * 2 - gap * (cols - 1)) / cols
  const cardH = 28

  const tones = {
    teal: { bg: BRAND.softTeal, accent: BRAND.teal, value: BRAND.teal },
    amber: { bg: BRAND.softAmber, accent: BRAND.warning, value: BRAND.warning },
    green: { bg: BRAND.softGreen, accent: BRAND.success, value: BRAND.success },
    red: { bg: BRAND.softRed, accent: BRAND.danger, value: BRAND.danger },
    slate: { bg: BRAND.soft, accent: BRAND.muted, value: BRAND.slate },
  } as const

  cards.forEach((card, index) => {
    const x = marginX + index * (cardW + gap)
    const tone = tones[card.tone]

    doc.setFillColor(...tone.bg)
    doc.roundedRect(x, startY, cardW, cardH, 3, 3, "F")
    doc.setFillColor(...tone.accent)
    doc.roundedRect(x, startY, cardW, 1.6, 1, 1, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.muted)
    doc.text(card.label, x + 4, startY + 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...tone.value)
    doc.text(card.value, x + 4, startY + 17, { maxWidth: cardW - 8 })

    if (card.hint) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...BRAND.muted)
      doc.text(card.hint, x + 4, startY + 24, { maxWidth: cardW - 8 })
    }
  })

  return startY + cardH + 8
}

const drawFlowBars = (
  doc: jsPDF,
  income: number,
  commitments: number,
  startY: number,
  pageWidth: number
) => {
  const marginX = 16
  const width = pageWidth - marginX * 2
  const max = Math.max(income, commitments, 1)

  const rows = [
    { label: "Receitas", value: income, color: BRAND.success },
    { label: "Compromissos", value: commitments, color: BRAND.warning },
  ]

  let y = startY
  rows.forEach((row) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.muted)
    doc.text(row.label, marginX, y)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...BRAND.slate)
    doc.text(money(row.value), pageWidth - marginX, y, { align: "right" })

    y += 3
    doc.setFillColor(...BRAND.soft)
    doc.roundedRect(marginX, y, width, 5, 1.5, 1.5, "F")
    const barW = Math.max(2, (row.value / max) * width)
    doc.setFillColor(...row.color)
    doc.roundedRect(marginX, y, barW, 5, 1.5, 1.5, "F")
    y += 10
  })

  return y + 2
}

const drawCategoryBars = (
  doc: jsPDF,
  categories: ReportPdfData["categories"],
  startY: number,
  pageWidth: number
) => {
  if (categories.length === 0) return startY

  const marginX = 16
  const width = pageWidth - marginX * 2 - 56
  let y = drawSectionTitle(doc, "Gastos por categoria", startY, marginX)
  const top = [...categories].sort((a, b) => b.total - a.total).slice(0, 8)
  const max = Math.max(...top.map((item) => item.total), 1)

  top.forEach((item, index) => {
    y = ensureSpace(doc, y, 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.slate)
    doc.text(item.title, marginX, y, { maxWidth: 48 })

    const barX = marginX + 50
    doc.setFillColor(...BRAND.soft)
    doc.roundedRect(barX, y - 3.2, width, 4.5, 1.2, 1.2, "F")
    const barW = Math.max(1.5, (item.total / max) * width)
    const shade = index % 2 === 0 ? BRAND.teal : [45, 212, 191]
    doc.setFillColor(shade[0], shade[1], shade[2])
    doc.roundedRect(barX, y - 3.2, barW, 4.5, 1.2, 1.2, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.muted)
    doc.text(
      `${money(item.total)} · ${item.share.toFixed(0)}%`,
      pageWidth - marginX,
      y,
      { align: "right" }
    )
    y += 8
  })

  return y + 4
}

const drawCompare = (
  doc: jsPDF,
  current: ReportPdfData["summary"],
  previous: NonNullable<ReportPdfData["previous"]>,
  startY: number,
  pageWidth: number
) => {
  let y = ensureSpace(doc, startY, 40)
  y = drawSectionTitle(doc, `Comparativo vs ${previous.label}`, y)

  const rows = [
    {
      label: "Receitas",
      current: current.income,
      previous: previous.income,
      lowerIsBetter: false,
    },
    {
      label: "Despesas",
      current: current.expenses,
      previous: previous.expenses,
      lowerIsBetter: true,
    },
    {
      label: "Sobra",
      current: current.surplus,
      previous: previous.surplus,
      lowerIsBetter: false,
    },
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16 },
    head: [["Indicador", "Este mês", previous.label, "Variação"]],
    body: rows.map((row) => {
      const delta = deltaLabel(row.current, row.previous)
      return [row.label, money(row.current), money(row.previous), delta]
    }),
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: BRAND.slate,
      lineColor: BRAND.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: BRAND.tealDark,
      textColor: BRAND.white,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: BRAND.soft },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 3) return
      const text = String(data.cell.raw ?? "")
      if (text.startsWith("+")) data.cell.styles.textColor = BRAND.success
      if (text.startsWith("−") || text.startsWith("-")) {
        data.cell.styles.textColor = BRAND.danger
      }
    },
  })

  return getFinalY(doc, y) + 10
}

const drawItemsTable = (
  doc: jsPDF,
  title: string,
  rows: Array<{ title: string; value: number; detail: string }>,
  startY: number,
  emptyLabel: string
) => {
  let y = ensureSpace(doc, startY, 28)
  y = drawSectionTitle(doc, title, y)

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.muted)
    doc.text(emptyLabel, 16, y)
    return y + 8
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16, bottom: 18 },
    head: [["Item", "Detalhe", "Valor"]],
    body: rows.map((row) => [row.title, row.detail, money(row.value)]),
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: BRAND.slate,
      lineColor: BRAND.border,
      lineWidth: 0.12,
      valign: "middle",
    },
    headStyles: {
      fillColor: BRAND.teal,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: BRAND.soft },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: "auto", textColor: BRAND.muted },
      2: { halign: "right", fontStyle: "bold", cellWidth: 36 },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 1) return
      const text = String(data.cell.raw ?? "").toLowerCase()
      if (text.includes("paga") || text.includes("paid")) {
        data.cell.styles.textColor = BRAND.success
      }
      if (text.includes("aberto") || text.includes("scheduled")) {
        data.cell.styles.textColor = BRAND.warning
      }
    },
  })

  return getFinalY(doc, y) + 10
}

export const downloadReportPdf = ({
  filename,
  data,
}: {
  filename: string
  data: ReportPdfData
}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const surplusPositive = data.summary.surplus >= 0

  // Cover header
  doc.setFillColor(...BRAND.tealDark)
  doc.rect(0, 0, pageWidth, 48, "F")
  doc.setFillColor(...BRAND.teal)
  doc.rect(0, 45, pageWidth, 3, "F")

  doc.setTextColor(...BRAND.tealSoft)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("FINANCEIRO", 16, 14)

  doc.setTextColor(...BRAND.white)
  doc.setFontSize(20)
  doc.text(`Relatório · ${data.monthLabel}`, 16, 28)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(186, 230, 216)
  doc.text(
    "Visão consolidada do mês: receitas, compromissos, categorias e detalhamento.",
    16,
    38,
    { maxWidth: pageWidth - 32 }
  )

  const generated = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
  doc.setFontSize(8)
  doc.text(generated, pageWidth - 16, 14, { align: "right" })

  let y = 58

  y = drawKpiCards(
    doc,
    [
      {
        label: "Receitas",
        value: money(data.summary.income),
        hint: "Entradas do mês",
        tone: "green",
      },
      {
        label: "Compromissos",
        value: money(data.summary.commitments),
        hint: "Fixas + parcelas + previstos",
        tone: "amber",
      },
      {
        label: "Sobra do mês",
        value: money(data.summary.surplus),
        hint: surplusPositive ? "Mês no azul" : "Atenção ao fluxo",
        tone: surplusPositive ? "teal" : "red",
      },
      {
        label: "Despesas totais",
        value: money(data.summary.expenses),
        hint: `Estrutural ${money(data.summary.structuralSurplus)}`,
        tone: "slate",
      },
    ],
    y,
    pageWidth
  )

  y = drawSectionTitle(doc, "Receita vs compromissos", y)
  y = drawFlowBars(
    doc,
    data.summary.income,
    data.summary.commitments,
    y,
    pageWidth
  )

  if (data.previous) {
    y = drawCompare(doc, data.summary, data.previous, y, pageWidth)
  }

  y = drawCategoryBars(doc, data.categories, y, pageWidth)

  y = drawItemsTable(
    doc,
    "Receitas fixas",
    data.incomes,
    y,
    "Nenhuma receita fixa neste mês."
  )
  y = drawItemsTable(
    doc,
    "Contas fixas",
    data.recurrings,
    y,
    "Nenhuma conta fixa neste mês."
  )
  y = drawItemsTable(
    doc,
    "Parcelas",
    data.debts,
    y,
    "Nenhuma parcela neste mês."
  )
  drawItemsTable(
    doc,
    "Gastos previstos",
    data.planned,
    y,
    "Nenhum gasto previsto neste mês."
  )

  drawFooter(doc)

  const base = filename.replace(/\.(csv|pdf)$/i, "")
  doc.save(`${base}.pdf`)
}
