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
import { buildCreditCardInvoiceAlerts } from "@/lib/credit-card-alerts"
import {
  buildPayableItems,
  getPayableTone,
  payableKindLabel,
  type CalendarDueTone,
  type PayableItem,
} from "@/lib/payable-items"

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
  return `/financeiro/parcelas?${params.toString()}`
}

const toneBar: Record<CalendarDueTone, string> = {
  paid: "bg-emerald-500",
  overdue: "bg-danger",
  today: "bg-amber-400",
  week: "bg-accent",
  later: "bg-slate-300",
}

const kindBadgeClass = (kind: PayableItem["kind"]) => {
  if (kind === "recurring") {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }
  if (kind === "planned") {
    return "bg-amber-50 text-warning dark:bg-amber-950/40"
  }
  return "bg-teal-50 text-accent dark:bg-teal-950/40"
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
    redirect(`/financeiro/parcelas?month=${current.month}&year=${current.year}`)
  }

  try {
    const [installments, details] = await Promise.all([
      getInstallments(month, year),
      getDetails(month, year),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cardInvoiceAlerts = await buildCreditCardInvoiceAlerts({
      month,
      year,
      today,
    })
    const cardInvoicesTotal = cardInvoiceAlerts.reduce(
      (sum, item) => sum + item.pendingTotal,
      0
    )

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

    const scheduledTotal = pendingItems.reduce(
      (sum, item) => sum + item.value,
      0
    )
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

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  {isCurrentMonth ? "Este mês" : "Período"}
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  {monthLabel}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Parcelas, contas fixas e previstos — pague direto daqui ou
                  acompanhe no calendário.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                <Suspense
                  fallback={
                    <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                      Carregando...
                    </div>
                  }
                >
                  <div className="[&_button]:border-white/15 [&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/15 [&_div]:border-white/15 [&_div]:bg-white/5 [&_select]:text-white [&_span]:bg-teal-400/20 [&_span]:text-teal-100">
                    <MonthYearFilter
                      month={month}
                      year={year}
                      basePath="/financeiro/parcelas"
                    />
                  </div>
                </Suspense>
                <Link
                  href={`/financeiro/calendario?month=${month}&year=${year}`}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Ver calendário
                </Link>
              </div>
            </div>

            <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Ainda falta</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-amber-200">
                  {formatCurrency(scheduledTotal)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {pendingItems.length} pendência(s)
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Já pago</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-emerald-300">
                  {formatCurrency(paidTotal)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {paidItems.length} quitada(s)
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Total do período</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
                  {formatCurrency(monthTotal)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {allItems.length} item(ns)
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Atrasadas</p>
                <p
                  className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums ${
                    overdueItems.length > 0 ? "text-red-300" : "text-teal-200"
                  }`}
                >
                  {overdueItems.length}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {overdueItems.length === 0
                    ? "Em dia"
                    : "Pedem atenção agora"}
                </p>
              </article>
            </div>

            <div className="relative mt-5">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                <span>Progresso do mês</span>
                <span className="font-semibold tabular-nums text-white">
                  {progress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-300 to-emerald-400 transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {cardInvoiceAlerts.length > 0 &&
        (status === "todas" || status === "pendentes") &&
        (tipo === "todos" || tipo === "parcelas") ? (
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4 md:px-6">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  Faturas de cartão
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {cardInvoiceAlerts.length} fatura(s) ·{" "}
                  {formatCurrency(cardInvoicesTotal)} em aberto
                </p>
              </div>
              <Link
                href="/financeiro/cartoes"
                className="rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                Ver cartões
              </Link>
            </div>
            <ul className="space-y-2.5 p-3 md:p-4">
              {cardInvoiceAlerts.map((item) => (
                <li
                  key={item.id}
                  className={`flex gap-3 rounded-2xl border bg-background/40 p-3.5 md:p-4 ${
                    item.urgency === "overdue"
                      ? "border-red-200/80 dark:border-red-900/50"
                      : "border-border/70"
                  }`}
                >
                  <span
                    className={`mt-1 h-12 w-1 shrink-0 rounded-full ${
                      item.urgency === "overdue"
                        ? "bg-danger"
                        : item.urgency === "today"
                          ? "bg-amber-400"
                          : "bg-accent"
                    }`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">
                          Fatura · {item.cardName}
                        </p>
                        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-accent dark:bg-teal-950/40">
                          Cartão
                        </span>
                        {item.urgency === "overdue" ? (
                          <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-danger dark:bg-red-950/40">
                            Atrasada
                          </span>
                        ) : item.urgency === "today" ? (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-warning dark:bg-amber-950/40">
                            Vence hoje
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {item.itemCount} parcela(s) · vence em{" "}
                        {formatDate(item.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tabular-nums">
                        {formatCurrency(item.pendingTotal)}
                      </p>
                      <Link
                        href={item.href}
                        className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
                      >
                        Abrir fatura
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4 md:px-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Agenda
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {filtered.length} de {allItems.length} item(ns)
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1 dark:bg-slate-900/50"
                role="group"
                aria-label="Filtrar por situação"
              >
                {statusFilters.map((filter) => {
                  const isActive = status === filter.id
                  return (
                    <Link
                      key={filter.id}
                      href={buildHref(month, year, filter.id, tipo)}
                      scroll={false}
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
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1 dark:bg-slate-900/50"
                role="group"
                aria-label="Filtrar por tipo"
              >
                {typeFilters.map((filter) => {
                  const isActive = tipo === filter.id
                  return (
                    <Link
                      key={filter.id}
                      href={buildHref(month, year, status, filter.id)}
                      scroll={false}
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
              <div className="rounded-2xl border border-dashed border-border px-4 py-14 text-center">
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {cardInvoiceAlerts.length > 0
                    ? "Sem parcelas fora do cartão"
                    : "Nada para pagar neste período"}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                  {cardInvoiceAlerts.length > 0
                    ? `Há ${cardInvoiceAlerts.length} fatura(s) de cartão acima. Dívidas sem cartão, contas fixas e previstos aparecem aqui.`
                    : `Não há parcelas, contas fixas nem gastos previstos em ${monthLabel}.`}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {cardInvoiceAlerts.length > 0 ? (
                    <Link
                      href="/financeiro/cartoes"
                      className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                    >
                      Ir para cartões
                    </Link>
                  ) : (
                    <Link
                      href="/financeiro/dividas/nova"
                      className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                    >
                      Nova dívida
                    </Link>
                  )}
                  <Link
                    href="/financeiro/recorrentes"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    Contas fixas
                  </Link>
                  <Link
                    href="/financeiro/gastos-previstos"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    Gastos previstos
                  </Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
                <p className="font-semibold">Nenhum item neste filtro</p>
                <p className="mt-1 text-sm text-muted">
                  Ajuste a situação ou o tipo para ver os pagamentos.
                </p>
                <Link
                  href={buildHref(month, year, "todas", "todos")}
                  scroll={false}
                  className="mt-4 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {filtered.map((item) => {
                  const tone = getPayableTone(item, today)
                  return (
                    <li
                      key={item.id}
                      className={`flex gap-3 rounded-2xl border bg-background/40 p-3.5 transition md:p-4 ${
                        item.isOverdue
                          ? "border-red-200/80 dark:border-red-900/50"
                          : "border-border/70"
                      }`}
                    >
                      <span
                        className={`mt-1 h-12 w-1 shrink-0 rounded-full ${toneBar[tone]}`}
                        aria-hidden
                      />

                      <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold">
                              {item.title}
                            </p>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${kindBadgeClass(item.kind)}`}
                            >
                              {payableKindLabel(item.kind)}
                            </span>
                            {item.isOverdue ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-danger dark:bg-red-950/40">
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
                            ) : tone === "today" ? (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-warning dark:bg-amber-950/40">
                                Vence hoje
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            {item.subtitle}
                          </p>
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

                          {item.status === "SCHEDULE" &&
                          item.kind === "installment" &&
                          item.installmentId ? (
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
                  )
                })}
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
