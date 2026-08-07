import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type DebtOverviewPdfData = {
  summary: {
    debtRemaining: number
    fixedMonthly: number
    plannedRemaining: number
    total: number
  }
  debts: Array<{
    title: string
    category: string
    remainingInstallments: number
    totalInstallments: number
    remainingValue: number
    nextDueDate: string | null
  }>
  fixed: Array<{
    title: string
    category: string
    value: number
    dayOfMonth: number
  }>
  planned: Array<{
    title: string
    category: string
    value: number
    dueDate: string
  }>
}

type Rgb = [number, number, number]

const C = {
  teal: [15, 118, 110] as Rgb,
  tealDark: [15, 23, 42] as Rgb,
  ink: [15, 23, 42] as Rgb,
  muted: [71, 85, 105] as Rgb,
  line: [203, 213, 225] as Rgb,
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

const date = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—"

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
    doc.text("Financeiro - consolidado de dividas", 16, pageHeight - 8)
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

const drawExplainer = (doc: jsPDF, startY: number, pageWidth: number) => {
  const marginX = 16
  const width = pageWidth - marginX * 2
  const height = 24
  const y = ensureSpace(doc, startY, height + 8)

  doc.setFillColor(255, 251, 235)
  doc.roundedRect(marginX, y, width, height, 2.5, 2.5, "F")
  doc.setDrawColor(253, 230, 138)
  doc.setLineWidth(0.35)
  doc.roundedRect(marginX, y, width, height, 2.5, 2.5, "S")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...C.amber)
  doc.text("Como ler o total consolidado", marginX + 4, y + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.8)
  doc.setTextColor(...C.ink)
  const lines = [
    "O total soma o saldo restante das dividas + os gastos previstos em aberto + 1 mes de gastos fixos,",
    "ja que os gastos fixos se repetem todo mes (nao tem um fim programado).",
  ]
  let textY = y + 14
  lines.forEach((line) => {
    doc.text(line, marginX + 4, textY, { maxWidth: width - 8 })
    textY += 5.5
  })

  return y + height + 8
}

const drawDebtsTable = (
  doc: jsPDF,
  rows: DebtOverviewPdfData["debts"],
  startY: number
) => {
  let y = ensureSpace(doc, startY, 36)
  y = drawSectionTitle(doc, "Dividas em aberto", y)

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text("Nenhuma divida em aberto.", 16, y)
    return y + 10
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16, bottom: 20 },
    head: [
      ["Divida", "Categoria", "Parcelas restantes", "Proxima parcela", "Valor restante"],
    ],
    body: rows.map((row) => [
      row.title,
      row.category,
      `${row.remainingInstallments}/${row.totalInstallments}`,
      date(row.nextDueDate),
      money(row.remainingValue),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
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
      fontSize: 8.2,
    },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "right", fontStyle: "bold" },
    },
  })

  return getFinalY(doc, y) + 10
}

const drawFixedTable = (
  doc: jsPDF,
  rows: DebtOverviewPdfData["fixed"],
  startY: number
) => {
  let y = ensureSpace(doc, startY, 36)
  y = drawSectionTitle(doc, "Gastos fixos (contas recorrentes)", y)

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text("Nenhum gasto fixo cadastrado.", 16, y)
    return y + 10
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16, bottom: 20 },
    head: [["Conta", "Categoria", "Vencimento", "Valor mensal"]],
    body: rows.map((row) => [
      row.title,
      row.category,
      `Todo dia ${row.dayOfMonth}`,
      money(row.value),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
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
      fontSize: 8.2,
    },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "right", fontStyle: "bold" },
    },
  })

  return getFinalY(doc, y) + 10
}

const drawPlannedTable = (
  doc: jsPDF,
  rows: DebtOverviewPdfData["planned"],
  startY: number
) => {
  let y = ensureSpace(doc, startY, 36)
  y = drawSectionTitle(doc, "Gastos previstos (em aberto)", y)

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text("Nenhum gasto previsto em aberto.", 16, y)
    return y + 10
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16, bottom: 20 },
    head: [["Item", "Categoria", "Vencimento", "Valor"]],
    body: rows.map((row) => [
      row.title,
      row.category,
      date(row.dueDate),
      money(row.value),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
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
      fontSize: 8.2,
    },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "right", fontStyle: "bold" },
    },
  })

  return getFinalY(doc, y) + 10
}

export const downloadDebtOverviewPdf = ({
  filename,
  data,
}: {
  filename: string
  data: DebtOverviewPdfData
}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()

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
  doc.text("Consolidado de dividas", 16, 25)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text(
    "Tudo que voce deve: dividas ativas, contas fixas e gastos previstos.",
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
        label: "Dividas em aberto",
        value: money(data.summary.debtRemaining),
        hint: "Saldo restante de todas as dividas ativas",
        accent: C.red,
        bg: C.cardRed,
      },
      {
        label: "Gastos fixos",
        value: money(data.summary.fixedMonthly),
        hint: "Total mensal recorrente",
        accent: C.amber,
        bg: C.cardAmber,
      },
      {
        label: "Gastos previstos",
        value: money(data.summary.plannedRemaining),
        hint: "Ainda nao pagos",
        accent: C.amber,
        bg: C.cardAmber,
      },
      {
        label: "Total consolidado",
        value: money(data.summary.total),
        hint: "Dividas + previstos + 1 mes de fixos",
        accent: C.teal,
        bg: C.cardTeal,
      },
    ],
    y,
    pageWidth
  )

  y = drawExplainer(doc, y, pageWidth)

  y = drawDebtsTable(doc, data.debts, y)
  y = drawFixedTable(doc, data.fixed, y)
  drawPlannedTable(doc, data.planned, y)

  drawFooter(doc)

  const base = filename.replace(/\.(csv|pdf)$/i, "")
  doc.save(`${base}.pdf`)
}
