import type {
  MonthDetails,
  MonthInstallment,
} from "@/lib/types"

export type PayableKind = "installment" | "recurring" | "planned"

export type PayableItem = {
  id: string
  title: string
  subtitle: string
  value: number
  dueDate: Date
  status: "PAY" | "SCHEDULE"
  kind: PayableKind
  installmentId?: string
  recurringId?: string
  plannedId?: string
  isOverdue: boolean
  interestRate?: number
  interestRateType?: "MONTHLY" | "DAILY"
}

export type CalendarDueTone = "paid" | "overdue" | "today" | "week" | "later"

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export const buildPayableItems = ({
  month,
  year,
  installments,
  details,
  today = new Date(),
}: {
  month: number
  year: number
  installments: MonthInstallment[]
  details: MonthDetails
  today?: Date
}): PayableItem[] => {
  const todayStart = startOfDay(today)
  const daysInMonth = new Date(year, month, 0).getDate()

  const installmentItems: PayableItem[] = installments.map((item) => {
    const dueDate = startOfDay(new Date(item.dateTransaction))
    return {
      id: `installment-${item.id}`,
      title: item.debt.title,
      subtitle: `Parcela ${item.order}/${item.totalInstallments}`,
      value: item.value,
      dueDate,
      status: item.status,
      kind: "installment",
      installmentId: item.id,
      isOverdue: item.status === "SCHEDULE" && dueDate < todayStart,
      interestRate: item.debt.interestRate,
      interestRateType: item.debt.interestRateType,
    }
  })

  const recurringItems: PayableItem[] = (
    details.recurringPaymentsBreakdown ?? []
  ).map((item) => {
    const dueDate = startOfDay(
      new Date(year, month - 1, Math.min(item.dayOfMonth, daysInMonth))
    )
    const status = item.paidThisMonth ? "PAY" : "SCHEDULE"
    return {
      id: `recurring-${item.id}`,
      title: item.title,
      subtitle: `Conta fixa · dia ${item.dayOfMonth}`,
      value: item.value,
      dueDate,
      status,
      kind: "recurring",
      recurringId: item.id,
      isOverdue: status === "SCHEDULE" && dueDate < todayStart,
    }
  })

  const plannedItems: PayableItem[] = (
    details.plannedExpensesBreakdown ?? []
  ).map((item) => {
    const dueDate = startOfDay(new Date(item.dueDate))
    const status = item.status === "PAID" ? "PAY" : "SCHEDULE"
    const categoryLabel = item.category?.title
      ? ` · ${item.category.title}`
      : ""
    return {
      id: `planned-${item.id}`,
      title: item.title,
      subtitle: `Gasto previsto${categoryLabel}`,
      value: item.value,
      dueDate,
      status,
      kind: "planned",
      plannedId: item.id,
      isOverdue: status === "SCHEDULE" && dueDate < todayStart,
    }
  })

  return [...installmentItems, ...recurringItems, ...plannedItems].sort(
    (a, b) => {
      if (a.status !== b.status) {
        return a.status === "SCHEDULE" ? -1 : 1
      }
      return a.dueDate.getTime() - b.dueDate.getTime()
    }
  )
}

export const getPayableTone = (
  item: PayableItem,
  today = new Date()
): CalendarDueTone => {
  if (item.status === "PAY") return "paid"
  const todayStart = startOfDay(today).getTime()
  const dueTime = item.dueDate.getTime()
  if (dueTime < todayStart) return "overdue"
  if (dueTime === todayStart) return "today"
  const weekEnd = startOfDay(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  if (dueTime <= weekEnd.getTime()) return "week"
  return "later"
}

export const payableKindLabel = (kind: PayableKind) => {
  if (kind === "installment") return "Parcela"
  if (kind === "recurring") return "Conta fixa"
  return "Previsto"
}

export const payableItemHref = (
  item: PayableItem,
  month: number,
  year: number
) => {
  if (item.kind === "installment") {
    return `/parcelas?month=${month}&year=${year}`
  }
  if (item.kind === "recurring") return "/recorrentes"
  return "/gastos-previstos"
}

export const dayKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const worstTone = (
  tones: CalendarDueTone[]
): Exclude<CalendarDueTone, "paid"> | null => {
  const pending = tones.filter((tone) => tone !== "paid")
  if (pending.includes("overdue")) return "overdue"
  if (pending.includes("today")) return "today"
  if (pending.includes("week")) return "week"
  if (pending.includes("later")) return "later"
  return null
}
