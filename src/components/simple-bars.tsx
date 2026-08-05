import { formatCurrency } from "@/lib/format"

type BarItem = {
  label: string
  value: number
  secondaryValue?: number
  hint?: string
}

type SimpleBarsProps = {
  items: BarItem[]
  mode?: "single" | "compare"
  valueLabel?: string
  secondaryLabel?: string
  color?: "accent" | "warning" | "success"
  showRank?: boolean
}

const barColorClass = {
  accent: "bg-accent",
  warning: "bg-amber-400",
  success: "bg-emerald-500",
}

export const SimpleBars = ({
  items,
  mode = "single",
  valueLabel = "Valor",
  secondaryLabel = "Secundário",
  color = "accent",
  showRank = false,
}: SimpleBarsProps) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-background px-4 py-12 text-center">
        <p className="font-medium">Sem dados neste período</p>
        <p className="mt-1 text-sm text-muted">
          Quando houver lançamentos, os gráficos aparecem aqui.
        </p>
      </div>
    )
  }

  const max = Math.max(
    ...items.flatMap((item) =>
      mode === "compare"
        ? [item.value, item.secondaryValue ?? 0]
        : [item.value]
    ),
    1
  )

  return (
    <div className="space-y-4" role="img" aria-label="Gráfico de barras">
      {mode === "compare" ? (
        <div className="flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            {valueLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            {secondaryLabel}
          </span>
        </div>
      ) : null}

      <ul className="space-y-3.5">
        {items.map((item, index) => {
          const primaryWidth = `${Math.max((item.value / max) * 100, 3)}%`
          const secondaryWidth = `${Math.max(
            ((item.secondaryValue ?? 0) / max) * 100,
            item.secondaryValue ? 3 : 0
          )}%`

          return (
            <li key={`${item.label}-${index}`} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  {showRank ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-muted">
                      {index + 1}
                    </span>
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {mode === "compare" ? (
                    <>
                      <span className="text-success">
                        {formatCurrency(item.value)}
                      </span>
                      {" / "}
                      <span className="text-warning">
                        {formatCurrency(item.secondaryValue ?? 0)}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.value)}
                    </span>
                  )}
                </span>
              </div>

              {item.hint ? (
                <p className="text-xs text-muted">{item.hint}</p>
              ) : null}

              <div className="space-y-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      mode === "compare" ? "bg-emerald-500" : barColorClass[color]
                    }`}
                    style={{ width: primaryWidth }}
                  />
                </div>
                {mode === "compare" ? (
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: secondaryWidth }}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type ColumnChartItem = {
  label: string
  value: number
  secondaryValue?: number
}

type ColumnChartProps = {
  items: ColumnChartItem[]
  valueLabel?: string
  secondaryLabel?: string
}

export const ColumnChart = ({
  items,
  valueLabel = "Receitas",
  secondaryLabel = "Despesas",
}: ColumnChartProps) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-background px-4 py-12 text-center">
        <p className="font-medium">Sem dados neste período</p>
      </div>
    )
  }

  const max = Math.max(
    ...items.flatMap((item) => [item.value, item.secondaryValue ?? 0]),
    1
  )

  return (
    <div role="img" aria-label="Gráfico de colunas mensal">
      <div className="mb-4 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          {valueLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          {secondaryLabel}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="flex h-52 min-w-full items-end gap-3"
          style={{ minWidth: `${Math.max(items.length * 4.5, 20)}rem` }}
        >
          {items.map((item) => {
            const incomeHeight = `${Math.max((item.value / max) * 100, item.value ? 4 : 0)}%`
            const expenseHeight = `${Math.max(
              ((item.secondaryValue ?? 0) / max) * 100,
              item.secondaryValue ? 4 : 0
            )}%`

            return (
              <div
                key={item.label}
                className="flex min-w-[3.25rem] flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t-md bg-emerald-500"
                    style={{ height: incomeHeight }}
                    title={`${valueLabel}: ${formatCurrency(item.value)}`}
                  />
                  <div
                    className="w-3 rounded-t-md bg-amber-400"
                    style={{ height: expenseHeight }}
                    title={`${secondaryLabel}: ${formatCurrency(item.secondaryValue ?? 0)}`}
                  />
                </div>
                <p className="text-center text-[11px] font-medium text-muted">
                  {item.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
