import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { redirect } from "next/navigation"
import { ColumnChart, SimpleBars } from "@/components/simple-bars"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { MonthCompareCard } from "@/components/month-compare-card"
import { MonthYearFilter } from "@/components/month-year-filter"
import { MonthsFilter } from "@/components/months-filter"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, formatDate, getCurrentMonthYear } from "@/lib/format"
import {
  getDetails,
  getEvolution,
  getExpensesByCategory,
  getExpensesByMonth,
} from "@/lib/finance-api"
import type {
  CaixinhaBreakdownItem,
  DebtBreakdownItem,
  DebtProjectionItem,
  ExpenseByCategoryItem,
  RecurringIncomeBreakdownItem,
  RecurringPaymentBreakdownItem,
} from "@/lib/types"

type RelatoriosPageProps = {
  searchParams: Promise<{
    month?: string
    year?: string
    months?: string
  }>
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const initials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const ProgressBar = ({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: number
  max: number
  tone: "success" | "danger"
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            tone === "success" ? "text-success" : "text-danger"
          }`}
        >
          {formatCurrency(value)}
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${
            tone === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const SummaryRow = ({
  label,
  value,
  tone = "muted",
  highlighted = false,
}: {
  label: string
  value: number
  tone?: "muted" | "success" | "danger" | "accent"
  highlighted?: boolean
}) => {
  const toneClass = {
    muted: "text-foreground",
    success: "text-success",
    danger: "text-danger",
    accent: "text-accent",
  }[tone]

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        highlighted
          ? "rounded-xl bg-slate-50 px-3 py-2.5"
          : "px-1 py-2"
      }`}
    >
      <p
        className={`text-sm ${
          highlighted ? "font-semibold text-foreground" : "text-muted"
        }`}
      >
        {label}
      </p>
      <p className={`text-sm font-semibold tabular-nums ${toneClass}`}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}

