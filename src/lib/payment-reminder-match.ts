import type { PaymentReminder } from "@/lib/types"

export type ReminderMatchInput = {
  message: string
  value: number
}

export type ReminderMatch = {
  reminder: PaymentReminder
  score: number
  reasons: string[]
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2)

const valueTolerance = (amount: number) => Math.max(0.5, amount * 0.02)

const titleScore = (message: string, reminder: PaymentReminder) => {
  const msg = normalize(message)
  const title = normalize(reminder.title)
  const notes = normalize(reminder.notes ?? "")
  if (!msg || !title) return { score: 0, reasons: [] as string[] }

  if (msg === title) {
    return { score: 1, reasons: ["título idêntico"] }
  }

  if (title.includes(msg) || msg.includes(title)) {
    return { score: 0.85, reasons: ["título parecido"] }
  }

  if (notes && (notes.includes(msg) || msg.includes(notes))) {
    return { score: 0.7, reasons: ["bate com a nota"] }
  }

  const msgTokens = new Set(tokenize(message))
  const titleTokens = new Set(tokenize(reminder.title))
  if (msgTokens.size === 0 || titleTokens.size === 0) {
    return { score: 0, reasons: [] as string[] }
  }

  let overlap = 0
  for (const token of msgTokens) {
    if (titleTokens.has(token)) overlap += 1
  }

  const union = new Set([...msgTokens, ...titleTokens]).size
  const jaccard = union > 0 ? overlap / union : 0
  if (jaccard >= 0.34 && overlap >= 1) {
    return {
      score: Math.min(0.75, 0.4 + jaccard),
      reasons: ["palavras em comum"],
    }
  }

  return { score: 0, reasons: [] as string[] }
}

export const matchPaymentReminders = (
  input: ReminderMatchInput,
  reminders: PaymentReminder[],
  limit = 5
): ReminderMatch[] => {
  if (input.value <= 0) return []

  const tolerance = valueTolerance(input.value)
  const matches: ReminderMatch[] = []

  for (const reminder of reminders) {
    if (reminder.status !== "OPEN") continue

    const valueDiff = Math.abs(reminder.value - input.value)
    if (valueDiff > tolerance) continue

    const reasons: string[] = []
    let score = 0

    if (valueDiff <= 0.009) {
      score += 0.55
      reasons.push("mesmo valor")
    } else {
      score += 0.35
      reasons.push("valor próximo")
    }

    const title = titleScore(input.message, reminder)
    score += title.score * 0.45
    reasons.push(...title.reasons)

    // Value-only matches still useful when title is empty/generic
    if (title.score === 0 && valueDiff <= 0.009) {
      score += 0.1
    }

    if (score < 0.4) continue

    matches.push({ reminder, score, reasons })
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
