import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ApiError } from "@/lib/api-server"
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import { getFinancialScore, getSpendingInsights } from "@/lib/finance-api"

type InsightsPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>
}

const ratingTone = (rating: string, score: number) => {
  const value = rating.toLowerCase()
  if (value.includes("excelente") || score >= 80) {
    return {
      label: rating,
      badge: "bg-emerald-50 text-success dark:bg-emerald-950/40",
      soft: "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/30",
      score: "text-success",
      ring: "#10b981",
      track: "#d1fae5",
      message: "Sua saúde financeira está em bom caminho.",
    }
  }
  if (value.includes("bom") || score >= 65) {
    return {
      label: rating,
      badge: "bg-teal-50 text-accent dark:bg-teal-950/40",
      soft: "border-teal-200/70 bg-teal-50/40 dark:border-teal-900/40 dark:bg-teal-950/30",
      score: "text-accent",
      ring: "#0f766e",
      track: "#ccfbf1",
      message: "Bom resultado — ainda há espaço para fortalecer a reserva.",
    }
  }
  if (value.includes("regular") || score >= 45) {
    return {
      label: rating,
      badge: "bg-amber-50 text-warning dark:bg-amber-950/40",
      soft: "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/30",
      score: "text-warning",
      ring: "#d97706",
      track: "#fef3c7",
      message: "Situação regular. Priorize reduzir gastos e dívidas.",
    }
  }
  return {
    label: rating,
    badge: "bg-red-50 text-danger dark:bg-red-950/40",
    soft: "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/30",
    score: "text-danger",
    ring: "#dc2626",
    track: "#fee2e2",
    message: "Atenção: foque em estabilidade financeira este mês.",
  }
}

const dimensionStatus = (pct: number) => {
  if (pct >= 80) {
    return { label: "Forte", className: "bg-emerald-50 text-success dark:bg-emerald-950/40", bar: "bg-emerald-500" }
  }
  if (pct >= 55) {
    return { label: "Ok", className: "bg-teal-50 text-accent dark:bg-teal-950/40", bar: "bg-accent" }
  }
  if (pct >= 35) {
    return { label: "Frágil", className: "bg-amber-50 text-warning dark:bg-amber-950/40", bar: "bg-amber-400" }
  }
  return { label: "Crítico", className: "bg-red-50 text-danger dark:bg-red-950/40", bar: "bg-danger" }
}

const ScoreRing = ({
  score,
  color,
  track,
}: {
  score: number
  color: string
  track: string
}) => {
  const size = 148
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative mx-auto h-[148px] w-[148px]">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          {score}
        </p>
        <p className="text-xs text-muted">de 100</p>
      </div>
    </div>
  )
}

