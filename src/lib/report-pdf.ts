import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type ReportPdfData = {
  monthLabel: string
  summary: {
    income: number
    /** Already left the account / extrato */
    paidExpenses: number
    /** Still scheduled this month */
    openCommitments: number
    /** Income - paid - open (API balanceAfterExpenses) */
    surplus: number
    structuralSurplus: number
    /** Income - paid only */
    afterPaidOnly: number
  }
  previous?: {
    label: string
    income: number
    paidExpenses: number
    openCommitments: number
    surplus: number
    afterPaidOnly: number
  } | null
  categories: Array<{ title: string; total: number; share: number }>
  incomes: Array<{ title: string; value: number; detail: string }>
  recurrings: Array<{ title: string; value: number; detail: string }>
  debts: Array<{ title: string; value: number; detail: string }>
  planned: Array<{ title: string; value: number; detail: string }>
}

type Rgb = [number, number, number]

const C = {
  teal: [15, 118, 110] as Rgb,
  tealDark: [15, 23, 42] as Rgb,
  ink: [15, 23, 42] as Rgb,
  muted: [71, 85, 105] as Rgb,
  line: [203, 213, 225] as Rgb,
  track: [241, 245, 249] as Rgb,
  white: [255, 255, 255] as Rgb,
  soft: [248, 250, 252] as Rgb,
  green: [4, 120, 87] as Rgb,
  amber: [180, 83, 9] as Rgb,
  red: [185, 28, 28] as Rgb,
  cardGreen: [236, 253, 245] as Rgb,
  cardAmber: [255, 251, 235] as Rgb,
  cardTeal: [240, 253, 250] as Rgb,
  cardRed: [254, 242, 242] as Rgb,
}

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

const deltaLabel = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "0%" : "novo"
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const rounded =
    Math.abs(pct) >= 10 ? Math.abs(pct).toFixed(0) : Math.abs(pct).toFixed(1)
  if (pct > 0) return `+${rounded}%`
  if (pct < 0) return `-${rounded}%`
  return "0%"
}

const getFinalY = (doc: jsPDF, fallback: number) => {
  const extended = doc as jsPDF & { lastAutoTable?: { finalY?: number } }
  return extended.lastAutoTable?.finalY ?? fallback
}

const pageBottom = (doc: jsPDF) => doc.internal.pageSize.getHeight() - 20

const ensureSpace = (doc: jsPDF, y: number, needed: number) => {
  if (y + needed <= pageBottom(doc)) return y
  doc.addPage()
  return 20
}

const drawFooter = (doc: jsPDF) => {
  const pages = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.35)
    doc.line(16, pageHeight - 14, pageWidth - 16, pageHeight - 14)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text("Financeiro - relatorio mensal", 16, pageHeight - 8)
    doc.text(`Pagina ${page} de ${pages}`, pageWidth - 16, pageHeight - 8, {
      align: "right",
    })
  }
}

const drawSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...C.ink)
  doc.text(title, 16, y)
  doc.setFillColor(...C.teal)
  doc.rect(16, y + 2.5, 22, 1.1, "F")
  return y + 10
}

const drawKpiCards = (
  doc: jsPDF,
  cards: Array<{
    label: string
    value: string
    hint: string
    accent: Rgb
    bg: Rgb
  }>,
  startY: number,
  pageWidth: number
) => {
  const marginX = 16
  const gap = 5
  const cols = 2
  const cardW = (pageWidth - marginX * 2 - gap) / cols
  const cardH = 26

  cards.forEach((card, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = marginX + col * (cardW + gap)
    const y = startY + row * (cardH + gap)

    doc.setFillColor(...card.bg)
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "F")
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.25)
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "S")
    doc.setFillColor(...card.accent)
    doc.rect(x, y, 2.2, cardH, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(card.label.toUpperCase(), x + 7, y + 7)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...C.ink)
    doc.text(card.value, x + 7, y + 15.5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.2)
    doc.setTextColor(...C.muted)
    doc.text(card.hint, x + 7, y + 21.5, { maxWidth: cardW - 12 })
  })

  const rows = Math.ceil(cards.length / cols)
  return startY + rows * (cardH + gap) + 2
}

