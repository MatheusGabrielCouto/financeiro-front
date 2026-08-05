import {
  getCreditCardInvoice,
  getCreditCards,
} from "@/lib/finance-api"
import type { CreditCard, DueAlert } from "@/lib/types"

export type CreditCardInvoiceAlert = {
  id: string
  cardId: string
  cardName: string
  brand: string | null
  lastDigits: string | null
  pendingTotal: number
  itemCount: number
  dueDay: number
  dueDate: string
  urgency: DueAlert["urgency"]
  href: string
}

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const dueDateForMonth = (dueDay: number, month: number, year: number) => {
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(dueDay, lastDay)
  return startOfDay(new Date(year, month - 1, day))
}

export const getInvoiceUrgency = (
  dueDate: Date,
  today = new Date()
): DueAlert["urgency"] => {
  const todayStart = startOfDay(today).getTime()
  const dueTime = startOfDay(dueDate).getTime()
  if (dueTime < todayStart) return "overdue"
  if (dueTime === todayStart) return "today"
  const tomorrow = startOfDay(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dueTime === tomorrow.getTime()) return "tomorrow"
  const weekEnd = startOfDay(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  if (dueTime <= weekEnd.getTime()) return "week"
  return "week"
}

export const buildCreditCardInvoiceAlerts = async ({
  month,
  year,
  today = new Date(),
  onlyWithPending = true,
}: {
  month: number
  year: number
  today?: Date
  onlyWithPending?: boolean
}): Promise<CreditCardInvoiceAlert[]> => {
  let cards: CreditCard[] = []
  try {
    cards = await getCreditCards()
  } catch {
    return []
  }

  const alerts = await Promise.all(
    cards.map(async (card) => {
      try {
        const invoice = await getCreditCardInvoice(card.id, month, year)
        const pendingItems = invoice.installments.filter(
          (item) => item.status === "SCHEDULE"
        )
        const pendingTotal = pendingItems.reduce(
          (sum, item) => sum + item.value,
          0
        )

        if (onlyWithPending && pendingTotal <= 0) return null

        const dueDate = dueDateForMonth(card.dueDay, month, year)

        return {
          id: `credit-card-invoice-${card.id}-${year}-${month}`,
          cardId: card.id,
          cardName: card.name,
          brand: card.brand,
          lastDigits: card.lastDigits,
          pendingTotal,
          itemCount: pendingItems.length,
          dueDay: card.dueDay,
          dueDate: dueDate.toISOString(),
          urgency: getInvoiceUrgency(dueDate, today),
          href: `/cartoes/${card.id}?month=${month}&year=${year}`,
        } satisfies CreditCardInvoiceAlert
      } catch {
        return null
      }
    })
  )

  return alerts
    .filter((item): item is CreditCardInvoiceAlert => item != null)
    .sort((a, b) => {
      const order = { overdue: 0, today: 1, tomorrow: 2, week: 3 } as const
      if (order[a.urgency] !== order[b.urgency]) {
        return order[a.urgency] - order[b.urgency]
      }
      return b.pendingTotal - a.pendingTotal
    })
}

export const countPriorityCreditCardAlerts = (
  alerts: CreditCardInvoiceAlert[]
) =>
  alerts.filter(
    (item) =>
      item.urgency === "overdue" ||
      item.urgency === "today" ||
      item.urgency === "tomorrow"
  ).length
