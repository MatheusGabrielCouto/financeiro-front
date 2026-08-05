import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { MonthYearFilter } from "@/components/month-year-filter"
import { OverdueInterestHint } from "@/components/overdue-interest-hint"
import { PayInstallmentButton } from "@/components/pay-installment-button"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { StatusBadge } from "@/components/status-badge"
import { ApiError } from "@/lib/api-server"
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import { getDetails, getInstallments } from "@/lib/finance-api"
import { buildPayableItems, type PayableItem } from "@/lib/payable-items"

type ParcelasPageProps = {
  searchParams: Promise<{
    month?: string
    year?: string
    status?: string
    tipo?: string
  }>
}

const buildHref = (
  month: number,
  year: number,
  status: string,
  tipo: string
) => {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  })
  if (status !== "todas") params.set("status", status)
  if (tipo !== "todos") params.set("tipo", tipo)
  return `/parcelas?${params.toString()}`
}

const ParcelasPage = async ({ searchParams }: ParcelasPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const status = params.status ?? "todas"
  const tipo = params.tipo ?? "todos"

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12
  ) {
    redirect(`/parcelas?month=${current.month}&year=${current.year}`)
  }

  try {
    const [installments, details] = await Promise.all([
      getInstallments(month, year),
      getDetails(month, year),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const allItems = buildPayableItems({
      month,
      year,
      installments,
      details,
      today,
    })

    const filtered = allItems.filter((item) => {
      if (status === "pendentes" && item.status !== "SCHEDULE") return false
      if (status === "pagas" && item.status !== "PAY") return false
      if (tipo === "parcelas" && item.kind !== "installment") return false
      if (tipo === "fixas" && item.kind !== "recurring") return false
      if (tipo === "previstos" && item.kind !== "planned") return false
      return true
    })

    const pendingItems = allItems.filter((item) => item.status === "SCHEDULE")
    const paidItems = allItems.filter((item) => item.status === "PAY")
    const overdueItems = pendingItems.filter((item) => item.isOverdue)

    const scheduledTotal = pendingItems.reduce((sum, item) => sum + item.value, 0)
    const paidTotal = paidItems.reduce((sum, item) => sum + item.value, 0)
    const monthTotal = scheduledTotal + paidTotal
    const progress =
      monthTotal > 0 ? Math.round((paidTotal / monthTotal) * 100) : 100
    const monthLabel = formatMonthLabel(month, year)
    const isCurrentMonth =
      month === current.month && year === current.year

    const statusFilters = [
      { id: "todas", label: "Todas" },
      { id: "pendentes", label: "A pagar" },
      { id: "pagas", label: "Pagas" },
    ]
    const typeFilters = [
      { id: "todos", label: "Todos" },
      { id: "parcelas", label: "Parcelas" },
      { id: "fixas", label: "Contas fixas" },
      { id: "previstos", label: "Previstos" },
    ]

    const kindLabel = (kind: PayableItem["kind"]) => {
      if (kind === "recurring") return "Conta fixa"
      if (kind === "planned") return "Gasto previsto"
      return "Parcela"
    }

    const kindBadgeClass = (kind: PayableItem["kind"]) => {
      if (kind === "recurring") return "bg-slate-100 text-slate-600"
      if (kind === "planned") return "bg-amber-50 text-warning"
      return "bg-teal-50 text-accent"
    }

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {isCurrentMonth ? "Este mês" : "Período"}
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                A pagar em {monthLabel}
              </h1>
              <p className="mt-1 text-sm text-muted">
                Parcelas, contas fixas e gastos previstos do período.
              </p>
            </div>

            <Suspense
              fallback={<div className="text-sm text-muted">Carregando...</div>}
            >
              <MonthYearFilter month={month} year={year} basePath="/parcelas" />
            </Suspense>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Ainda falta</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(scheduledTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {pendingItems.length} pendência(s)
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
              <p className="text-sm text-muted">Já pago</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(paidTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {paidItems.length} quitada(s)
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Total do período</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(monthTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {allItems.length} item(ns)
              </p>
            </article>
            <article
              className={`rounded-2xl border p-4 ${
                overdueItems.length > 0
                  ? "border-red-200/70 bg-red-50/40"
                  : "border-teal-200/70 bg-teal-50/40"
              }`}
            >
              <p className="text-sm text-muted">Atrasadas</p>
              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
                  overdueItems.length > 0 ? "text-danger" : "text-accent"
                }`}
              >
                {overdueItems.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {progress}% do mês quitado
              </p>
            </article>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Progresso do mês</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Agenda de pagamentos</h2>
              <p className="text-sm text-muted">
                {filtered.length} de {allItems.length} item(ns)
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1"
                role="group"
                aria-label="Filtrar por situação"
              >
                {statusFilters.map((filter) => {
                  const isActive = status === filter.id
                  return (
                    <Link
                      key={filter.id}
                      href={buildHref(month, year, filter.id, tipo)}
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

              <div
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1"
                role="group"
                aria-label="Filtrar por tipo"
              >
                {typeFilters.map((filter) => {
                  const isActive = tipo === filter.id
                  return (
                    <Link
                      key={filter.id}
                      href={buildHref(month, year, status, filter.id)}
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
          </div>

          <div className="p-3 md:p-4">
            {allItems.length === 0 ? (
              <div className="rounded-xl bg-background px-4 py-14 text-center">
                <p className="font-semibold">Nada para pagar neste período</p>
                <p className="mt-1 text-sm text-muted">
                  Não há parcelas, contas fixas nem gastos previstos em{" "}
                  {monthLabel}.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/dividas/nova"
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Nova dívida
                  </Link>
                  <Link
                    href="/recorrentes"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
                  >
                    Contas fixas
                  </Link>
                  <Link
                    href="/gastos-previstos"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
                  >
                    Gastos previstos
                  </Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-background px-4 py-12 text-center">
                <p className="font-semibold">Nenhum item neste filtro</p>
                <p className="mt-1 text-sm text-muted">
                  Ajuste a situação ou o tipo para ver os pagamentos.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-2xl border bg-background/50 p-4 md:p-5 ${
                      item.isOverdue
                        ? "border-red-200/80"
                        : "border-border/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold">
                            {item.title}
                          </p>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${kindBadgeClass(item.kind)}`}
                          >
                            {kindLabel(item.kind)}
                          </span>
                          {item.isOverdue ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-danger">
                                Atrasada
                              </span>
                              {item.kind === "installment" ? (
                                <OverdueInterestHint
                                  value={item.value}
                                  dueDate={item.dueDate}
                                  interestRate={item.interestRate}
                                  interestRateType={item.interestRateType}
                                  status={item.status}
                                />
                              ) : null}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted">{item.subtitle}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          Vence em {formatDate(item.dueDate)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(item.value)}
                          </p>
                          <div className="mt-1 flex justify-end">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>

                        {item.status === "SCHEDULE" && item.kind === "installment" && item.installmentId ? (
                          <PayInstallmentButton
                            installmentId={item.installmentId}
                            debtTitle={item.title}
                          />
                        ) : null}

                        {item.status === "SCHEDULE" &&
                        item.kind === "recurring" &&
                        item.recurringId ? (
                          <ProxyActionButton
                            path={`/recurring-payment/${item.recurringId}/pay`}
                            method="POST"
                            label="Pagar"
                            loadingLabel="Pagando..."
                            variant="primary"
                            ariaLabel={`Pagar conta fixa ${item.title}`}
                          />
                        ) : null}

                        {item.status === "SCHEDULE" &&
                        item.kind === "planned" &&
                        item.plannedId ? (
                          <ProxyActionButton
                            path={`/planned-expense/${item.plannedId}/pay`}
                            method="POST"
                            label="Pagar"
                            loadingLabel="Pagando..."
                            variant="primary"
                            ariaLabel={`Pagar gasto previsto ${item.title}`}
                          />
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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

export default ParcelasPage