const BreakdownItem = ({
  title,
  subtitle,
  value,
  tone = "danger",
}: {
  title: string
  subtitle: string
  value: string
  tone?: "success" | "danger" | "muted"
}) => {
  const valueClass = {
    success: "text-success",
    danger: "text-danger",
    muted: "text-foreground",
  }[tone]

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600"
        aria-hidden="true"
      >
        {initials(title)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <p className={`shrink-0 text-sm font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </li>
  )
}

const BreakdownCard = ({
  title,
  count,
  href,
  emptyLabel,
  children,
}: {
  title: string
  count: number
  href?: string
  emptyLabel: string
  children: ReactNode
}) => (
  <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted">{count} item(ns)</p>
      </div>
      {href ? (
        <Link
          href={href}
          className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold transition hover:bg-slate-50"
        >
          Ver todos
        </Link>
      ) : null}
    </div>
    {count === 0 ? (
      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-muted">
        {emptyLabel}
      </div>
    ) : (
      <ul className="mt-4 space-y-2">{children}</ul>
    )}
  </article>
)

const RelatoriosPage = async ({ searchParams }: RelatoriosPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const monthsRaw = params.months ? Number(params.months) : 6
  const months = Math.min(Math.max(monthsRaw || 6, 1), 24)

  if (
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isFinite(year) ||
    year < 2000 ||
    year > 2100
  ) {
    redirect(`/relatorios?month=${current.month}&year=${current.year}`)
  }

  try {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const [details, previousDetails, byCategoryTrend, byMonthTrend, evolution] =
      await Promise.all([
        getDetails(month, year),
        getDetails(prevMonth, prevYear).catch(() => null),
        getExpensesByCategory(months),
        getExpensesByMonth(months),
        getEvolution(months),
      ])

    const summary = details.summary
    const totalIncome =
      summary.totalIncome ??
      summary.recurringIncome + (summary.outrasEntradas ?? 0)
    const totalFixedOut =
      (summary.recurringPayments ?? 0) +
      (summary.debts ?? 0) +
      (summary.plannedExpensesOpen ?? 0)
    const balanceChartMax = Math.max(totalIncome, totalFixedOut, 1)
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
    const balancePositive = summary.balanceAfterExpenses >= 0
    const netPositive =
      (summary.netStructural ?? summary.netExpected) >= 0
    const monthSurplusPositive =
      (summary.balanceAfterExpenses ?? summary.netExpected) >= 0

    const incomes =
      details.recurringIncomeBreakdown ?? ([] as RecurringIncomeBreakdownItem[])
    const recurrings =
      details.recurringPaymentsBreakdown ??
      ([] as RecurringPaymentBreakdownItem[])
    const debts = details.debtsBreakdown ?? ([] as DebtBreakdownItem[])
    const plannedExpenses =
      details.plannedExpensesBreakdown ?? []
    const categories =
      details.expensesByCategory ?? ([] as ExpenseByCategoryItem[])
    const categoryTotal = categories.reduce((sum, item) => sum + item.total, 0)
    const projections = details.debtProjections ?? ([] as DebtProjectionItem[])
    const caixinhas =
      details.caixinhaBreakdown ?? ([] as CaixinhaBreakdownItem[])

    const paidDebts = debts.filter((item) => item.status === "PAY")
    const openDebts = debts.filter((item) => item.status !== "PAY")
    const paidRecurrings = recurrings.filter((item) => item.paidThisMonth)
    const openRecurrings = recurrings.filter((item) => !item.paidThisMonth)

    const trendNet = evolution.monthly.reduce((sum, item) => sum + item.net, 0)
    const bestMonth = [...evolution.monthly].sort((a, b) => b.net - a.net)[0]
    const worstMonth = [...evolution.monthly].sort((a, b) => a.net - b.net)[0]

    const openRecurringTotal = recurrings
      .filter((item) => !item.paidThisMonth)
      .reduce((sum, item) => sum + item.value, 0)
    const openDebtsTotal = openDebts.reduce((sum, item) => sum + item.value, 0)
    const openPlannedTotal = plannedExpenses
      .filter((item) => item.status === "SCHEDULED")
      .reduce((sum, item) => sum + item.value, 0)
    const openCommitmentsTotal =
      openRecurringTotal + openDebtsTotal + openPlannedTotal
    const paidExpensesTotal = summary.totalExpenses
    const surplus = summary.balanceAfterExpenses ?? summary.netExpected
    const afterPaidOnly = totalIncome - paidExpensesTotal

    const previousPaid = previousDetails?.summary.totalExpenses ?? 0
    const previousOpenRecurring = previousDetails
      ? (previousDetails.recurringPaymentsBreakdown ?? [])
          .filter((item) => !item.paidThisMonth)
          .reduce((sum, item) => sum + item.value, 0)
      : 0
    const previousOpenDebts = previousDetails
      ? (previousDetails.debtsBreakdown ?? [])
          .filter((item) => item.status !== "PAY")
          .reduce((sum, item) => sum + item.value, 0)
      : 0
    const previousOpenPlanned = previousDetails
      ? (previousDetails.plannedExpensesBreakdown ?? [])
          .filter((item) => item.status === "SCHEDULED")
          .reduce((sum, item) => sum + item.value, 0)
      : 0
    const previousOpenTotal =
      previousOpenRecurring + previousOpenDebts + previousOpenPlanned

    const reportCsvHeaders = ["Seção", "Item", "Valor", "Detalhe"]
    const reportCsvRows = [
      ["Resumo", "Receita do mês", totalIncome, monthLabel],
      [
        "Resumo",
        "Já pago (extrato)",
        paidExpensesTotal,
        "Saídas lançadas no mês",
      ],
      [
        "Resumo",
        "Ainda em aberto",
        openCommitmentsTotal,
        "Contas + parcelas + previstos não pagos",
      ],
      [
        "Resumo",
        "Sobra só com extrato",
        afterPaidOnly,
        "Receitas - já pago (ainda sem o aberto)",
      ],
      [
        "Resumo",
        "Sobra prevista",
        surplus,
        "Receitas - já pago - ainda em aberto",
      ],
      [
        "Resumo",
        "Sobra estrutural",
        summary.netStructural ?? summary.netExpected,
        "",
      ],
      ...categories.map((item) => [
        "Categoria",
        item.title,
        item.total,
        categoryTotal > 0
          ? `${((item.total / categoryTotal) * 100).toFixed(1)}%`
          : "0%",
      ]),
      ...incomes.map((item) => [
        "Receita fixa",
        item.title,
        item.value,
        `Dia ${item.dayOfMonth}`,
      ]),
      ...recurrings.map((item) => [
        "Conta fixa",
        item.title,
        item.value,
        item.paidThisMonth ? "Paga" : "Em aberto",
      ]),
      ...debts.map((item) => [
        "Parcela",
        item.debtTitle,
        item.value,
        item.status === "PAY" ? "Paga" : "Em aberto",
      ]),
      ...plannedExpenses.map((item) => [
        "Previsto",
        item.title,
        item.value,
        item.status,
      ]),
    ]
    const reportCsvFilename = `relatorio-${year}-${String(month).padStart(2, "0")}.csv`

    const previousIncome = previousDetails
      ? previousDetails.summary.totalIncome ??
        previousDetails.summary.recurringIncome +
          (previousDetails.summary.outrasEntradas ?? 0)
      : null
    const previousSurplus = previousDetails
      ? previousDetails.summary.balanceAfterExpenses ??
        previousDetails.summary.netExpected
      : null
    const previousLabel = `${MONTH_NAMES[prevMonth - 1]} ${prevYear}`

    const reportPdfData = {
      monthLabel,
      summary: {
        income: totalIncome,
        paidExpenses: paidExpensesTotal,
        openCommitments: openCommitmentsTotal,
        surplus,
        structuralSurplus: summary.netStructural ?? summary.netExpected,
        afterPaidOnly,
      },
      previous:
        previousDetails && previousIncome != null && previousSurplus != null
          ? {
              label: previousLabel,
              income: previousIncome,
              paidExpenses: previousPaid,
              openCommitments: previousOpenTotal,
              surplus: previousSurplus,
              afterPaidOnly: previousIncome - previousPaid,
            }
          : null,
      categories: categories.map((item) => ({
        title: item.title,
        total: item.total,
        share: categoryTotal > 0 ? (item.total / categoryTotal) * 100 : 0,
      })),
      incomes: incomes.map((item) => ({
        title: item.title,
        value: item.value,
        detail: `Dia ${item.dayOfMonth}`,
      })),
      recurrings: recurrings.map((item) => ({
        title: item.title,
        value: item.value,
        detail: item.paidThisMonth ? "Paga" : "Em aberto",
      })),
      debts: debts.map((item) => ({
        title: item.debtTitle,
        value: item.value,
        detail: item.status === "PAY" ? "Paga" : "Em aberto",
      })),
      planned: plannedExpenses.map((item) => ({
        title: item.title,
        value: item.value,
        detail:
          item.status === "PAID"
            ? "Pago"
            : item.status === "CANCELLED"
              ? "Cancelado"
              : "Em aberto",
      })),
    }

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  Detalhamento mensal
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  {monthLabel}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Visão consolidada do mês — no mesmo espírito do app, com mais
                  detalhe para decidir no computador.
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                    Carregando período...
                  </div>
                }
              >
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                  <div className="[&_button]:border-white/15 [&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/15 [&_div]:border-white/15 [&_div]:bg-white/5 [&_select]:text-white [&_span]:bg-teal-400/20 [&_span]:text-teal-100">
                    <MonthYearFilter
                      month={month}
                      year={year}
                      basePath="/relatorios"
                    />
                  </div>
                  <ExportDataButtons
                    filename={reportCsvFilename}
                    title={`Relatório — ${monthLabel}`}
                    subtitle="Resumo financeiro e detalhamento do mês"
                    headers={reportCsvHeaders}
                    rows={reportCsvRows}
                    reportData={reportPdfData}
                    csvLabel="CSV"
                    pdfLabel="PDF"
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </Suspense>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Receita do mês",
                  value: totalIncome,
                  hint: "Recorrente + outras entradas",
                  className: "text-emerald-300",
                },
                {
                  label: "Compromissos",
                  value: totalFixedOut,
                  hint: "Contas fixas + parcelas + previstos",
                  className: "text-amber-300",
                },
                {
                  label: "Sobra do mês",
                  value: summary.balanceAfterExpenses ?? summary.netExpected,
                  hint: balancePositive
                    ? "Inclui lançamentos do extrato"
                    : "Resultado líquido negativo",
                  className: monthSurplusPositive
                    ? "text-emerald-300"
                    : "text-red-300",
                },
                {
                  label: "Sobra estrutural",
                  value: summary.netStructural ?? summary.netExpected,
                  hint: netPositive
                    ? "Só receitas/compromissos fixos"
                    : "Fixos apertados",
                  className: netPositive ? "text-teal-200" : "text-red-300",
                },
              ].map((card) => (
                <article
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-xs text-slate-300">{card.label}</p>
                  <p
                    className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums ${card.className}`}
                  >
                    {formatCurrency(card.value)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{card.hint}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {previousDetails ? (
          <MonthCompareCard
            current={details}
            previous={previousDetails}
            currentMonth={month}
            currentYear={year}
            previousMonth={prevMonth}
            previousYear={prevYear}
            variant="reports"
          />
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
            <h2 className="text-base font-semibold">Receita vs gastos</h2>
            <p className="mt-1 text-sm text-muted">
              Comparativo dos compromissos planejados do mês
            </p>
            <div className="mt-5 space-y-5">
              <ProgressBar
                label="Receita"
                value={totalIncome}
                max={balanceChartMax}
                tone="success"
              />
              <ProgressBar
                label="Gastos comprometidos"
                value={totalFixedOut}
                max={balanceChartMax}
                tone="danger"
              />
            </div>
            <div className="mt-5 rounded-2xl border border-border bg-slate-50 px-4 py-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Saldo após gastos
              </p>
              <p
                className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums ${
                  balancePositive ? "text-success" : "text-danger"
                }`}
              >
                {formatCurrency(summary.balanceAfterExpenses)}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
            <h2 className="text-base font-semibold">Resumo do mês</h2>
            <p className="mt-1 text-sm text-muted">
              Abertura completa das entradas e saídas
            </p>
            <div className="mt-4 space-y-1">
              <SummaryRow
                label="Receita recorrente"
                value={summary.recurringIncome}
                tone="success"
              />
              {(summary.outrasEntradas ?? 0) > 0 ? (
                <SummaryRow
                  label="Outras entradas"
                  value={summary.outrasEntradas}
                  tone="success"
                />
              ) : null}
              <SummaryRow
                label="Total receita"
                value={totalIncome}
                tone="success"
                highlighted
              />
              <SummaryRow
                label="Pagamentos recorrentes"
                value={summary.recurringPayments}
                tone="danger"
              />
              <SummaryRow
                label="Dívidas do mês"
                value={summary.debts}
                tone="danger"
              />
              <SummaryRow
                label="Gastos previstos (em aberto)"
                value={summary.plannedExpensesOpen ?? 0}
                tone="danger"
              />
              <SummaryRow
                label="Total compromissos"
                value={totalFixedOut}
                tone="danger"
                highlighted
              />
              <SummaryRow
                label="Depósitos em caixinhas"
                value={summary.caixinhaDeposits}
                tone="accent"
              />
              <SummaryRow
                label="Caixinhas (líquido no período)"
                value={summary.caixinhaNetInMonth}
                tone={
                  summary.caixinhaNetInMonth >= 0 ? "success" : "danger"
                }
              />
              <SummaryRow
                label="Saldo total em caixinhas"
                value={summary.caixinhaTotal}
                tone="accent"
              />
              <SummaryRow
                label="Sobra do mês (com extrato)"
                value={summary.balanceAfterExpenses ?? summary.netExpected}
                tone={monthSurplusPositive ? "success" : "danger"}
              />
              <SummaryRow
                label="Sobra estrutural (fixos)"
                value={summary.netStructural ?? summary.netExpected}
                tone={netPositive ? "success" : "danger"}
              />
              <SummaryRow
                label="Total gasto (lançamentos)"
                value={summary.totalExpenses}
                tone="danger"
                highlighted
              />
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="Entradas recorrentes"
            count={incomes.length}
            href="/receitas-fixas"
            emptyLabel="Nenhuma receita fixa neste mês"
          >
            {incomes.map((item) => (
              <BreakdownItem
                key={item.id}
                title={item.title}
                subtitle={`Dia ${item.dayOfMonth} do mês`}
                value={formatCurrency(item.value)}
                tone="success"
              />
            ))}
          </BreakdownCard>

          <BreakdownCard
            title="Contas fixas"
            count={recurrings.length}
            href="/recorrentes"
            emptyLabel="Nenhuma conta fixa cadastrada"
          >
            {recurrings.map((item) => (
              <BreakdownItem
                key={item.id}
                title={item.title}
                subtitle={`Dia ${item.dayOfMonth} · ${
                  item.paidThisMonth ? "Pago" : "Em aberto"
                }`}
                value={formatCurrency(item.value)}
                tone={item.paidThisMonth ? "success" : "danger"}
              />
            ))}
          </BreakdownCard>

          <BreakdownCard
            title="Parcelas do mês"
            count={debts.length}
            href="/parcelas"
            emptyLabel="Nenhuma parcela neste período"
          >
            {debts.map((item) => {
              const isPaid = item.status === "PAY"
              return (
                <BreakdownItem
                  key={item.id}
                  title={item.debtTitle}
                  subtitle={`${formatDate(item.date)}${
                    isPaid ? " · Pago" : " · Em aberto"
                  }`}
                  value={formatCurrency(item.value)}
                  tone={isPaid ? "success" : "danger"}
                />
              )
            })}
          </BreakdownCard>

          <BreakdownCard
            title="Gastos previstos"
            count={plannedExpenses.length}
            href="/gastos-previstos"
            emptyLabel="Nenhum gasto previsto neste mês"
          >
            {plannedExpenses.map((item) => {
              const isPaid = item.status === "PAID"
              return (
                <BreakdownItem
                  key={item.id}
                  title={item.title}
                  subtitle={`${formatDate(item.dueDate)} · ${
                    isPaid ? "Pago" : "Previsto"
                  }`}
                  value={formatCurrency(item.value)}
                  tone={isPaid ? "success" : "danger"}
                />
              )
            })}
          </BreakdownCard>

          <BreakdownCard
            title="Movimentação de caixinhas"
            count={caixinhas.length}
            href="/caixinhas"
            emptyLabel="Sem depósitos ou retiradas neste mês"
          >
            {caixinhas.map((item) => (
              <BreakdownItem
                key={item.id}
                title={item.message}
                subtitle={formatDate(item.createdAt)}
                value={`${item.type === "deposit" ? "+" : "−"}${formatCurrency(
                  item.value
                )}`}
                tone={item.type === "deposit" ? "success" : "danger"}
              />
            ))}
          </BreakdownCard>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
            <p className="text-sm text-muted">Contas fixas pagas</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
              {paidRecurrings.length}/{recurrings.length}
            </p>
          </article>
          <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
            <p className="text-sm text-muted">Contas fixas em aberto</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
              {openRecurrings.length}
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
            <p className="text-sm text-muted">Parcelas pagas</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
              {paidDebts.length}/{debts.length}
            </p>
          </article>
          <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
            <p className="text-sm text-muted">Parcelas em aberto</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
              {openDebts.length}
            </p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
            <div className="mb-5">
              <h2 className="text-base font-semibold">Gastos por categoria</h2>
              <p className="mt-1 text-sm text-muted">
                Lançamentos do mês ·{" "}
                {formatCurrency(categoryTotal || summary.totalExpenses)}
              </p>
            </div>
            <SimpleBars
              showRank
              color="warning"
              items={categories.slice(0, 10).map((item) => ({
                label: item.title,
                value: item.total,
                hint:
                  categoryTotal > 0
                    ? `${((item.total / categoryTotal) * 100).toFixed(1)}% do mês`
                    : undefined,
              }))}
            />
          </article>

          <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Projeções de quitação
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Quanto falta para zerar cada dívida ativa
                </p>
              </div>
              <Link
                href="/dividas"
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold transition hover:bg-slate-50"
              >
                Dívidas
              </Link>
            </div>
            {projections.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                Nenhuma dívida com parcelas em aberto
              </div>
            ) : (
              <ul className="space-y-3">
                {projections.slice(0, 6).map((item) => (
                  <li
                    key={item.debtId}
                    className="rounded-xl border border-border/70 bg-background/70 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.remainingInstallments} parcela(s) · última em{" "}
                          {formatDate(item.lastInstallmentDate)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-accent">
                        {formatCurrency(item.remainingValue)}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <p className="text-muted">Média/parcela</p>
                        <p className="mt-0.5 font-semibold tabular-nums">
                          {formatCurrency(item.averageInstallmentValue)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-teal-50/70 px-2.5 py-2">
                        <p className="text-muted">Sugestão mensal</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-accent">
                          {formatCurrency(item.suggestedMonthlyPayment)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Tendência
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                Últimos {months} meses
              </h2>
              <p className="mt-1 text-sm text-muted">
                Evolução além do mês selecionado para comparar o período
              </p>
            </div>
            <Suspense fallback={<div className="text-sm text-muted">...</div>}>
              <MonthsFilter months={months} />
            </Suspense>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-border/70 bg-background/80 px-3 py-3">
              <p className="text-xs text-muted">Resultado do período</p>
              <p
                className={`mt-1 text-lg font-semibold tabular-nums ${
                  trendNet >= 0 ? "text-accent" : "text-danger"
                }`}
              >
                {formatCurrency(trendNet)}
              </p>
            </article>
            <article className="rounded-xl border border-border/70 bg-background/80 px-3 py-3">
              <p className="text-xs text-muted">Melhor mês</p>
              <p className="mt-1 text-lg font-semibold">
                {bestMonth?.label ?? "—"}
              </p>
              <p className="text-xs text-success">
                {formatCurrency(bestMonth?.net ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-border/70 bg-background/80 px-3 py-3">
              <p className="text-xs text-muted">Mês mais apertado</p>
              <p className="mt-1 text-lg font-semibold">
                {worstMonth?.label ?? "—"}
              </p>
              <p className="text-xs text-danger">
                {formatCurrency(worstMonth?.net ?? 0)}
              </p>
            </article>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Categorias no período
              </h3>
              <SimpleBars
                showRank
                color="warning"
                items={byCategoryTrend.byCategory.slice(0, 6).map((item) => ({
                  label: item.title,
                  value: item.total,
                  hint: `${item.percentage.toFixed(1)}%`,
                }))}
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Gastos por mês</h3>
              <SimpleBars
                color="accent"
                items={byMonthTrend.byMonth.map((item) => ({
                  label: item.label,
                  value: item.total,
                }))}
              />
            </div>
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold">Receitas x despesas</h3>
            <ColumnChart
              valueLabel="Receitas"
              secondaryLabel="Despesas"
              items={evolution.monthly.map((item) => ({
                label: item.label,
                value: item.income,
                secondaryValue: item.expenses,
              }))}
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-2 py-2.5 font-medium">Mês</th>
                  <th className="px-2 py-2.5 font-medium">Receitas</th>
                  <th className="px-2 py-2.5 font-medium">Despesas</th>
                  <th className="px-2 py-2.5 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {evolution.monthly.map((item) => (
                  <tr
                    key={item.label}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-2 py-3 font-medium">{item.label}</td>
                    <td className="px-2 py-3 text-success">
                      {formatCurrency(item.income)}
                    </td>
                    <td className="px-2 py-3 text-warning">
                      {formatCurrency(item.expenses)}
                    </td>
                    <td
                      className={`px-2 py-3 font-semibold ${
                        item.net >= 0 ? "text-accent" : "text-danger"
                      }`}
                    >
                      {formatCurrency(item.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default RelatoriosPage