const drawFlowBars = (
  doc: jsPDF,
  rows: Array<{ label: string; value: number; color: Rgb }>,
  startY: number,
  pageWidth: number
) => {
  const marginX = 16
  const labelW = 42
  const valueW = 36
  const trackX = marginX + labelW
  const trackW = pageWidth - marginX * 2 - labelW - valueW
  const max = Math.max(...rows.map((row) => row.value), 1)

  let y = startY
  rows.forEach((row) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.ink)
    doc.text(row.label, marginX, y + 3.2)

    doc.setFillColor(...C.track)
    doc.roundedRect(trackX, y, trackW, 5, 1.2, 1.2, "F")
    const barW = Math.max(2, (row.value / max) * trackW)
    doc.setFillColor(...row.color)
    doc.roundedRect(trackX, y, barW, 5, 1.2, 1.2, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.ink)
    doc.text(money(row.value), pageWidth - marginX, y + 3.5, {
      align: "right",
    })
    y += 11
  })

  return y + 2
}

const drawSurplusExplainer = (
  doc: jsPDF,
  summary: ReportPdfData["summary"],
  startY: number,
  pageWidth: number
) => {
  const marginX = 16
  const width = pageWidth - marginX * 2
  const height = 36
  const y = ensureSpace(doc, startY, height + 8)

  doc.setFillColor(255, 251, 235)
  doc.roundedRect(marginX, y, width, height, 2.5, 2.5, "F")
  doc.setDrawColor(253, 230, 138)
  doc.setLineWidth(0.35)
  doc.roundedRect(marginX, y, width, height, 2.5, 2.5, "S")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...C.amber)
  doc.text("Por que a sobra nao e so Receitas - Despesas?", marginX + 4, y + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.8)
  doc.setTextColor(...C.ink)
  const lines = [
    `1) Receitas ${money(summary.income)} - ja pago no extrato ${money(summary.paidExpenses)} = ${money(summary.afterPaidOnly)}.`,
    `2) Ainda falta pagar neste mes: ${money(summary.openCommitments)} (contas, parcelas e previstos em aberto).`,
    `3) Sobra prevista ${money(summary.surplus)} = depois de descontar o que ja saiu E o que ainda esta em aberto.`,
  ]
  let textY = y + 14
  lines.forEach((line) => {
    doc.text(line, marginX + 4, textY, { maxWidth: width - 8 })
    textY += 6
  })

  return y + height + 8
}

const drawCategoryBars = (
  doc: jsPDF,
  categories: ReportPdfData["categories"],
  startY: number,
  pageWidth: number
) => {
  if (categories.length === 0) return startY

  let y = drawSectionTitle(doc, "Gastos por categoria (extrato)", startY)
  const top = [...categories].sort((a, b) => b.total - a.total).slice(0, 8)
  const max = Math.max(...top.map((item) => item.total), 1)
  const marginX = 16
  const valueColW = 42
  const trackW = pageWidth - marginX * 2 - valueColW

  top.forEach((item) => {
    y = ensureSpace(doc, y, 14)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.ink)
    doc.text(item.title, marginX, y)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(
      `${money(item.total)}  |  ${item.share.toFixed(0)}%`,
      pageWidth - marginX,
      y,
      { align: "right" }
    )

    y += 3.5
    doc.setFillColor(...C.track)
    doc.roundedRect(marginX, y, trackW + valueColW, 4, 1, 1, "F")
    const barW = Math.max(2, (item.total / max) * (trackW + valueColW))
    doc.setFillColor(...C.teal)
    doc.roundedRect(marginX, y, barW, 4, 1, 1, "F")
    y += 9
  })

  return y + 2
}

