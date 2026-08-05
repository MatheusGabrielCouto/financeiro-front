import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ApiError } from "@/lib/api-server"
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import { getDetails, getInstallments } from "@/lib/finance-api"
import {
  buildPayableItems,
  dayKey,
  getPayableTone,
  payableItemHref,
  payableKindLabel,
  worstTone,
  type CalendarDueTone,
  type PayableItem,
} from "@/lib/payable-items"

type CalendarioPageProps = {
  searchParams: Promise<{
    month?: string
    year?: string
    day?: string
  }>
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const toneBar: Record<CalendarDueTone, string> = {
  paid: "bg-emerald-500",
  overdue: "bg-danger",
  today: "bg-amber-400",
  week: "bg-accent",
  later: "bg-slate-300",
}

const toneDot: Record<Exclude<CalendarDueTone, "paid">, string> = {
  overdue: "bg-danger",
  today: "bg-amber-400",
  week: "bg-accent",
  later: "bg-slate-300",
}

const toneBadge: Record<CalendarDueTone, string> = {
  paid: "bg-emerald-50 text-success dark:bg-emerald-950/40",
  overdue: "bg-red-50 text-danger dark:bg-red-950/40",
  today: "bg-amber-50 text-warning dark:bg-amber-950/40",
  week: "bg-teal-50 text-accent dark:bg-teal-950/40",
  later: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

const toneLabel: Record<CalendarDueTone, string> = {
  paid: "Pago",
  overdue: "Atrasado",
  today: "Hoje",
  week: "Em 7 dias",
  later: "No mês",
}

const buildDayHref = (month: number, year: number, day: number) =>
  `/calendario?month=${month}&year=${year}&day=${day}`

const weekdayLong = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date)

const CalendarioPage = async ({ searchParams }: CalendarioPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const daysInMonth = new Date(year, month, 0).getDate()
  const requestedDay = params.day ? Number(params.day) : NaN

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12
  ) {
    redirect(`/calendario?month=${current.month}&year=${current.year}`)
  }

  try {
    const [installments, details] = await Promise.all([
      getInstallments(month, year),
      getDetails(month, year),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const items = buildPayableItems({
      month,
      year,
      installments,
      details,
      today,
    })

    const byDay = new Map<string, PayableItem[]>()
    for (const item of items) {
      const key = dayKey(item.dueDate)
      const list = byDay.get(key) ?? []
      list.push(item)
      byDay.set(key, list)
    }

    const selectedDay =
      Number.isFinite(requestedDay) &&
      requestedDay >= 1 &&
      requestedDay <= daysInMonth
        ? requestedDay
        : today.getMonth() + 1 === month && today.getFullYear() === year
          ? today.getDate()
          : [...byDay.keys()]
              .map((key) => Number(key.slice(-2)))
              .sort((a, b) => a - b)[0] ?? 1

    const selectedDate = new Date(year, month - 1, selectedDay)
    selectedDate.setHours(0, 0, 0, 0)
    const selectedItems = byDay.get(dayKey(selectedDate)) ?? []
    const selectedPending = selectedItems.filter(
      (item) => item.status === "SCHEDULE"
    )
    const selectedPaid = selectedItems.filter((item) => item.status === "PAY")
    const selectedTotal = selectedPending.reduce(
      (sum, item) => sum + item.value,
      0
    )

    // Monday-first calendar grid
    const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const cells: Array<{
      day: number | null
      inMonth: boolean
      isToday: boolean
      isSelected: boolean
      isWeekend: boolean
      items: PayableItem[]
      tone: Exclude<CalendarDueTone, "paid"> | null
      pendingTotal: number
    }> = []

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({
        day: null,
        inMonth: false,
        isToday: false,
        isSelected: false,
        isWeekend: false,
        items: [],
        tone: null,
        pendingTotal: 0,
      })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day)
      date.setHours(0, 0, 0, 0)
      const dayItems = byDay.get(dayKey(date)) ?? []
      const tones = dayItems.map((item) => getPayableTone(item, today))
      const weekday = date.getDay()
      cells.push({
        day,
        inMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: day === selectedDay,
        isWeekend: weekday === 0 || weekday === 6,
        items: dayItems,
        tone: worstTone(tones),
        pendingTotal: dayItems
          .filter((item) => item.status === "SCHEDULE")
          .reduce((sum, item) => sum + item.value, 0),
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        day: null,
        inMonth: false,
        isToday: false,
        isSelected: false,
        isWeekend: false,
        items: [],
        tone: null,
        pendingTotal: 0,
      })
    }

    const monthLabel = formatMonthLabel(month, year)
    const pendingItems = items.filter((item) => item.status === "SCHEDULE")
    const pendingCount = pendingItems.length
    const overdueCount = items.filter((item) => item.isOverdue).length
    const pendingTotal = pendingItems.reduce((sum, item) => sum + item.value, 0)
    const isCurrentMonth =
      month === current.month && year === current.year
    const selectedWeekday = weekdayLong(selectedDate)

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  {isCurrentMonth ? "Vencimentos do mês" : "Período selecionado"}
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  {monthLabel}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Parcelas, contas fixas e previstos no calendário. Toque no dia
                  para ver o que vence.
                </p>
              </div>
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
                    basePath="/calendario"
                  />
                </div>
              </Suspense>
            </div>

            <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Pendentes</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-amber-200">
                  {pendingCount}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatCurrency(pendingTotal)} a pagar
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Atrasados</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-red-300">
                  {overdueCount}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {overdueCount === 0 ? "Nada atrasado" : "Pedem atenção"}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">No calendário</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
                  {items.length}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Inclui o que já foi pago
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4 md:px-5">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  Mês
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Densidade por dia · segunda a domingo
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" /> Atrasado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Hoje
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Em 7 dias
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Depois
                </span>
              </div>
            </div>

            <div className="p-3 md:p-4">
              <div className="mb-2 grid grid-cols-7 gap-1.5 px-0.5">
                {WEEKDAYS.map((label) => (
                  <p
                    key={label}
                    className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
                  >
                    {label}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, index) => {
                  if (!cell.inMonth || cell.day == null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[3.75rem] rounded-2xl bg-slate-50/40 dark:bg-slate-900/30 sm:min-h-[4.5rem]"
                        aria-hidden
                      />
                    )
                  }

                  const count = cell.items.length

                  return (
                    <Link
                      key={cell.day}
                      href={buildDayHref(month, year, cell.day)}
                      scroll={false}
                      aria-label={`Dia ${cell.day}, ${count} compromisso(s)`}
                      aria-current={cell.isSelected ? "date" : undefined}
                      tabIndex={0}
                      className={`group relative flex min-h-[3.75rem] flex-col rounded-2xl border p-2 transition duration-200 sm:min-h-[4.5rem] sm:p-2.5 ${
                        cell.isSelected
                          ? "border-accent/60 bg-teal-50/70 shadow-[0_0_0_1px_rgba(15,118,110,0.12)] dark:border-teal-500/40 dark:bg-teal-950/35"
                          : cell.isToday
                            ? "border-amber-300/70 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50/80 dark:border-amber-700/50 dark:bg-amber-950/25"
                            : cell.isWeekend
                              ? "border-transparent bg-slate-50/70 hover:border-border hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
                              : "border-transparent bg-background/70 hover:border-border hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition ${
                            cell.isSelected
                              ? "bg-accent text-white shadow-sm shadow-teal-900/20"
                              : cell.isToday
                                ? "bg-amber-400 text-slate-900"
                                : "text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                          }`}
                        >
                          {cell.day}
                        </span>
                        {count > 0 ? (
                          <span
                            className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                              cell.isSelected
                                ? "bg-accent/15 text-accent"
                                : "bg-slate-100 text-muted dark:bg-slate-800"
                            }`}
                          >
                            {count}
                          </span>
                        ) : null}
                      </div>

                      {count > 0 ? (
                        <div className="mt-auto flex items-center gap-1 pt-2">
                          {cell.items.slice(0, 4).map((item) => {
                            const tone = getPayableTone(item, today)
                            const color =
                              tone === "paid"
                                ? "bg-emerald-400/70"
                                : toneDot[tone]
                            return (
                              <span
                                key={item.id}
                                className={`h-1.5 w-1.5 rounded-full ${color}`}
                                aria-hidden
                              />
                            )
                          })}
                          {count > 4 ? (
                            <span className="text-[9px] font-medium text-muted">
                              +{count - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-auto pt-3">
                          <span className="block h-px w-3 bg-slate-200/70 dark:bg-slate-700" />
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40 xl:sticky xl:top-24 xl:self-start">
            <div className="relative border-b border-border/70 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-5 py-5 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Dia selecionado
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight capitalize">
                {selectedWeekday}
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {formatDate(selectedDate.toISOString())}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border/70 bg-surface/80 px-3 py-2.5">
                  <p className="text-[11px] text-muted">Pendente</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-warning">
                    {formatCurrency(selectedTotal)}
                  </p>
                  <p className="text-[11px] text-muted">
                    {selectedPending.length} item(ns)
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface/80 px-3 py-2.5">
                  <p className="text-[11px] text-muted">Já pago</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-success">
                    {selectedPaid.length}
                  </p>
                  <p className="text-[11px] text-muted">neste dia</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 md:p-4">
              {selectedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Dia livre
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Nada vence nesta data. Veja o que ainda falta no mês.
                  </p>
                  <Link
                    href={`/parcelas?month=${month}&year=${year}`}
                    className="mt-4 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    A pagar este mês
                  </Link>
                </div>
              ) : (
                selectedItems.map((item) => {
                  const tone = getPayableTone(item, today)
                  return (
                    <Link
                      key={item.id}
                      href={payableItemHref(item, month, year)}
                      aria-label={`Abrir ${item.title}`}
                      tabIndex={0}
                      className="group flex gap-3 rounded-2xl border border-border/70 bg-background/40 p-3.5 transition hover:border-accent/30 hover:bg-teal-50/40 dark:hover:bg-teal-950/20"
                    >
                      <span
                        className={`mt-1 h-10 w-1 shrink-0 rounded-full ${toneBar[tone]}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold group-hover:text-accent">
                                {item.title}
                              </h3>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${toneBadge[tone]}`}
                              >
                                {toneLabel[tone]}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted">
                              {payableKindLabel(item.kind)} · {item.subtitle}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold tabular-nums">
                            {formatCurrency(item.value)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            <div className="border-t border-border/70 px-5 py-4">
              <Link
                href={`/parcelas?month=${month}&year=${year}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover sm:w-auto"
              >
                Ir para pagamentos
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

export default CalendarioPage
