import type { BudgetItem } from "@/lib/types"

export type BudgetStatus = "ok" | "warning" | "over"

export const getBudgetStatus = (budget: BudgetItem): BudgetStatus => {
  if (budget.spent >= budget.amount || budget.percentageUsed >= 100) return "over"
  if (budget.percentageUsed >= 80) return "warning"
  return "ok"
}

export const budgetStatusMeta: Record<
  BudgetStatus,
  { label: string; badge: string; bar: string; border: string; value: string }
> = {
  ok: {
    label: "Dentro do limite",
    badge: "bg-emerald-50 text-success dark:bg-emerald-950/40",
    bar: "bg-accent",
    border: "border-border/80",
    value: "text-accent",
  },
  warning: {
    label: "Perto do limite",
    badge: "bg-amber-50 text-warning dark:bg-amber-950/40",
    bar: "bg-amber-400",
    border: "border-amber-200/80 dark:border-amber-900/40",
    value: "text-warning",
  },
  over: {
    label: "Estourado",
    badge: "bg-red-50 text-danger dark:bg-red-950/40",
    bar: "bg-danger",
    border: "border-red-200/80 dark:border-red-900/40",
    value: "text-danger",
  },
}

export const getBudgetBarWidth = (budget: BudgetItem) =>
  Math.min(100, Math.max(0, budget.percentageUsed))

export const getBudgetOverage = (budget: BudgetItem) =>
  Math.max(0, budget.spent - budget.amount)