const InsightsPage = async ({ searchParams }: InsightsPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year

  if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) {
    redirect(`/financeiro/insights?month=${current.month}&year=${current.year}`)
  }

  try {
    const [score, insights] = await Promise.all([
      getFinancialScore(),
      getSpendingInsights(month, year),
    ])

    const tone = ratingTone(score.rating, score.score)
    const spendingDelta =
      insights.averageMonthlySpending > 0
        ? Math.round(
            ((insights.currentMonthSpending - insights.averageMonthlySpending) /
              insights.averageMonthlySpending) *
              100
          )
        : 0
    const monthLabel = formatMonthLabel(month, year)
    const tips = [...new Set([...score.tips, ...insights.tips])]
    const isCurrentMonth =
      month === current.month && year === current.year

    const dimensions = [
      {
        key: "income",
        label: "Renda",
        item: score.breakdown.income,
        href: "/financeiro/receitas-fixas",
        action: "Ajustar receitas",
      },
      {
        key: "expenses",
        label: "Gastos",
        item: score.breakdown.expenses,
        href: "/financeiro/orcamento",
        action: "Ver orçamento",
      },
      {
        key: "debts",
        label: "Dívidas",
        item: score.breakdown.debts,
        href: "/financeiro/dividas",
        action: "Ver dívidas",
      },
      {
        key: "reserve",
        label: "Reserva",
        item: score.breakdown.reserve,
        href: "/financeiro/caixinhas",
        action: "Fortalecer reserva",
      },
    ] as const

    const weakest = [...dimensions]
      .map((item) => ({
        ...item,
        pct: Math.round((item.item.score / item.item.maxScore) * 100),
      }))
      .sort((a, b) => a.pct - b.pct)[0]

    const composition = [
      {
        label: "Variáveis",
        current: insights.currentBreakdown.variable,
        average: insights.averageBreakdown.variable,
      },
      {
        label: "Contas fixas",
        current: insights.currentBreakdown.recurring,
        average: insights.averageBreakdown.recurring,
      },
      {
        label: "Parcelas",
        current: insights.currentBreakdown.installments,
        average: insights.averageBreakdown.installments,
      },
      {
        label: "Gastos previstos",
        current: insights.currentBreakdown.plannedExpenses ?? 0,
        average: insights.averageBreakdown.plannedExpenses ?? 0,
      },
    ]
    const compositionMax = Math.max(
      ...composition.flatMap((row) => [row.current, row.average]),
      1
    )

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  {isCurrentMonth ? "Este mês" : monthLabel}
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Insights
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Leitura automática da sua saúde financeira, com foco no que
                  melhorar agora.
                </p>
              </div>

              <Suspense
                fallback={<div className="text-sm text-slate-300">Carregando...</div>}
              >
                <div className="rounded-xl bg-white/10 p-1 backdrop-blur">
                  <MonthYearFilter
                    month={month}
                    year={year}
                    basePath="/financeiro/insights"
                  />
                </div>
              </Suspense>
            </div>

            <div className="relative mt-7 grid gap-5 lg:grid-cols-[auto_1.2fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <ScoreRing
                  score={score.score}
                  color={tone.ring}
                  track="rgba(255,255,255,0.12)"
                />
                <div className="mt-4 text-center">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
                  >
                    {tone.label}
                  </span>
                  <p className="mt-3 text-sm text-slate-300">{tone.message}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {dimensions.map((dimension) => {
                  const pct = Math.round(
                    (dimension.item.score / dimension.item.maxScore) * 100
                  )
                  const status = dimensionStatus(pct)
                  return (
                    <article
                      key={dimension.key}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-slate-300">{dimension.label}</p>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                        {dimension.item.score.toFixed(0)}
                        <span className="text-base font-medium text-slate-400">
                          /{dimension.item.maxScore}
                        </span>
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${status.bar}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                        {dimension.item.description}
                      </p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm shadow-slate-200/30">
            <p className="text-sm text-muted">Gasto em {monthLabel}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
              {formatCurrency(insights.currentMonthSpending)}
            </p>
            <p className="mt-1 text-xs text-muted">
              média {formatCurrency(insights.averageMonthlySpending)}
            </p>
          </article>
          <article
            className={`rounded-2xl border p-4 shadow-sm shadow-slate-200/30 ${
              spendingDelta > 5
                ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/30"
                : spendingDelta < -5
                  ? "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                  : "border-border/80 bg-surface"
            }`}
          >
            <p className="text-sm text-muted">Vs média</p>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
                spendingDelta > 5
                  ? "text-warning"
                  : spendingDelta < -5
                    ? "text-success"
                    : "text-foreground"
              }`}
            >
              {spendingDelta > 0 ? "+" : ""}
              {spendingDelta}%
            </p>
            <p className="mt-1 text-xs text-muted">
              {insights.monthsAnalyzed} mês(es) na análise
            </p>
          </article>
          <article
            className={`rounded-2xl border p-4 shadow-sm shadow-slate-200/30 ${
              insights.categoryAlerts.length > 0
                ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/30"
                : "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/30"
            }`}
          >
            <p className="text-sm text-muted">Alertas</p>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
                insights.categoryAlerts.length > 0
                  ? "text-warning"
                  : "text-success"
              }`}
            >
              {insights.categoryAlerts.length}
            </p>
            <p className="mt-1 text-xs text-muted">categorias acima da média</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm shadow-slate-200/30 ${tone.soft}`}>
            <p className="text-sm text-muted">Ponto mais frágil</p>
            <p className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${tone.score}`}>
              {weakest.label}
            </p>
            <Link
              href={weakest.href}
              className="mt-1 inline-flex text-xs font-semibold text-accent hover:underline"
            >
              {weakest.action}
            </Link>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">O que observamos</h2>
              <p className="text-sm text-muted">
                Leituras automáticas de {monthLabel}
              </p>
            </div>
            <ul className="space-y-2 p-4">
              {insights.insights.length === 0 ? (
                <li className="rounded-xl bg-background px-4 py-10 text-center">
                  <p className="font-semibold">Ainda sem leituras suficientes</p>
                  <p className="mt-1 text-sm text-muted">
                    Continue lançando gastos no extrato para gerar insights.
                  </p>
                  <Link
                    href="/financeiro/extrato"
                    className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
                  >
                    Ir para o extrato
                  </Link>
                </li>
              ) : (
                insights.insights.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-xl border border-border/80 bg-background/60 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed">{item}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold">Próximos passos</h2>
                <p className="text-sm text-muted">Ações sugeridas pelo score</p>
              </div>
              <div className="space-y-2 p-4">
                {tips.length === 0 ? (
                  <p className="rounded-xl bg-background px-4 py-8 text-center text-sm text-muted">
                    Nenhuma dica no momento.
                  </p>
                ) : (
                  tips.slice(0, 5).map((tip, index) => (
                    <div
                      key={tip}
                      className="rounded-xl border border-teal-200/60 bg-teal-50/30 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/30"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                        Dica {index + 1}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Atalhos úteis</h2>
              <div className="mt-3 grid gap-2">
                {[
                  { href: "/financeiro/caixinhas", label: "Caixinhas", hint: "Guardar e reservar" },
                  { href: "/financeiro/orcamento", label: "Orçamento", hint: "Limitar categorias" },
                  { href: "/financeiro/parcelas", label: "A pagar", hint: "Quitar pendências" },
                  { href: "/financeiro/relatorios", label: "Relatórios", hint: "Ver tendência" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2.5 transition hover:border-accent/30 hover:bg-accent-soft/40"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block text-xs text-muted">{item.hint}</span>
                    </span>
                    <span className="text-sm text-accent">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Composição do gasto</h2>
              <p className="mt-1 text-sm text-muted">
                Este mês vs média estimada
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {composition.map((row) => {
              const delta =
                row.average > 0
                  ? Math.round(((row.current - row.average) / row.average) * 100)
                  : 0
              return (
                <div key={row.label}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-sm text-muted">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(row.current)}
                      </span>
                      {" · média "}
                      {formatCurrency(row.average)}
                      {row.average > 0 ? (
                        <span
                          className={`ml-2 font-semibold ${
                            delta > 5
                              ? "text-warning"
                              : delta < -5
                                ? "text-success"
                                : "text-muted"
                          }`}
                        >
                          ({delta > 0 ? "+" : ""}
                          {delta}%)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[11px] text-muted">Atual</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${Math.max(
                              (row.current / compositionMax) * 100,
                              row.current ? 3 : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[11px] text-muted">Média</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-slate-400"
                          style={{
                            width: `${Math.max(
                              (row.average / compositionMax) * 100,
                              row.average ? 3 : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Categorias em alta</h2>
            <p className="text-sm text-muted">
              Onde o gasto está acima da média recente
            </p>
          </div>

          <div className="p-4">
            {insights.categoryAlerts.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-10 text-center dark:bg-emerald-950/40">
                <p className="font-semibold text-success">
                  Nenhuma categoria disparada
                </p>
                <p className="mt-1 text-sm text-muted">
                  Seus gastos por categoria estão estáveis em relação à média.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {insights.categoryAlerts.map((alert) => {
                  const max = Math.max(alert.currentSpent, alert.averageSpent, 1)
                  return (
                    <article
                      key={alert.categoryId}
                      className="rounded-2xl border border-amber-200/70 bg-amber-50/30 p-4 dark:border-amber-900/40 dark:bg-amber-950/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{alert.categoryTitle}</h3>
                          <p className="mt-1 text-sm text-muted">{alert.message}</p>
                        </div>
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-warning dark:bg-amber-900/40">
                          +{alert.percentageIncrease}%
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted">
                            <span>Este mês</span>
                            <span>{formatCurrency(alert.currentSpent)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-900/50">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{
                                width: `${(alert.currentSpent / max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted">
                            <span>Média</span>
                            <span>{formatCurrency(alert.averageSpent)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-900/50">
                            <div
                              className="h-full rounded-full bg-slate-400"
                              style={{
                                width: `${(alert.averageSpent / max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
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

export default InsightsPage
