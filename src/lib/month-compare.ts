import type { ExpenseByCategoryItem, MonthDetails } from "@/lib/types"
import { buildMonthFlowBreakdown } from "@/lib/month-flow"

export type CompareMetric = {
  id: string
  label: string
  hint?: string
  current: number
  previous: number
  /** When true, a decrease is visually positive (e.g. expenses) */
  lowerIsBetter?: boolean
}

export type CategoryCompare = {
  id: string
  title: string
  current: number
  previous: number
}

export const getDeltaPercent = (current: number, previous: number): number | null => {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

export const isDeltaPositive = (
  delta: number | null,
  lowerIsBetter?: boolean
) => {
  if (delta == null || delta === 0) return null
  const improved = lowerIsBetter ? delta < 0 : delta > 0
  return improved
}

export const buildMonthCompareMetrics = (
  current: MonthDetails,
  previous: MonthDetails
): CompareMetric[] => {
  const currentFlow = buildMonthFlowBreakdown(current)
  const previousFlow = buildMonthFlowBreakdown(previous)

  return [
    {
      id: "income",
      label: "Receitas",
      hint: "Entradas do mês",
      current: currentFlow.income,
      previous: previousFlow.income,
    },
    {
      id: "paid",
      label: "Já pago",
      hint: "Saiu no extrato",
      current: currentFlow.paidExpenses,
      previous: previousFlow.paidExpenses,
      lowerIsBetter: true,
    },
    {
      id: "open",
      label: "Em aberto",
      hint: "Contas, parcelas e previstos",
      current: currentFlow.openCommitments,
      previous: previousFlow.openCommitments,
      lowerIsBetter: true,
    },
    {
      id: "surplus",
      label: "Sobra prevista",
      hint: "Depois do pago e do aberto",
      current: currentFlow.surplus,
      previous: previousFlow.surplus,
    },
  ]
}

export const buildTopCategoryCompare = (
  current: ExpenseByCategoryItem[] | undefined,
  previous: ExpenseByCategoryItem[] | undefined,
  limit = 3
): CategoryCompare[] => {
  const prevMap = new Map(
    (previous ?? []).map((item) => [item.id, item.total])
  )

  return [...(current ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.title,
      current: item.total,
      previous: prevMap.get(item.id) ?? 0,
    }))
}
