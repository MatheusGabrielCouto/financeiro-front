import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type RoutineReportPdfData = {
  monthLabel: string
  month: number
  year: number
  summary: {
    activeRoutines: number
    overallAdherencePct: number
    perfectDays: number
    bestCurrentStreak: number
  }
  routines: Array<{
    title: string
    color: string
    expectedDays: number
    completedDays: number
    adherencePct: number
    currentStreak: number
    bestStreak: number
  }>
  dailySeries: Array<{ date: string; expected: number; completed: number }>
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
  amberSolid: [245, 158, 11] as Rgb,
  cardGreen: [236, 253, 245] as Rgb,
  cardAmber: [255, 251, 235] as Rgb,
  cardTeal: [240, 253, 250] as Rgb,
}

// Solid (-500) / soft (-100) pairs mirroring the app's per-routine color picker
const ROUTINE_PDF_COLORS: Record<string, { solid: Rgb; soft: Rgb }> = {
  teal: { solid: [20, 184, 166], soft: [204, 251, 241] },
  amber: { solid: [245, 158, 11], soft: [254, 243, 199] },
  rose: { solid: [244, 63, 94], soft: [255, 228, 230] },
  violet: { solid: [139, 92, 246], soft: [237, 233, 254] },
  blue: { solid: [59, 130, 246], soft: [219, 234, 254] },
  emerald: { solid: [16, 185, 129], soft: [209, 250, 229] },
}

const routineColor = (id: string) => ROUTINE_PDF_COLORS[id] ?? ROUTINE_PDF_COLORS.teal

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
    doc.text("Nexo - relatorio de rotinas", 16, pageHeight - 8)
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

/** Small filled circle with the routine's first letter, mirroring the app's avatar chip */
const drawInitialBadge = (
  doc: jsPDF,
  title: string,
  color: string,
  cx: number,
  cy: number,
  radius: number
) => {
  doc.setFillColor(...routineColor(color).solid)
  doc.circle(cx, cy, radius, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(radius * 2.6)
  doc.setTextColor(...C.white)
  doc.text((title.trim()[0] ?? "?").toUpperCase(), cx, cy + radius * 0.35, {
    align: "center",
  })
}

/** Small filled circle with a streak count, used next to adherence rows and the table */
const drawStreakBadge = (doc: jsPDF, streak: number, x: number, y: number) => {
  if (streak <= 0) return x
  const radius = 3
  doc.setFillColor(...C.amberSolid)
  doc.circle(x - radius, y - 1, radius, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...C.white)
  doc.text(String(streak), x - radius, y + 0.6, { align: "center" })
  return x - radius * 2 - 2
}

const drawKpiCards = (
  doc: jsPDF,
  cards: Array<{ label: string; value: string; hint: string; accent: Rgb; bg: Rgb }>,
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

const drawAdherenceBars = (
  doc: jsPDF,
  routines: RoutineReportPdfData["routines"],
  startY: number,
  pageWidth: number
) => {
  if (routines.length === 0) return startY

  let y = drawSectionTitle(doc, "Adesão por rotina", startY)
  const marginX = 16
  const badgeR = 3
  const labelX = marginX + badgeR * 2 + 3
  const labelW = 48
  const valueW = 26
  const trackX = labelX + labelW
  const trackW = pageWidth - marginX - valueW - trackX

  const sorted = [...routines].sort((a, b) => b.adherencePct - a.adherencePct)

  sorted.forEach((routine) => {
    y = ensureSpace(doc, y, 12)
    const palette = routineColor(routine.color)

    drawInitialBadge(doc, routine.title, routine.color, marginX + badgeR, y + 1.6, badgeR)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.ink)
    doc.text(routine.title, labelX, y + 3.2, { maxWidth: labelW - 3 })

    doc.setFillColor(...palette.soft)
    doc.roundedRect(trackX, y, trackW, 5, 1.2, 1.2, "F")
    const barW = Math.max(routine.completedDays > 0 ? 3 : 0, (routine.adherencePct / 100) * trackW)
    doc.setFillColor(...palette.solid)
    doc.roundedRect(trackX, y, barW, 5, 1.2, 1.2, "F")

    const pctX = pageWidth - marginX
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.ink)
    doc.text(`${routine.adherencePct}%`, pctX, y + 3.5, { align: "right" })
    drawStreakBadge(doc, routine.currentStreak, pctX - 12, y + 3.5)

    y += 12
  })

  return y + 2
}

