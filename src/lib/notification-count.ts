import {
  getAmount,
  getDetails,
  getFuturePurchaseProjections,
  getInstallments,
  getPaymentReminders,
  getPlannedExpenses,
  getRecurringPayments,
} from "@/lib/finance-api"
import { buildDueAlerts, countPriorityAlerts } from "@/lib/due-alerts"
import { getCurrentMonthYear } from "@/lib/format"
import { ApiError } from "@/lib/api-server"
import type { InsightAlert } from "@/lib/types"

export const buildInsightAlerts = ({
  amount,
  netExpected,
  caixinhaAlerts,
}: {
  amount: number
  netExpected: number
  caixinhaAlerts: number
}): InsightAlert[] => {
  const insights: InsightAlert[] = []

  if (amount < 100) {
    insights.push({
      id: "low-balance",
      title: "Saldo baixo",
      description: `Seu saldo livre está em menos de R$ 100.`,
      tone: "danger",
      href: "/",
    })
  }

  if (netExpected < 0) {
    insights.push({
      id: "tight-flow",
      title: "Fluxo apertado no mês",
      description: "A sobra prevista ficou negativa com os compromissos atuais.",
      tone: "warning",
      href: "/relatorios",
    })
  }

  if (caixinhaAlerts > 0) {
    insights.push({
      id: "caixinha-goals",
      title: "Metas de caixinha em atenção",
      description: `${caixinhaAlerts} meta(s) próximas do prazo ou sem progresso suficiente.`,
      tone: "accent",
      href: "/caixinhas",
    })
  }

  return insights
}

export const getPriorityNotificationCount = async () => {
  try {
    const current = getCurrentMonthYear()
    const nextMonth = current.month === 12 ? 1 : current.month + 1
    const nextYear = current.month === 12 ? current.year + 1 : current.year
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in14 = new Date(today)
    in14.setDate(in14.getDate() + 14)
    const in30 = new Date(today)
    in30.setDate(in30.getDate() + 30)

    const [
      installmentsCurrent,
      installmentsNext,
      recurringPayments,
      plannedCurrent,
      plannedNext,
      amount,
      details,
      projections,
      openReminders,
    ] = await Promise.all([
      getInstallments(current.month, current.year),
      getInstallments(nextMonth, nextYear),
      getRecurringPayments(),
      getPlannedExpenses({ month: current.month, year: current.year }),
      getPlannedExpenses({ month: nextMonth, year: nextYear }),
      getAmount(),
      getDetails(current.month, current.year),
      getFuturePurchaseProjections(),
      getPaymentReminders({ status: "OPEN" }).catch(() => []),
    ])

    const alerts = buildDueAlerts({
      installments: [...installmentsCurrent, ...installmentsNext],
      recurringPayments,
      plannedExpenses: [...plannedCurrent, ...plannedNext],
    })

    const caixinhaAlerts = projections.filter((item) => {
      if (item.isGoalReached) return false
      const due = new Date(item.dateAcquisition)
      due.setHours(0, 0, 0, 0)
      if (due.getTime() < today.getTime()) return false
      const progress =
        item.value > 0 ? item.valueAdded / item.value : 0
      const near = due.getTime() <= in14.getTime()
      const stagnant = progress < 0.5 && due.getTime() <= in30.getTime()
      return near || stagnant
    }).length

    const insights = buildInsightAlerts({
      amount: amount.amount,
      netExpected: details.summary.netExpected,
      caixinhaAlerts,
    })

    return (
      countPriorityAlerts(alerts) +
      insights.length +
      openReminders.length
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return 0
    }
    return 0
  }
}
