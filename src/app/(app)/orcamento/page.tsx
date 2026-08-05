import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { UpsertBudgetForm } from "@/components/upsert-budget-form"
import { ApiError } from "@/lib/api-server"
import {
  budgetStatusMeta,
  getBudgetBarWidth,
  getBudgetOverage,
  getBudgetStatus,
} from "@/lib/budget-status"
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import { getBudgets, getCategories } from "@/lib/finance-api"

const buildHref = (month: number, year: number, status: string) => {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  })
  if (status !== "todos") params.set("status", status)
  return `/orcamento?${params.toString()}`
}

type OrcamentoPageProps = {
  searchParams: Promise<{ month?: string; year?: string; status?: string }>
}

const OrcamentoPage = async ({ searchParams }: OrcamentoPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const statusFilter = params.status ?? "todos"

  if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) {
    redirect(`/orcamento?month=${current.month}&year=${current.year}`)
  }

  try {
    const [budgets, categories] = await Promise.all([
      getBudgets(month, year),
      getCategories(),
    ])

    const enriched = [...budgets]
      .map((budget) => ({
        ...budget,
        status: getBudgetStatus(budget),
      }))
      .sort((a, b) => b.percentageUsed - a.percentageUsed)

    const filtered = enriched.filter((budget) => {
      if (statusFilter === "ok") return budget.status === "ok"
      if (statusFilter === "warning") return budget.status === "warning"
      if (statusFilter === "over") return budget.status === "over"
      return true
    })

    const totalLimit = budgets.reduce((sum, item) => sum + item.amount, 0)
    const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0)
    const totalRemaining = Math.max(totalLimit - totalSpent, 0)
    const overallProgress =
      totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
    const overCount = enriched.filter((item) => item.status === "over").length
    const warningCount = enriched.filter((item) => item.status === "warning").length
    const monthLabel = formatMonthLabel(month, year)
    const isCurrentMonth =
      month === current.month && year === current.year
    const overallOver = totalLimit > 0 && totalSpent > totalLimit

    const filters = [
      { id: "todos", label: "Todos" },
      { id: "ok", label: "No limite" },
      { id: "warning", label: "Perto" },
      { id: "over", label: "Estourados" },
    ]

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {isCurrentMonth ? "Este mês" : "Período"}
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Orçamento de {monthLabel}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Defina um limite de gasto por categoria e acompanhe o quanto já
                foi usado no mês.
              </p>
            </div>

            <Suspense
              fallback={<div className="text-sm text-muted">Carregando...</div>}
            >
              <MonthYearFilter month={month} year={year} basePath="/orcamento" />
            </Suspense>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Planejado</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(totalLimit)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {budgets.length} categoria(s)
              </p>
            </article>
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Já gasto</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(totalSpent)}
              </p>
              <p className="mt-1 text-xs text-muted">{overallProgress}% do limite</p>
            </article>
            <article
              className={`rounded-2xl border p-4 ${
                overallOver
                  ? "border-red-200/70 bg-red-50/40"
                  : "border-emerald-200/70 bg-emerald-50/40"
              }`}
            >
              <p className="text-sm text-muted">
                {overallOver ? "Acima do plano" : "Ainda sobra"}
              </p>
              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
                  overallOver ? "text-danger" : "text-success"
                }`}
              >
                {formatCurrency(
                  overallOver ? totalSpent - totalLimit : totalRemaining
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                {overallOver ? "valor estourado" : "dentro dos limites"}
              </p>
            </article>
            <article
              className={`rounded-2xl border p-4 ${
                overCount > 0
                  ? "border-red-200/70 bg-red-50/40"
                  : "border-teal-200/70 bg-teal-50/40"
              }`}
            >
              <p className="text-sm text-muted">Atenção</p>
              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
                  overCount > 0 ? "text-danger" : "text-accent"
                }`}
              >
                {overCount}
              </p>
              <p className="mt-1 text-xs text-muted">
                {overCount > 0
                  ? "categoria(s) estourada(s)"
                  : warningCount > 0
                    ? `${warningCount} perto do limite`
                    : "nenhuma categoria estourada"}
              </p>
            </article>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Uso geral do orçamento</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  overallOver ? "bg-danger" : "bg-accent"
                }`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Limites por categoria</h2>
                <p className="text-sm text-muted">
                  {filtered.length} de {budgets.length} categoria(s)
                </p>
              </div>

              <div
                className="inline-flex flex-wrap rounded-xl border border-border bg-slate-50 p-1"
                role="group"
                aria-label="Filtrar orçamentos"
              >
                {filters.map((filter) => {
                  const isActive = statusFilter === filter.id
                  return (
                    <Link
                      key={filter.id}
                      href={buildHref(month, year, filter.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {filter.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {budgets.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-14 text-center">
                  <p className="font-semibold">Nenhum orçamento neste mês</p>
                  <p className="mt-1 text-sm text-muted">
                    Defina um limite por categoria ao lado para começar a
                    acompanhar seus gastos.
                  </p>
                  <Link
                    href="/categorias"
                    className="mt-5 inline-flex text-sm font-medium text-accent hover:underline"
                  >
                    Gerenciar categorias
                  </Link>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-12 text-center">
                  <p className="font-semibold">Nenhuma categoria neste filtro</p>
                  <p className="mt-1 text-sm text-muted">
                    Tente outro filtro para ver seus limites.
                  </p>
                </div>
              ) : (
                filtered.map((budget) => {
                  const meta = budgetStatusMeta[budget.status]
                  const overage = getBudgetOverage(budget)
                  return (
                    <article
                      key={budget.id}
                      className={`rounded-2xl border bg-background/50 p-4 md:p-5 ${meta.border}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">
                              {budget.categoryTitle}
                            </h3>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            {formatCurrency(budget.spent)} gastos de{" "}
                            {formatCurrency(budget.amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={`text-lg font-semibold tabular-nums ${meta.value}`}
                            >
                              {budget.percentageUsed.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted">
                              {overage > 0
                                ? `Passou ${formatCurrency(overage)}`
                                : `Sobra ${formatCurrency(budget.remaining)}`}
                            </p>
                          </div>
                          <ProxyActionButton
                            path={`/budget/${budget.id}`}
                            method="DELETE"
                            label="Remover"
                            variant="danger"
                            confirmTitle="Remover orçamento"
                            confirmMessage={`Você está prestes a remover o orçamento de ${budget.categoryTitle}. Esta ação não pode ser desfeita.`}
                            ariaLabel={`Remover orçamento de ${budget.categoryTitle}`}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${meta.bar}`}
                            style={{
                              width: `${getBudgetBarWidth(budget)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <UpsertBudgetForm categories={categories} month={month} year={year} />

            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5">
              <p className="text-sm font-semibold text-accent">Como usar</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                <li>Escolha uma categoria e defina o teto do mês.</li>
                <li>Os gastos do extrato entram no “já gasto”.</li>
                <li>A partir de 80%, o card sinaliza atenção.</li>
              </ul>
              <Link
                href="/extrato"
                className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Ver extrato do mês
              </Link>
            </div>
          </aside>
        </section>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default OrcamentoPage
