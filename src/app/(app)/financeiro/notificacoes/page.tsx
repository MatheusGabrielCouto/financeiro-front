import Link from "next/link"
import { redirect } from "next/navigation"
import { BrowserReminders } from "@/components/browser-reminders"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import {
  buildDueAlerts,
  kindLabel,
  urgencyLabel,
} from "@/lib/due-alerts"
import { formatCurrency, formatDate, getCurrentMonthYear } from "@/lib/format"
import {
  getAmount,
  getDetails,
  getFuturePurchaseProjections,
  getInstallments,
  getPaymentReminders,
  getPlannedExpenses,
  getRecurringPayments,
} from "@/lib/finance-api"
import { buildCreditCardInvoiceAlerts } from "@/lib/credit-card-alerts"
import { buildInsightAlerts } from "@/lib/notification-count"
import type { DueAlert } from "@/lib/types"

const urgencyStyles: Record<
  DueAlert["urgency"],
  { badge: string; border: string }
> = {
  overdue: {
    badge: "bg-red-50 text-danger dark:bg-red-950/40",
    border: "border-red-200/80 dark:border-red-900/40",
  },
  today: {
    badge: "bg-amber-50 text-warning dark:bg-amber-950/40",
    border: "border-amber-200/80 dark:border-amber-900/40",
  },
  tomorrow: {
    badge: "bg-teal-50 text-accent dark:bg-teal-950/40",
    border: "border-teal-200/70 dark:border-teal-900/40",
  },
  week: {
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    border: "border-border/80",
  },
}

const insightStyles = {
  danger: "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/30",
  warning: "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/30",
  accent: "border-teal-200/70 bg-teal-50/40 dark:border-teal-900/40 dark:bg-teal-950/30",
} as const

