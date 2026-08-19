import type {
  DueAlert,
  MonthInstallment,
  PlannedExpense,
  RecurringPayment,
} from "@/lib/types"

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const wasPaidInMonth = (
  lastProcessedAt: string | null,
  month: number,
  year: number
) => {
  if (!lastProcessedAt) return false
  const date = new Date(lastProcessedAt)
  return date.getMonth() === month - 1 && date.getFullYear() === year
}

const urgencyForDate = (
  due: Date,
  today: Date
): DueAlert["urgency"] | null => {
  const dueTime = due.getTime()
  const todayTime = today.getTime()
  const tomorrow = addDays(today, 1).getTime()
  const weekEnd = addDays(today, 7).getTime()

  if (dueTime < todayTime) return "overdue"
  if (dueTime === todayTime) return "today"
  if (dueTime === tomorrow) return "tomorrow"
  if (dueTime <= weekEnd) return "week"
  return null
}

export const buildDueAlerts = ({
  installments,
  recurringPayments,
  plannedExpenses = [],
  now = new Date(),
}: {
  installments: MonthInstallment[]
  recurringPayments: RecurringPayment[]
  plannedExpenses?: PlannedExpense[]
  now?: Date
}): DueAlert[] => {
  const today = startOfDay(now)
  const alerts: DueAlert[] = []

  for (const item of installments) {
    if (item.status !== "SCHEDULE") continue
    const dueDate = startOfDay(new Date(item.dateTransaction))
    const urgency = urgencyForDate(dueDate, today)
    if (!urgency) continue

    alerts.push({
      id: `installment-${item.id}`,
      title: item.debt.title,
      value: item.value,
      dueDate: dueDate.toISOString(),
      kind: "installment",
      urgency,
      href: "/financeiro/parcelas",
    })
  }

  const monthsToCheck = [0, 1].map((offset) => {
    const date = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      daysInMonth: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
    }
  })

  for (const payment of recurringPayments) {
    for (const period of monthsToCheck) {
      if (wasPaidInMonth(payment.lastProcessedAt, period.month, period.year)) {
        continue
      }

      const day = Math.min(payment.dayOfMonth, period.daysInMonth)
      const dueDate = startOfDay(new Date(period.year, period.month - 1, day))
      const urgency = urgencyForDate(dueDate, today)
      if (!urgency) continue

      alerts.push({
        id: `recurring-${payment.id}-${period.year}-${period.month}`,
        title: payment.title,
        value: payment.value,
        dueDate: dueDate.toISOString(),
        kind: "recurring",
        urgency,
        href: "/financeiro/recorrentes",
      })
    }
  }

  for (const expense of plannedExpenses) {
    if (expense.status !== "SCHEDULED") continue
    const dueDate = startOfDay(new Date(expense.dueDate))
    const urgency = urgencyForDate(dueDate, today)
    if (!urgency) continue

    alerts.push({
      id: `planned-expense-${expense.id}`,
      title: expense.title,
      value: expense.value,
      dueDate: dueDate.toISOString(),
      kind: "planned_expense",
      urgency,
      href: "/financeiro/gastos-previstos",
    })
  }

  const urgencyOrder: Record<DueAlert["urgency"], number> = {
    overdue: 0,
    today: 1,
    tomorrow: 2,
    week: 3,
  }

  return alerts.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

export const urgencyLabel = (urgency: DueAlert["urgency"]) => {
  if (urgency === "overdue") return "Atrasado"
  if (urgency === "today") return "Hoje"
  if (urgency === "tomorrow") return "Amanhã"
  return "Em 7 dias"
}

export const kindLabel = (kind: DueAlert["kind"]) => {
  if (kind === "recurring") return "Conta fixa"
  if (kind === "planned_expense") return "Gasto previsto"
  return "Parcela"
}

export const countPriorityAlerts = (alerts: DueAlert[]) =>
  alerts.filter(
    (item) =>
      item.urgency === "overdue" ||
      item.urgency === "today" ||
      item.urgency === "tomorrow"
  ).length
