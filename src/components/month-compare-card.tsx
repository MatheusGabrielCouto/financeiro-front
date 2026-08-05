import Link from "next/link"
import {
  buildMonthCompareMetrics,
  buildTopCategoryCompare,
  getDeltaPercent,
  isDeltaPositive,
  type CategoryCompare,
  type CompareMetric,
} from "@/lib/month-compare"
import { formatCurrency, formatMonthLabel } from "@/lib/format"
import type { MonthDetails } from "@/lib/types"

type MonthCompareCardProps = {
  current: MonthDetails
  previous: MonthDetails
  currentMonth: number
  currentYear: number
  previousMonth: number
  previousYear: number
  variant?: "home" | "reports"
}

const formatDelta = (delta: number | null) => {
  if (delta == null) return "novo"
  if (delta === 0) return "0%"
  const abs = Math.abs(delta)
  const rounded = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)
  return `${delta > 0 ? "+" : "−"}${rounded}%`
}

const DeltaBadge = ({
  metric,
}: {
  metric: Pick<CompareMetric, "current" | "previous" | "lowerIsBetter">
}) => {
  const delta = getDeltaPercent(metric.current, metric.previous)
  const positive = isDeltaPositive(delta, metric.lowerIsBetter)
  const tone =
    positive == null
      ? "bg-slate-100 text-slate-600"
      : positive
        ? "bg-emerald-50 text-success"
        : "bg-red-50 text-danger"

  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {formatDelta(delta)}
    </span>
  )
}

const MetricRow = ({ metric }: { metric: CompareMetric }) => (
  <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-muted">{metric.label}</p>
      <DeltaBadge metric={metric} />
    </div>
    <div className="mt-2 flex items-end justify-between gap-2">
      <p className="font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums">
        {formatCurrency(metric.current)}
      </p>
      <p className="text-xs text-muted tabular-nums">
        ant. {formatCurrency(metric.previous)}
      </p>
    </div>
  </div>
)

const CategoryRow = ({ item }: { item: CategoryCompare }) => {
  const delta = getDeltaPercent(item.current, item.previous)
  const positive = isDeltaPositive(delta, true)

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted tabular-nums">
          {formatCurrency(item.current)} · ant. {formatCurrency(item.previous)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
          positive == null
            ? "bg-slate-100 text-slate-600"
            : positive
              ? "bg-emerald-50 text-success"
              : "bg-red-50 text-danger"
        }`}
      >
        {formatDelta(delta)}
      </span>
    </li>
  )
}

export const MonthCompareCard = ({
  current,
  previous,
  currentMonth,
  currentYear,
  previousMonth,
  previousYear,
  variant = "home",
}: MonthCompareCardProps) => {
  const metrics = buildMonthCompareMetrics(current, previous)
  const topCategories = buildTopCategoryCompare(
    current.expensesByCategory,
    previous.expensesByCategory,
    3
  )
  const currentLabel = formatMonthLabel(currentMonth, currentYear)
  const previousLabel = formatMonthLabel(previousMonth, previousYear)
  const isHome = variant === "home"

  return (
    <section
      className={`rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40 ${
        isHome ? "p-5" : "p-5 md:p-6"
      }`}
      aria-label={`Comparativo ${currentLabel} versus ${previousLabel}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Comparativo
          </p>
          <h2
            className={`mt-1 font-semibold ${
              isHome
                ? "text-base"
                : "font-[family-name:var(--font-display)] text-xl md:text-2xl"
            }`}
          >
            {currentLabel} vs {previousLabel}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Receita, saídas, sobra e top categorias em relação ao mês passado.
          </p>
        </div>
        {isHome ? (
          <Link
            href="/relatorios"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50"
            aria-label="Abrir relatórios"
          >
            Relatórios
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <MetricRow key={metric.id} metric={metric} />
        ))}
      </div>

      {topCategories.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">Top categorias (gasto)</p>
          <ul className="mt-2 space-y-2">
            {topCategories.map((item) => (
              <CategoryRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Sem gastos por categoria neste mês para comparar.
        </p>
      )}
    </section>
  )
}
