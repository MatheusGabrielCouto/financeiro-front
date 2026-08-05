import type { ExpenseByCategoryItem, MonthDetails } from "@/lib/types"

export type CompareMetric = {
  id: string
  label: string
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

const pickIncome = (summary: MonthDetails["summary"]) =>
  summary.totalIncome ??
  summary.recurringIncome + (summary.outrasEntradas ?? 0)

const pickSurplus = (summary: MonthDetails["summary"]) =>
  summary.balanceAfterExpenses ?? summary.netExpected

export const buildMonthCompareMetrics = (
  current: MonthDetails,
  previous: MonthDetails
): CompareMetric[] => [
  {
    id: "income",
    label: "Receitas",
    current: pickIncome(current.summary),
    previous: pickIncome(previous.summary),
  },
  {
    id: "expenses",
    label: "Saídas",
    current: current.summary.totalExpenses,
    previous: previous.summary.totalExpenses,
    lowerIsBetter: true,
  },
  {
    id: "surplus",
    label: "Sobra",
    current: pickSurplus(current.summary),
    previous: pickSurplus(previous.summary),
  },
]

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