const drawCompare = (
  doc: jsPDF,
  current: ReportPdfData["summary"],
  previous: NonNullable<ReportPdfData["previous"]>,
  startY: number
) => {
  let y = ensureSpace(doc, startY, 62)
  y = drawSectionTitle(doc, `Comparativo vs ${previous.label}`, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  doc.text(
    "Compara os mesmos conceitos: pago, em aberto e sobra prevista.",
    16,
    y
  )
  y += 5

  const rows = [
    {
      label: "Receitas",
      current: current.income,
      previous: previous.income,
    },
    {
      label: "Ja pago (extrato)",
      current: current.paidExpenses,
      previous: previous.paidExpenses,
    },
    {
      label: "Ainda em aberto",
      current: current.openCommitments,
      previous: previous.openCommitments,
    },
    {
      label: "Sobra prevista",
      current: current.surplus,
      previous: previous.surplus,
    },
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16 },
    head: [["Indicador", "Este mes", previous.label, "Variacao"]],
    body: rows.map((row) => [
      row.label,
      money(row.current),
      money(row.previous),
      deltaLabel(row.current, row.previous),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3.2,
      textColor: C.ink,
      lineColor: C.line,
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: C.teal,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      1: {halign: "right", fontStyle: "bold" },
      2: {halign: "right" },
      3: {halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 3) return
      const text = String(data.cell.raw ?? "")
      if (text.startsWith("+")) data.cell.styles.textColor = C.green
      else if (text.startsWith("-")) data.cell.styles.textColor = C.red
      else data.cell.styles.textColor = C.muted
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
  let y = ensureSpace(doc, startY, 36)
  y = drawSectionTitle(doc, title, y)

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text(emptyLabel, 16, y)
    return y + 10
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16, bottom: 20 },
    head: [["Item", "Status", "Valor"]],
    body: rows.map((row) => [row.title, row.detail, money(row.value)]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3.2,
      textColor: C.ink,
      lineColor: C.line,
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: C.teal,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { cellWidth: 88, fontStyle: "bold" },
      1: { cellWidth: 36 },
      2: {halign: "right", fontStyle: "bold", cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 1) return
      const text = String(data.cell.raw ?? "").toLowerCase()
      if (text.includes("paga") || text.includes("pago")) {
        data.cell.styles.textColor = C.green
        data.cell.styles.fontStyle = "bold"
      } else if (text.includes("aberto")) {
        data.cell.styles.textColor = C.amber
        data.cell.styles.fontStyle = "bold"
      } else {
        data.cell.styles.textColor = C.muted
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

  doc.setFillColor(...C.tealDark)
  doc.rect(0, 0, pageWidth, 44, "F")
  doc.setFillColor(...C.teal)
  doc.rect(0, 44, pageWidth, 2.5, "F")

  doc.setTextColor(153, 246, 228)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("FINANCEIRO", 16, 13)

  doc.setTextColor(...C.white)
  doc.setFontSize(18)
  doc.text(`Relatorio - ${data.monthLabel}`, 16, 25)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text(
    "Separando o que ja saiu do extrato do que ainda esta em aberto.",
    16,
    34,
    { maxWidth: pageWidth - 32 }
  )

  const generated = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(generated, pageWidth - 16, 13, { align: "right" })

  let y = 54

  y = drawKpiCards(
    doc,
    [
      {
        label: "Receitas",
        value: money(data.summary.income),
        hint: "Entradas do mes",
        accent: C.green,
        bg: C.cardGreen,
      },
      {
        label: "Ja pago",
        value: money(data.summary.paidExpenses),
        hint: "Saiu no extrato",
        accent: C.amber,
        bg: C.cardAmber,
      },
      {
        label: "Ainda em aberto",
        value: money(data.summary.openCommitments),
        hint: "Contas, parcelas e previstos",
        accent: C.red,
        bg: C.cardRed,
      },
      {
        label: "Sobra prevista",
        value: money(data.summary.surplus),
        hint: surplusPositive
          ? `So extrato daria ${money(data.summary.afterPaidOnly)}`
          : "Depois de descontar o aberto",
        accent: surplusPositive ? C.teal : C.red,
        bg: surplusPositive ? C.cardTeal : C.cardRed,
      },
    ],
    y,
    pageWidth
  )

  y = drawSurplusExplainer(doc, data.summary, y, pageWidth)

  y = ensureSpace(doc, y, 48)
  y = drawSectionTitle(doc, "Composicao do mes", y)
  y = drawFlowBars(
    doc,
    [
      { label: "Receitas", value: data.summary.income, color: C.green },
      { label: "Ja pago", value: data.summary.paidExpenses, color: C.amber },
      {
        label: "Em aberto",
        value: data.summary.openCommitments,
        color: C.red,
      },
    ],
    y,
    pageWidth
  )

  if (data.previous) {
    y = drawCompare(doc, data.summary, data.previous, y)
  }

  y = ensureSpace(doc, y, 40)
  y = drawCategoryBars(doc, data.categories, y, pageWidth)

  y = drawItemsTable(
    doc,
    "Receitas fixas",
    data.incomes,
    y,
    "Nenhuma receita fixa neste mes."
  )
  y = drawItemsTable(
    doc,
    "Contas fixas",
    data.recurrings,
    y,
    "Nenhuma conta fixa neste mes."
  )
  y = drawItemsTable(
    doc,
    "Parcelas",
    data.debts,
    y,
    "Nenhuma parcela neste mes."
  )
  drawItemsTable(
    doc,
    "Gastos previstos",
    data.planned,
    y,
    "Nenhum gasto previsto neste mes."
  )

  drawFooter(doc)

  const base = filename.replace(/\.(csv|pdf)$/i, "")
  doc.save(`${base}.pdf`)
}
