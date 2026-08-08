import Link from "next/link"
import {
  budgetStatusMeta,
  getBudgetBarWidth,
  getBudgetOverage,
  getBudgetStatus,
} from "@/lib/budget-status"
import { formatCurrency } from "@/lib/format"
import type { BudgetItem } from "@/lib/types"

type BudgetSpotlightProps = {
  budgets: BudgetItem[]
  limit?: number
}

export const BudgetSpotlight = ({
  budgets,
  limit = 5,
}: BudgetSpotlightProps) => {
  const sorted = [...budgets]
    .map((budget) => ({
      ...budget,
      status: getBudgetStatus(budget),
    }))
    .sort((a, b) => b.percentageUsed - a.percentageUsed)

  const preview = sorted.slice(0, limit)
  const totalLimit = budgets.reduce((sum, item) => sum + item.amount, 0)
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0)
  const overallProgress =
    totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0
  const overallOver = totalLimit > 0 && totalSpent > totalLimit
  const alertCount = sorted.filter(
    (item) => item.status === "over" || item.status === "warning"
  ).length

  return (
    <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Orçamento</h2>
          <p className="mt-1 text-sm text-muted">
            Gasto do mês vs limite por categoria
          </p>
        </div>
        <Link
          href="/orcamento"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Ver orçamento completo"
        >
          Ver todas
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center dark:bg-slate-900/50">
          <p className="text-sm font-medium">Nenhum limite definido</p>
          <Link
            href="/orcamento"
            className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
          >
            Definir orçamento
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {formatCurrency(totalSpent)} de {formatCurrency(totalLimit)}
              </span>
              <span
                className={`font-semibold ${
                  overallOver ? "text-danger" : "text-accent"
                }`}
              >
                {overallProgress}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  overallOver ? "bg-danger" : "bg-accent"
                }`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            {alertCount > 0 ? (
              <p className="mt-2 text-xs text-warning">
                {alertCount} categoria(s) em 80%+ do limite
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Todas as categorias dentro do limite
              </p>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {preview.map((budget) => {
              const meta = budgetStatusMeta[budget.status]
              const overage = getBudgetOverage(budget)
              return (
                <li
                  key={budget.id}
                  className={`rounded-xl border bg-background/60 px-3 py-2.5 ${meta.border}`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">
                      {budget.categoryTitle}
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${meta.value}`}>
                      {budget.percentageUsed.toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    {overage > 0
                      ? ` · passou ${formatCurrency(overage)}`
                      : ` · sobra ${formatCurrency(budget.remaining)}`}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${meta.bar}`}
                      style={{ width: `${getBudgetBarWidth(budget)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </article>
  )
}
