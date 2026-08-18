import { jsPDF } from "jspdf"
import { formatDateKey } from "@/lib/format"

export type JournalReportPdfEntry = {
  date: string
  moodLabel: string | null
  content: string
}

export type JournalReportPdfData = {
  monthLabel: string
  entries: JournalReportPdfEntry[]
}

type Rgb = [number, number, number]

const C = {
  indigoDark: [30, 27, 75] as Rgb,
  indigo: [79, 70, 229] as Rgb,
  ink: [15, 23, 42] as Rgb,
  muted: [71, 85, 105] as Rgb,
  line: [226, 232, 240] as Rgb,
  soft: [245, 245, 255] as Rgb,
  white: [255, 255, 255] as Rgb,
}

type Run = { text: string; bold: boolean; italic: boolean; strike: boolean }
type Block =
  | { kind: "paragraph" | "blockquote"; runs: Run[] }
  | { kind: "heading"; level: number; runs: Run[] }
  | { kind: "list"; ordered: boolean; items: Run[][] }

const extractRuns = (
  node: Node,
  bold = false,
  italic = false,
  strike = false
): Run[] => {
  const runs: Run[] = []

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? ""
      if (text) runs.push({ text, bold, italic, strike })
      return
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return

    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === "br") {
      runs.push({ text: "\n", bold, italic, strike })
      return
    }

    runs.push(
      ...extractRuns(
        el,
        bold || tag === "b" || tag === "strong",
        italic || tag === "i" || tag === "em",
        strike || tag === "s" || tag === "strike" || tag === "del"
      )
    )
  })

  return runs
}

const hasVisibleText = (runs: Run[]) => runs.some((run) => run.text.trim())

/** Parses sanitized journal HTML into styled blocks. Browser-only (uses the DOM). */
const parseEntryHtml = (html: string): Block[] => {
  const container = document.createElement("div")
  container.innerHTML = html
  const blocks: Block[] = []

  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ""
      if (text.trim()) blocks.push({ kind: "paragraph", runs: [{ text, bold: false, italic: false, strike: false }] })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const runs = extractRuns(el)
      if (hasVisibleText(runs)) blocks.push({ kind: "heading", level: Number(tag[1]), runs })
      return
    }

    if (tag === "blockquote") {
      const runs = extractRuns(el)
      if (hasVisibleText(runs)) blocks.push({ kind: "blockquote", runs })
      return
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.children)
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map((li) => extractRuns(li))
        .filter(hasVisibleText)
      if (items.length > 0) blocks.push({ kind: "list", ordered: tag === "ol", items })
      return
    }

    // Loose inline tag at the top level (e.g. a bare <strike>...</strike> with no <p> wrapper
    // yet, common for the very first edit before Enter creates a paragraph) — the element's
    // own tag carries formatting that extractRuns would otherwise only detect on its children.
    const runs = extractRuns(
      el,
      tag === "b" || tag === "strong",
      tag === "i" || tag === "em",
      tag === "s" || tag === "strike" || tag === "del"
    )
    if (hasVisibleText(runs)) blocks.push({ kind: "paragraph", runs })
  })

  return blocks
}

type Word = { text: string; bold: boolean; italic: boolean; strike: boolean; lineBreak?: boolean }

const runsToWords = (runs: Run[]): Word[] => {
  const words: Word[] = []

  for (const run of runs) {
    const lines = run.text.split("\n")
    lines.forEach((line, index) => {
      line
        .split(/\s+/)
        .filter(Boolean)
        .forEach((text) => words.push({ text, bold: run.bold, italic: run.italic, strike: run.strike }))
      if (index < lines.length - 1) words.push({ text: "", bold: false, italic: false, strike: false, lineBreak: true })
    })
  }

  return words
}

const fontStyleFor = (word: Word) =>
  word.bold && word.italic ? "bolditalic" : word.bold ? "bold" : word.italic ? "italic" : "normal"

const wrapWords = (doc: jsPDF, words: Word[], maxWidth: number, fontSize: number): Word[][] => {
  doc.setFontSize(fontSize)
  doc.setFont("helvetica", "normal")
  const spaceWidth = doc.getTextWidth(" ")
  const lines: Word[][] = [[]]

  for (const word of words) {
    if (word.lineBreak) {
      lines.push([])
      continue
    }

    doc.setFont("helvetica", fontStyleFor(word))
    const wordWidth = doc.getTextWidth(word.text)
    const line = lines[lines.length - 1]
    const lineWidth = line.reduce(
      (sum, w, i) => sum + doc.getTextWidth(w.text) + (i > 0 ? spaceWidth : 0),
      0
    )

    if (line.length > 0 && lineWidth + spaceWidth + wordWidth > maxWidth) {
      lines.push([word])
    } else {
      line.push(word)
    }
  }

  return lines.filter((line) => line.length > 0) as Word[][]
}

const ptToMm = (pt: number) => pt * 0.3527

const pageBottom = (doc: jsPDF) => doc.internal.pageSize.getHeight() - 20

const ensureSpace = (doc: jsPDF, y: number, needed: number) => {
  if (y + needed <= pageBottom(doc)) return y
  doc.addPage()
  return 20
}

