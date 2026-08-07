import type { RoutineDailySeriesItem } from "@/lib/types"

type RoutineMonthGridProps = {
  month: number
  year: number
  dailySeries: RoutineDailySeriesItem[]
}

const WEEKDAY_HEADERS = ["D", "S", "T", "Q", "Q", "S", "S"]

const pad = (value: number) => String(value).padStart(2, "0")

const intensityClass = (ratio: number | null) => {
  if (ratio === null) return "bg-slate-50 text-slate-300 dark:bg-white/5 dark:text-slate-600"
  if (ratio === 0) return "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
  if (ratio < 0.5) return "bg-accent/25 text-accent"
  if (ratio < 1) return "bg-accent/60 text-white"
  return "bg-accent text-white"
}

export const RoutineMonthGrid = ({
  month,
  year,
  dailySeries,
}: RoutineMonthGridProps) => {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const byDate = new Map(dailySeries.map((item) => [item.date, item]))
  const todayKey = new Date().toISOString().slice(0, 10)

  if (dailySeries.length === 0) {
    return (
      <div className="rounded-xl bg-background px-4 py-12 text-center">
        <p className="font-medium">Sem rotinas neste mês</p>
        <p className="mt-1 text-sm text-muted">
          Crie uma rotina e marque o check para ver o mapa do mês aqui.
        </p>
      </div>
    )
  }

  const cells: Array<{
    day: number | null
    ratio: number | null
    key: string
    title: string
  }> = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ day: null, ratio: null, key: "", title: "" })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${pad(month)}-${pad(day)}`
    const entry = byDate.get(key)

    if (!entry) {
      cells.push({
        day,
        ratio: null,
        key,
        title: `${pad(day)}/${pad(month)} — ainda não chegou`,
      })
      continue
    }

    const ratio = entry.expected === 0 ? null : entry.completed / entry.expected
    const title =
      entry.expected === 0
        ? `${pad(day)}/${pad(month)} — nenhuma rotina agendada`
        : `${pad(day)}/${pad(month)} — ${entry.completed}/${entry.expected} concluídas (${Math.round(
            (entry.completed / entry.expected) * 100
          )}%)`

    cells.push({ day, ratio, key, title })
  }

  return (
    <div role="img" aria-label={`Mapa de rotinas de ${pad(month)}/${year}`}>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_HEADERS.map((label, index) => (
          <div
            key={`header-${index}`}
            className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted"
          >
            {label}
          </div>
        ))}

        {cells.map((cell, index) => (
          <div
            key={`cell-${index}`}
            title={cell.title || undefined}
            className={`aspect-square rounded-lg text-xs font-semibold transition-colors ${
              cell.day === null
                ? ""
                : `flex items-center justify-center ${intensityClass(cell.ratio)} ${
                    cell.key === todayKey
                      ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                      : ""
                  }`
            }`}
          >
            {cell.day ?? ""}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
        <span>Menos</span>
        <span className="h-3 w-3 rounded-sm bg-slate-100 dark:bg-white/10" />
        <span className="h-3 w-3 rounded-sm bg-accent/25" />
        <span className="h-3 w-3 rounded-sm bg-accent/60" />
        <span className="h-3 w-3 rounded-sm bg-accent" />
        <span>Mais</span>
      </div>
    </div>
  )
}
