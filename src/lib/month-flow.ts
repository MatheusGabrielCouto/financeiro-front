import type { MonthDetails } from "@/lib/types"

export type MonthFlowBreakdown = {
  income: number
  paidExpenses: number
  openCommitments: number
  openRecurring: number
  openDebts: number
  openPlanned: number
  afterPaidOnly: number
  surplus: number
  structuralSurplus: number
}

export const pickIncome = (summary: MonthDetails["summary"]) =>
  summary.totalIncome ??
  summary.recurringIncome + (summary.outrasEntradas ?? 0)

export const pickSurplus = (summary: MonthDetails["summary"]) =>
  summary.balanceAfterExpenses ?? summary.netExpected

export const buildMonthFlowBreakdown = (
  details: MonthDetails
): MonthFlowBreakdown => {
  const income = pickIncome(details.summary)
  const paidExpenses = details.summary.totalExpenses

  const openRecurring = (details.recurringPaymentsBreakdown ?? [])
    .filter((item) => !item.paidThisMonth)
    .reduce((sum, item) => sum + item.value, 0)

  const openDebts = (details.debtsBreakdown ?? [])
    .filter((item) => item.status !== "PAY")
    .reduce((sum, item) => sum + item.value, 0)

  const openPlanned = (details.plannedExpensesBreakdown ?? [])
    .filter((item) => item.status === "SCHEDULED")
    .reduce((sum, item) => sum + item.value, 0)

  const openCommitments = openRecurring + openDebts + openPlanned

  return {
    income,
    paidExpenses,
    openCommitments,
    openRecurring,
    openDebts,
    openPlanned,
    afterPaidOnly: income - paidExpenses,
    surplus: pickSurplus(details.summary),
    structuralSurplus:
      details.summary.netStructural ?? details.summary.netExpected,
  }
}