const drawWrappedLines = (
  doc: jsPDF,
  lines: Word[][],
  x: number,
  y: number,
  fontSize: number,
  color: Rgb
): number => {
  const lineHeight = ptToMm(fontSize) * 1.5
  let cursorY = y

  for (const line of lines) {
    cursorY = ensureSpace(doc, cursorY, lineHeight)
    let cursorX = x
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)

    line.forEach((word, index) => {
      if (index > 0) cursorX += doc.getTextWidth(" ")
      doc.setFont("helvetica", fontStyleFor(word))
      doc.text(word.text, cursorX, cursorY)

      const width = doc.getTextWidth(word.text)
      if (word.strike) {
        doc.setDrawColor(...color)
        doc.setLineWidth(0.25)
        const strikeY = cursorY - ptToMm(fontSize) * 0.32
        doc.line(cursorX, strikeY, cursorX + width, strikeY)
      }

      cursorX += width
    })

    cursorY += lineHeight
  }

  return cursorY
}

const drawBlock = (doc: jsPDF, block: Block, x: number, y: number, maxWidth: number): number => {
  if (block.kind === "heading") {
    const fontSize = block.level === 1 ? 12.5 : 11
    const words = runsToWords(block.runs).map((w) => ({ ...w, bold: true }))
    const lines = wrapWords(doc, words, maxWidth, fontSize)
    return drawWrappedLines(doc, lines, x, y, fontSize, C.ink) + 1
  }

  if (block.kind === "blockquote") {
    const words = runsToWords(block.runs)
    const lines = wrapWords(doc, words, maxWidth - 4, 9.5)
    const startY = y
    const endY = drawWrappedLines(doc, lines, x + 4, y, 9.5, C.muted)
    doc.setDrawColor(...C.indigo)
    doc.setLineWidth(0.6)
    doc.line(x, startY - 2.5, x, endY - 2.5)
    return endY + 1
  }

  if (block.kind === "list") {
    let cursorY = y
    block.items.forEach((itemRuns, index) => {
      const marker = block.ordered ? `${index + 1}.` : "•"
      const markerWidth = doc.getTextWidth(`${marker} `) + 1
      const words = runsToWords(itemRuns)
      const lines = wrapWords(doc, words, maxWidth - markerWidth, 9.5)

      cursorY = ensureSpace(doc, cursorY, ptToMm(9.5) * 1.5)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9.5)
      doc.setTextColor(...C.muted)
      doc.text(marker, x, cursorY)

      cursorY = drawWrappedLines(doc, lines, x + markerWidth, cursorY, 9.5, C.ink)
    })
    return cursorY + 1
  }

  const words = runsToWords(block.runs)
  const lines = wrapWords(doc, words, maxWidth, 9.5)
  return drawWrappedLines(doc, lines, x, y, 9.5, C.ink) + 1
}

const drawEntry = (
  doc: jsPDF,
  entry: JournalReportPdfEntry,
  y: number,
  pageWidth: number,
  marginX: number
): number => {
  const maxWidth = pageWidth - marginX * 2

  y = ensureSpace(doc, y, 14)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(...C.indigo)
  doc.text(formatDateKey(entry.date), marginX, y)

  if (entry.moodLabel) {
    // Standard PDF fonts have no emoji glyphs — show the mood as plain text, not the emoji.
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text(`Humor: ${entry.moodLabel}`, pageWidth - marginX, y, { align: "right" })
  }

  y += 6

  const blocks = parseEntryHtml(entry.content)
  for (const block of blocks) {
    y = drawBlock(doc, block, marginX, y, maxWidth)
  }

  y += 3
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.2)
  doc.line(marginX, y, pageWidth - marginX, y)

  return y + 7
}

const drawFooter = (doc: jsPDF) => {
  const pages = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.3)
    doc.line(16, pageHeight - 12, pageWidth - 16, pageHeight - 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text("Nexo - diário", 16, pageHeight - 7)
    doc.text(`Página ${page} de ${pages}`, pageWidth - 16, pageHeight - 7, {
      align: "right",
    })
  }
}

export const downloadJournalReportPdf = ({
  filename,
  data,
}: {
  filename: string
  data: JournalReportPdfData
}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 16

  doc.setFillColor(...C.indigoDark)
  doc.rect(0, 0, pageWidth, 40, "F")
  doc.setFillColor(...C.indigo)
  doc.rect(0, 40, pageWidth, 2.5, "F")

  doc.setTextColor(199, 210, 254)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("FINANCEIRO", marginX, 13)

  doc.setTextColor(...C.white)
  doc.setFontSize(18)
  doc.text(`Diário - ${data.monthLabel}`, marginX, 25)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text(`${data.entries.length} entrada(s) no mês`, marginX, 34)

  const generated = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
  doc.setFontSize(8)
  doc.setTextColor(165, 180, 252)
  doc.text(generated, pageWidth - marginX, 13, { align: "right" })

  let y = 52

  for (const entry of data.entries) {
    y = drawEntry(doc, entry, y, pageWidth, marginX)
  }

  drawFooter(doc)

  const base = filename.replace(/\.(csv|pdf)$/i, "")
  doc.save(`${base}.pdf`)
}