const NotificacoesPage = async () => {
  const current = getCurrentMonthYear()
  const nextMonth = current.month === 12 ? 1 : current.month + 1
  const nextYear = current.month === 12 ? current.year + 1 : current.year
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in14 = new Date(today)
  in14.setDate(in14.getDate() + 14)
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 30)

  try {
    const [
      installmentsCurrent,
      installmentsNext,
      recurringPayments,
      plannedCurrent,
      plannedNext,
      amount,
      details,
      projections,
      paymentReminders,
    ] = await Promise.all([
      getInstallments(current.month, current.year),
      getInstallments(nextMonth, nextYear),
      getRecurringPayments(),
      getPlannedExpenses({ month: current.month, year: current.year }),
      getPlannedExpenses({ month: nextMonth, year: nextYear }),
      getAmount(),
      getDetails(current.month, current.year),
      getFuturePurchaseProjections(),
      getPaymentReminders({ status: "OPEN" }).catch(() => []),
    ])

    const cardInvoiceAlerts = await buildCreditCardInvoiceAlerts({
      month: current.month,
      year: current.year,
      today,
    })
    const cardInvoicesTotal = cardInvoiceAlerts.reduce(
      (sum, item) => sum + item.pendingTotal,
      0
    )

    const installments = [...installmentsCurrent, ...installmentsNext]
    const plannedExpenses = [...plannedCurrent, ...plannedNext]
    const alerts = buildDueAlerts({
      installments,
      recurringPayments,
      plannedExpenses,
    })

    const openReminders = paymentReminders
      .filter((item) => item.status === "OPEN")
      .sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
        return order[a.priority] - order[b.priority]
      })
    const remindersTotal = openReminders.reduce(
      (sum, item) => sum + item.value,
      0
    )

    const caixinhaAlerts = projections.filter((item) => {
      if (item.isGoalReached) return false
      const due = new Date(item.dateAcquisition)
      due.setHours(0, 0, 0, 0)
      if (due.getTime() < today.getTime()) return false
      const progress = item.value > 0 ? item.valueAdded / item.value : 0
      const near = due.getTime() <= in14.getTime()
      const stagnant = progress < 0.5 && due.getTime() <= in30.getTime()
      return near || stagnant
    }).length

    const insights = buildInsightAlerts({
      amount: amount.amount,
      netExpected: details.summary.netExpected,
      caixinhaAlerts,
    })

    const groups: Array<{
      urgency: DueAlert["urgency"]
      title: string
      description: string
    }> = [
      {
        urgency: "overdue",
        title: "Atrasados",
        description: "Já passaram do vencimento",
      },
      {
        urgency: "today",
        title: "Vencem hoje",
        description: "Prioridade máxima do dia",
      },
      {
        urgency: "tomorrow",
        title: "Vencem amanhã",
        description: "Organize o saldo com antecedência",
      },
      {
        urgency: "week",
        title: "Próximos 7 dias",
        description: "Agenda da semana",
      },
    ]

    const counts = {
      overdue: alerts.filter((item) => item.urgency === "overdue").length,
      today: alerts.filter((item) => item.urgency === "today").length,
      tomorrow: alerts.filter((item) => item.urgency === "tomorrow").length,
      week: alerts.filter((item) => item.urgency === "week").length,
    }
    const priorityTotal = alerts
      .filter((item) => item.urgency !== "week")
      .reduce((sum, item) => sum + item.value, 0)

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Atenção
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                O que precisa da sua atenção
              </h1>
              <p className="mt-2 text-sm text-muted">
                Inbox unificada: vencimentos, lista pra pagar, fluxo e metas —
                sem depender de histórico no banco.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/financeiro/pra-pagar"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Pra pagar
              </Link>
              <Link
                href="/financeiro/parcelas"
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Ir para pagamentos
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <article className="rounded-2xl border border-red-200/70 bg-red-50/40 p-4 dark:border-red-900/40 dark:bg-red-950/30">
              <p className="text-sm text-muted">Atrasados</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-danger">
                {counts.overdue}
              </p>
            </article>
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm text-muted">Hoje / amanhã</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {counts.today + counts.tomorrow}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Pra pagar</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {openReminders.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatCurrency(remindersTotal)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-300/80 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Faturas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {cardInvoiceAlerts.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatCurrency(cardInvoicesTotal)}
              </p>
            </article>
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm text-muted">Alertas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {insights.length}
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-surface p-4">
              <p className="text-sm text-muted">Prioridade agora</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(
                  priorityTotal + remindersTotal + cardInvoicesTotal
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                vencimentos + lista + faturas
              </p>
            </article>
          </div>
        </section>

        {insights.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight) => (
              <Link
                key={insight.id}
                href={insight.href}
                className={`rounded-2xl border p-4 transition hover:opacity-95 ${insightStyles[insight.tone]}`}
              >
                <p className="font-semibold">{insight.title}</p>
                <p className="mt-1 text-sm text-muted">{insight.description}</p>
                <p className="mt-3 text-xs font-semibold text-accent">Ver detalhes</p>
              </Link>
            ))}
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            {cardInvoiceAlerts.length > 0 ? (
              <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold">
                      Faturas de cartão
                    </h2>
                    <p className="text-sm text-muted">
                      Parcelas em aberto neste mês
                    </p>
                  </div>
                  <Link
                    href="/financeiro/cartoes"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Ver cartões
                  </Link>
                </div>
                <ul className="space-y-2 p-3 md:p-4">
                  {cardInvoiceAlerts.map((item) => {
                    const styles = urgencyStyles[item.urgency]
                    return (
                      <li
                        key={item.id}
                        className={`rounded-2xl border bg-background/50 p-4 ${styles.border}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold">
                                Fatura · {item.cardName}
                              </h3>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${styles.badge}`}
                              >
                                {urgencyLabel(item.urgency)}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Cartão
                              </span>
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
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              Pagar fatura
                            </Link>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            {openReminders.length > 0 ? (
              <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold">Pra pagar</h2>
                    <p className="text-sm text-muted">
                      Checklist — marcar feito não altera saldo
                    </p>
                  </div>
                  <Link
                    href="/financeiro/pra-pagar"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Abrir lista
                  </Link>
                </div>
                <ul className="space-y-2 p-3 md:p-4">
                  {openReminders.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold">
                              {item.title}
                            </h3>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                item.priority === "HIGH"
                                  ? "bg-red-50 text-danger dark:bg-red-950/40"
                                  : item.priority === "LOW"
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    : "bg-amber-50 text-warning dark:bg-amber-950/40"
                              }`}
                            >
                              {item.priority === "HIGH"
                                ? "Alta"
                                : item.priority === "LOW"
                                  ? "Baixa"
                                  : "Média"}
                            </span>
                          </div>
                          {item.notes ? (
                            <p className="mt-1 text-sm text-muted">{item.notes}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(item.value)}
                          </p>
                          <ProxyActionButton
                            path={`/payment-reminder/${item.id}/done`}
                            method="POST"
                            label="Feito"
                            loadingLabel="..."
                            variant="ghost"
                            ariaLabel={`Marcar ${item.title} como feito`}
                          />
                          <Link
                            href="/financeiro/pra-pagar"
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Abrir
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {alerts.length === 0 &&
            openReminders.length === 0 &&
            cardInvoiceAlerts.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-14 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <p className="font-semibold text-success">Tudo em dia</p>
                <p className="mt-1 text-sm text-muted">
                  Nenhum vencimento próximo, fatura aberta nem item na lista pra
                  pagar.
                </p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-2xl border border-border/80 bg-surface px-4 py-8 text-center text-sm text-muted">
                Sem vencimentos nos próximos 7 dias — foque nas faturas e na
                lista pra pagar.
              </div>
            ) : (
              groups.map((group) => {
                const items = alerts.filter(
                  (item) => item.urgency === group.urgency
                )
                if (items.length === 0) return null

                return (
                  <section
                    key={group.urgency}
                    className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40"
                  >
                    <div className="border-b border-border px-5 py-4">
                      <h2 className="text-base font-semibold">{group.title}</h2>
                      <p className="text-sm text-muted">{group.description}</p>
                    </div>
                    <ul className="space-y-2 p-3 md:p-4">
                      {items.map((item) => {
                        const styles = urgencyStyles[item.urgency]
                        return (
                          <li
                            key={item.id}
                            className={`rounded-2xl border bg-background/50 p-4 ${styles.border}`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate font-semibold">
                                    {item.title}
                                  </h3>
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${styles.badge}`}
                                  >
                                    {urgencyLabel(item.urgency)}
                                  </span>
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {kindLabel(item.kind)}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-muted">
                                  Vence em {formatDate(item.dueDate)}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold tabular-nums">
                                  {formatCurrency(item.value)}
                                </p>
                                <Link
                                  href={item.href}
                                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  Resolver
                                </Link>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <BrowserReminders alerts={alerts} />
            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm font-semibold text-accent">Atalhos</p>
              <p className="mt-1 text-sm text-muted">
                Complete o mapa financeiro para a inbox ficar útil.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/financeiro/pra-pagar"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                >
                  Pra pagar
                </Link>
                <Link
                  href="/financeiro/gastos-previstos"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                >
                  Previstos
                </Link>
                <Link
                  href="/financeiro/cartoes"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                >
                  Cartões
                </Link>
                <Link
                  href="/financeiro/recorrentes"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                >
                  Contas fixas
                </Link>
              </div>
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

export default NotificacoesPage