const drawMonthHeatmap = (
  doc: jsPDF,
  month: number,
  year: number,
  dailySeries: RoutineReportPdfData["dailySeries"],
  startY: number,
  pageWidth: number
) => {
  let y = ensureSpace(doc, startY, 60)
  y = drawSectionTitle(doc, "Mapa do mês", y)

  if (dailySeries.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text("Sem dados neste mês.", 16, y)
    return y + 10
  }

  const marginX = 16
  const cell = 9
  const gap = 1.6
  const byDate = new Map(dailySeries.map((item) => [item.date, item]))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"]

  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.setTextColor(...C.muted)
  weekdayLabels.forEach((label, index) => {
    doc.text(label, marginX + index * (cell + gap) + cell / 2, y, { align: "center" })
  })
  y += 3

  let col = firstWeekday
  let row = 0

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const entry = byDate.get(key)
    const x = marginX + col * (cell + gap)
    const cy = y + row * (cell + gap)
    const ratio = entry && entry.expected > 0 ? entry.completed / entry.expected : null

    let fill: Rgb = C.soft
    let textColor: Rgb = C.muted
    if (ratio !== null) {
      if (ratio === 0) {
        fill = [241, 245, 249]
      } else if (ratio < 0.5) {
        fill = [204, 251, 241]
        textColor = C.teal
      } else if (ratio < 1) {
        fill = [94, 234, 212]
        textColor = C.white
      } else {
        fill = C.teal
        textColor = C.white
      }
    }

    doc.setFillColor(...fill)
    doc.roundedRect(x, cy, cell, cell, 1, 1, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.5)
    doc.setTextColor(...textColor)
    doc.text(String(day), x + cell / 2, cy + cell / 2 + 1.2, { align: "center" })

    col += 1
    if (col > 6) {
      col = 0
      row += 1
    }
  }

  return y + (row + 1) * (cell + gap) + 6
}

const drawRoutinesTable = (
  doc: jsPDF,
  routines: RoutineReportPdfData["routines"],
  startY: number
) => {
  let y = ensureSpace(doc, startY, 36)
  y = drawSectionTitle(doc, "Detalhamento do mês", y)

  if (routines.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text("Nenhuma rotina ativa neste mês.", 16, y)
    return y + 10
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16, bottom: 20 },
    head: [
      ["", "Rotina", "Esperado", "Concluído", "Adesão", "Sequência", "Melhor"],
    ],
    body: routines.map((routine) => [
      "",
      routine.title,
      String(routine.expectedDays),
      String(routine.completedDays),
      `${routine.adherencePct}%`,
      String(routine.currentStreak),
      String(routine.bestStreak),
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
      0: { cellWidth: 8 },
      1: { fontStyle: "bold" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    didDrawCell: (cell) => {
      if (cell.section !== "body" || cell.column.index !== 0) return
      const routine = routines[cell.row.index]
      if (!routine) return
      const cx = cell.cell.x + cell.cell.width / 2
      const cy = cell.cell.y + cell.cell.height / 2
      drawInitialBadge(doc, routine.title, routine.color, cx, cy, 2.6)
    },
  })

  return getFinalY(doc, y) + 10
}

export const downloadRoutineReportPdf = ({
  filename,
  data,
}: {
  filename: string
  data: RoutineReportPdfData
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
  doc.text(`Rotinas - ${data.monthLabel}`, 16, 25)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text("Acompanhamento de hábitos e adesão diária.", 16, 34)

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
        label: "Rotinas ativas",
        value: String(data.summary.activeRoutines),
        hint: "Em acompanhamento este mês",
        accent: C.teal,
        bg: C.cardTeal,
      },
      {
        label: "Adesão geral",
        value: `${data.summary.overallAdherencePct}%`,
        hint: "Dias concluídos / esperados",
        accent: data.summary.overallAdherencePct >= 80 ? C.green : C.amber,
        bg: data.summary.overallAdherencePct >= 80 ? C.cardGreen : C.cardAmber,
      },
      {
        label: "Dias perfeitos",
        value: String(data.summary.perfectDays),
        hint: "Todas as rotinas do dia concluídas",
        accent: C.green,
        bg: C.cardGreen,
      },
      {
        label: "Melhor sequência",
        value: `${data.summary.bestCurrentStreak} dia${data.summary.bestCurrentStreak === 1 ? "" : "s"}`,
        hint: "Sequência atual mais longa",
        accent: C.teal,
        bg: C.cardTeal,
      },
    ],
    y,
    pageWidth
  )

  y = ensureSpace(doc, y, 40)
  y = drawAdherenceBars(doc, data.routines, y, pageWidth)

  y = ensureSpace(doc, y, 60)
  y = drawMonthHeatmap(doc, data.month, data.year, data.dailySeries, y, pageWidth)

  drawRoutinesTable(doc, data.routines, y)

  drawFooter(doc)

  const base = filename.replace(/\.(csv|pdf)$/i, "")
  doc.save(`${base}.pdf`)
}
