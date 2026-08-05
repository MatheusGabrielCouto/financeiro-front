import Link from "next/link"
import { redirect } from "next/navigation"
import {
  IconBell,
  IconDebts,
  IconInstallments,
  IconPlus,
  IconTransactions,
  IconPiggy,
  IconInsights,
  IconReports,
  IconSimulate,
} from "@/components/icons"
import { PayInstallmentButton } from "@/components/pay-installment-button"
import { OverdueInterestHint } from "@/components/overdue-interest-hint"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { StatusBadge } from "@/components/status-badge"
import { ApiError } from "@/lib/api-server"
import {
  getStoredUser,
  isOnboardingDone,
} from "@/lib/auth-cookies"
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import {
  getAmount,
  getDetails,
  getEmergencyReserve,
  getFuturePurchaseProjections,
  getPlannedDebtWorkbook,
  getRecurringIncomes,
} from "@/lib/finance-api"

type UpcomingItem = {
  id: string
  entityId: string
  title: string
  value: number
  dueDate: Date
  kind: "installment" | "recurring"
  status: "PAY" | "SCHEDULE"
  interestRate?: number
  interestRateType?: "MONTHLY" | "DAILY"
}

const DashboardPage = async () => {
  const { month, year } = getCurrentMonthYear()

  try {
    const onboardingDone = await isOnboardingDone()
    if (!onboardingDone) {
      const incomes = await getRecurringIncomes()
      if (incomes.length === 0) {
        redirect("/onboarding")
      }
      redirect("/api/onboarding/complete?from=/")
    }

    const [amount, details, user, projections, reserve, plannedWorkbook] =
      await Promise.all([
        getAmount(),
        getDetails(month, year),
        getStoredUser(),
        getFuturePurchaseProjections().catch(() => []),
        getEmergencyReserve(6).catch(() => null),
        getPlannedDebtWorkbook(year).catch(() => null),
      ])

    const recurringBreakdown = details.recurringPaymentsBreakdown ?? []
    const plannedBreakdown = details.plannedExpensesBreakdown ?? []
    const paidInstallments = details.debtsBreakdown.filter(
      (item) => item.status === "PAY"
    )
    const pendingInstallments = details.debtsBreakdown.filter(
      (item) => item.status === "SCHEDULE"
    )
    const paidRecurring = recurringBreakdown.filter((item) => item.paidThisMonth)
    const pendingRecurring = recurringBreakdown.filter(
      (item) => !item.paidThisMonth
    )
    const paidPlanned = plannedBreakdown.filter((item) => item.status === "PAID")
    const pendingPlanned = plannedBreakdown.filter(
      (item) => item.status === "SCHEDULED"
    )

    const paidInstallmentsTotal = paidInstallments.reduce(
      (sum, item) => sum + item.value,
      0
    )
    const pendingInstallmentsTotal = pendingInstallments.reduce(
      (sum, item) => sum + item.value,
      0
    )
    const paidRecurringTotal = paidRecurring.reduce(
      (sum, item) => sum + item.value,
      0
    )
    const pendingRecurringTotal = pendingRecurring.reduce(
      (sum, item) => sum + item.value,
      0
    )
    const paidPlannedTotal = paidPlanned.reduce(
      (sum, item) => sum + item.value,
      0
    )
    const pendingPlannedTotal = pendingPlanned.reduce(
      (sum, item) => sum + item.value,
      0
    )

    const paidCommitments =
      paidInstallmentsTotal + paidRecurringTotal + paidPlannedTotal
    const scheduledTotal =
      pendingInstallmentsTotal + pendingRecurringTotal + pendingPlannedTotal
    const commitmentTotal =
      details.summary.debts +
      details.summary.recurringPayments +
      (details.summary.plannedExpensesOpen ?? 0)
    const monthIncome =
      details.summary.totalIncome ??
      details.summary.recurringIncome + (details.summary.outrasEntradas ?? 0)
    const monthOutflow = details.summary.totalExpenses
    const otherExpenses =
      details.summary.otherExpenses ??
      Math.max(0, monthOutflow - paidCommitments)
    const monthSurplus =
      details.summary.balanceAfterExpenses ?? details.summary.netExpected
    const hasCommitments = commitmentTotal > 0 || scheduledTotal > 0
    const progress = hasCommitments
      ? Math.round((paidCommitments / Math.max(commitmentTotal, 1)) * 100)
      : monthIncome > 0
        ? Math.min(100, Math.round((monthOutflow / monthIncome) * 100))
        : monthOutflow > 0
          ? 100
          : 0
    const pendingCount =
      pendingInstallments.length +
      pendingRecurring.length +
      pendingPlanned.length

    const upcomingItems: UpcomingItem[] = [
      ...pendingInstallments.map((item) => ({
        id: `installment-${item.id}`,
        entityId: item.id,
        title: item.debtTitle,
        value: item.value,
        dueDate: new Date(item.date),
        kind: "installment" as const,
        status: "SCHEDULE" as const,
        interestRate: item.interestRate,
        interestRateType: item.interestRateType,
      })),
      ...pendingRecurring.map((item) => {
        const safeDay = Math.min(
          item.dayOfMonth,
          new Date(year, month, 0).getDate()
        )
        return {
          id: `recurring-${item.id}`,
          entityId: item.id,
          title: item.title,
          value: item.value,
          dueDate: new Date(year, month - 1, safeDay),
          kind: "recurring" as const,
          status: "SCHEDULE" as const,
        }
      }),
    ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

    const firstName = user?.name?.split(" ")[0] ?? "olá"
    const monthLabel = formatMonthLabel(month, year)
    const netPositive = monthSurplus >= 0
    const balanceCoversPending = amount.amount >= scheduledTotal

    const flowRows = [
      {
        label: "Receitas fixas",
        value: details.summary.recurringIncome,
        tone: "income" as const,
      },
      {
        label: "Outras entradas",
        value: details.summary.outrasEntradas ?? 0,
        tone: "income" as const,
      },
      {
        label: "Contas fixas",
        value: details.summary.recurringPayments,
        tone: "expense" as const,
      },
      {
        label: "Parcelas do mês",
        value: details.summary.debts,
        tone: "expense" as const,
      },
      {
        label: "Gastos previstos",
        value: details.summary.plannedExpensesOpen ?? 0,
        tone: "expense" as const,
      },
      {
        label: "Lançamentos (extrato)",
        value: otherExpenses,
        tone: "expense" as const,
      },
    ].filter((row) => row.value > 0)
    const flowMax = Math.max(
      ...flowRows.map((row) => row.value),
      Math.abs(monthSurplus),
      1
    )

    const totalSaved = projections.reduce((sum, item) => sum + item.valueAdded, 0)
    const totalGoals = projections.reduce((sum, item) => sum + item.value, 0)
    const goalsProgress =
      totalGoals > 0 ? Math.min(100, Math.round((totalSaved / totalGoals) * 100)) : 0
    const topGoals = [...projections]
      .sort((a, b) => {
        const progressA = a.value > 0 ? a.valueAdded / a.value : 0
        const progressB = b.value > 0 ? b.valueAdded / b.value : 0
        return progressB - progressA
      })
      .slice(0, 3)

    const plannedLines = plannedWorkbook?.lines ?? []
    const plannedPreview = plannedLines.slice(0, 4)
    const plannedMonthTotal =
      plannedWorkbook?.monthTotals?.[month - 1] ?? 0
    const plannedSurplus = plannedWorkbook?.surplus?.[month - 1] ?? null

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  {monthLabel}
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Olá, {firstName}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Panorama do mês, com pagamento rápido e foco no que ainda falta.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/parcelas"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-teal-50"
                >
                  <IconInstallments className="h-4 w-4" />
                  Pagar parcelas
                </Link>
                <Link
                  href="/dividas/nova"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <IconPlus className="h-4 w-4" />
                  Nova dívida
                </Link>
              </div>
            </div>

            <div className="relative mt-7 grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-300">Saldo disponível</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
                  {formatCurrency(amount.amount)}
                </p>
                <p
                  className={`mt-3 text-sm font-medium ${
                    scheduledTotal === 0
                      ? monthOutflow > 0
                        ? "text-slate-300"
                        : "text-emerald-300"
                      : balanceCoversPending
                        ? "text-emerald-300"
                        : "text-amber-300"
                  }`}
                >
                  {scheduledTotal === 0
                    ? monthOutflow > 0
                      ? `${formatCurrency(monthOutflow)} saíram no extrato este mês`
                      : "Nenhuma pendência neste mês"
                    : balanceCoversPending
                      ? "Seu saldo cobre as pendências do mês"
                      : `Faltam ${formatCurrency(scheduledTotal - amount.amount)} para cobrir as pendências`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">
                    {hasCommitments ? "Progresso do mês" : "Fluxo do mês"}
                  </p>
                  <span className="text-sm font-semibold text-teal-200">
                    {progress}%
                  </span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-300 to-emerald-400 transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">
                      {hasCommitments ? "Já pago" : "Saídas"}
                    </p>
                    <p className="mt-0.5 font-semibold text-emerald-300">
                      {formatCurrency(
                        hasCommitments ? paidCommitments : monthOutflow
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">
                      {hasCommitments ? "Ainda falta" : "Entradas"}
                    </p>
                    <p className="mt-0.5 font-semibold text-amber-300">
                      {formatCurrency(
                        hasCommitments ? scheduledTotal : monthIncome
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Indicadores do mês"
        >
          {[
            {
              label: "A pagar",
              value: formatCurrency(scheduledTotal),
              hint: `${pendingCount} compromisso(s)`,
              className: "border-amber-200/70 bg-amber-50/50",
              valueClass: "text-warning",
            },
            {
              label: "Saídas do mês",
              value: formatCurrency(monthOutflow),
              hint: "Lançamentos no extrato",
              className: "border-emerald-200/70 bg-emerald-50/40",
              valueClass: "text-success",
            },
            {
              label: "Entradas do mês",
              value: formatCurrency(monthIncome),
              hint: "Fixas + outras entradas",
              className: "border-border/80 bg-surface",
              valueClass: "text-foreground",
            },
            {
              label: "Sobra do mês",
              value: formatCurrency(monthSurplus),
              hint: netPositive ? "Mês sob controle" : "Atenção ao fluxo",
              className: netPositive
                ? "border-teal-200/70 bg-teal-50/40"
                : "border-red-200/70 bg-red-50/40",
              valueClass: netPositive ? "text-accent" : "text-danger",
            },
          ].map((card) => (
            <article
              key={card.label}
              className={`rounded-2xl border p-4 shadow-sm shadow-slate-200/30 md:p-5 ${card.className}`}
            >
              <p className="text-sm font-medium text-muted">{card.label}</p>
              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight ${card.valueClass}`}
              >
                {card.value}
              </p>
              <p className="mt-1.5 text-xs text-muted">{card.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Metas</h2>
                <p className="mt-1 text-sm text-muted">
                  Progresso das caixinhas e reserva
                </p>
              </div>
              <Link
                href="/caixinhas"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50"
              >
                Ver todas
              </Link>
            </div>

            {projections.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium">Nenhuma meta ainda</p>
                <Link
                  href="/caixinhas"
                  className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
                >
                  Criar caixinha
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {formatCurrency(totalSaved)} de {formatCurrency(totalGoals)}
                    </span>
                    <span className="font-semibold text-accent">{goalsProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${goalsProgress}%` }}
                    />
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {topGoals.map((goal) => {
                    const pct =
                      goal.value > 0
                        ? Math.min(
                            100,
                            Math.round((goal.valueAdded / goal.value) * 100)
                          )
                        : 0
                    return (
                      <li
                        key={goal.id}
                        className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{goal.name}</span>
                          <span className="shrink-0 text-xs text-muted">{pct}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {reserve ? (
              <p className="mt-4 text-xs text-muted">
                Reserva: {formatCurrency(reserve.currentReserve)} ·{" "}
                {reserve.progressPercent.toFixed(0)}% da meta de emergência
              </p>
            ) : null}
          </article>

          <article className="rounded-2xl border border-teal-200/70 bg-teal-50/30 p-5 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Planejamento</h2>
                <p className="mt-1 text-sm text-muted">
                  Planilha de dívidas futuras do mês
                </p>
              </div>
              <IconReports className="h-5 w-5 text-accent" />
            </div>

            {plannedLines.length > 0 ? (
              <>
                <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-accent">
                  {formatCurrency(plannedMonthTotal)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Planejado em {formatMonthLabel(month, year)} ·{" "}
                  {plannedLines.length} linha(s)
                </p>
                {plannedSurplus != null ? (
                  <p
                    className={`mt-1 text-sm font-medium ${
                      plannedSurplus >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    Sobra: {formatCurrency(plannedSurplus)}
                  </p>
                ) : null}
                <ul className="mt-4 space-y-2">
                  {plannedPreview.map((item) => {
                    const monthValue = item.months[month - 1]?.value ?? 0
                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm"
                      >
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {monthValue > 0 ? formatCurrency(monthValue) : "—"}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <div className="mt-4 rounded-xl bg-white/70 px-4 py-6 text-center">
                <p className="text-sm font-medium">Nada planejado neste ano</p>
                <p className="mt-1 text-xs text-muted">
                  Abra a grade anual e preencha como no Excel.
                </p>
              </div>
            )}

            <Link
              href={`/planejamento?year=${year}`}
              className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Abrir planilha
            </Link>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Próximas a pagar</h2>
                <p className="text-sm text-muted">
                  Pague na hora ou abra a agenda completa
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/recorrentes"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Contas fixas
                </Link>
                <Link
                  href="/parcelas"
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                >
                  Ver todas
                </Link>
              </div>
            </div>

            <div className="p-3 md:p-4">
              {upcomingItems.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 px-4 py-10 text-center">
                  <p className="font-semibold text-success">Tudo em dia neste mês</p>
                  <p className="mt-1 text-sm text-muted">
                    Não há parcelas nem contas fixas pendentes para {monthLabel}.
                  </p>
                  <Link
                    href="/dividas"
                    className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
                  >
                    Ver minhas dívidas
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {upcomingItems.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/70 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{item.title}</p>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              item.kind === "recurring"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-teal-50 text-accent"
                            }`}
                          >
                            {item.kind === "recurring"
                              ? "Conta fixa"
                              : "Parcela"}
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
                        </div>
                        <p className="mt-0.5 text-sm text-muted">
                          Vence em {formatDate(item.dueDate)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={item.status} />
                        <p className="font-semibold tabular-nums">
                          {formatCurrency(item.value)}
                        </p>
                        {item.kind === "installment" ? (
                          <PayInstallmentButton
                            installmentId={item.entityId}
                            debtTitle={item.title}
                          />
                        ) : (
                          <ProxyActionButton
                            path={`/recurring-payment/${item.entityId}/pay`}
                            method="POST"
                            label="Pagar"
                            loadingLabel="Pagando..."
                            variant="primary"
                            ariaLabel={`Pagar conta fixa ${item.title}`}
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {upcomingItems.length > 8 ? (
                <p className="mt-3 text-center text-sm text-muted">
                  + {upcomingItems.length - 8} pendência(s) na agenda
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Fluxo do mês</h2>
              <p className="mt-1 text-sm text-muted">
                Como chegamos na sobra com os lançamentos
              </p>

              <p
                className={`mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight ${
                  netPositive ? "text-success" : "text-danger"
                }`}
              >
                {formatCurrency(monthSurplus)}
              </p>

              <div className="mt-5 space-y-3">
                {flowRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{row.label}</span>
                      <span className="font-medium">
                        {row.tone === "income" ? "+" : "−"}
                        {formatCurrency(row.value)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          row.tone === "income" ? "bg-emerald-400" : "bg-slate-400"
                        }`}
                        style={{
                          width: `${Math.max((row.value / flowMax) * 100, row.value ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Ações rápidas</h2>
              <div className="mt-3 grid gap-2">
                {[
                  {
                    href: `/planejamento?year=${year}`,
                    label: "Planilha",
                    hint: "Dívidas futuras",
                    icon: IconReports,
                  },
                  {
                    href: "/planejador",
                    label: "Planejador",
                    hint: "Estratégia de quitação",
                    icon: IconDebts,
                  },
                  {
                    href: "/caixinhas",
                    label: "Caixinhas",
                    hint: "Metas e reserva",
                    icon: IconPiggy,
                  },
                  {
                    href: "/simulador",
                    label: "Simulador",
                    hint: "Teste um parcelamento",
                    icon: IconSimulate,
                  },
                  {
                    href: "/insights",
                    label: "Insights",
                    hint: "Score e alertas",
                    icon: IconInsights,
                  },
                  {
                    href: "/extrato",
                    label: "Extrato",
                    hint: "Lançamentos do mês",
                    icon: IconTransactions,
                  },
                  {
                    href: "/notificacoes",
                    label: "Notificações",
                    hint: "Vencimentos próximos",
                    icon: IconBell,
                  },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-xl border border-border/80 px-3 py-3 transition hover:border-accent/30 hover:bg-accent-soft/40"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-accent group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {action.label}
                        </span>
                        <span className="block text-xs text-muted">
                          {action.hint}
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    throw error
  }
}

export default DashboardPage
