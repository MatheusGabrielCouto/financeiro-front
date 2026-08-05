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

const toneDot: Record<Exclude<CalendarDueTone, "paid">, string> = {
  overdue: "bg-danger",
  today: "bg-amber-400",
  week: "bg-accent",
  later: "bg-slate-300",
}

const toneBadge: Record<CalendarDueTone, string> = {
  paid: "bg-emerald-50 text-success",
  overdue: "bg-red-50 text-danger",
  today: "bg-amber-50 text-warning",
  week: "bg-teal-50 text-accent",
  later: "bg-slate-100 text-slate-600",
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
      items: PayableItem[]
      tone: Exclude<CalendarDueTone, "paid"> | null
    }> = []

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({
        day: null,
        inMonth: false,
        isToday: false,
        isSelected: false,
        items: [],
        tone: null,
      })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day)
      date.setHours(0, 0, 0, 0)
      const dayItems = byDay.get(dayKey(date)) ?? []
      const tones = dayItems.map((item) => getPayableTone(item, today))
      cells.push({
        day,
        inMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: day === selectedDay,
        items: dayItems,
        tone: worstTone(tones),
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        day: null,
        inMonth: false,
        isToday: false,
        isSelected: false,
        items: [],
        tone: null,
      })
    }

    const monthLabel = formatMonthLabel(month, year)
    const pendingCount = items.filter((item) => item.status === "SCHEDULE").length
    const overdueCount = items.filter((item) => item.isOverdue).length
    const isCurrentMonth =
      month === current.month && year === current.year

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {isCurrentMonth ? "Este mês" : "Período"}
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Calendário de {monthLabel}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Parcelas, contas fixas e previstos no mês — clique no dia para
                ver os detalhes.
              </p>
            </div>
            <Suspense
              fallback={<div className="text-sm text-muted">Carregando...</div>}
            >
              <MonthYearFilter
                month={month}
                year={year}
                basePath="/calendario"
              />
            </Suspense>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Compromissos no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {items.length}
              </p>
            </article>
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Pendentes</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {pendingCount}
              </p>
            </article>
            <article className="rounded-2xl border border-red-200/70 bg-red-50/40 p-4">
              <p className="text-sm text-muted">Atrasados</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-danger">
                {overdueCount}
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-border/80 bg-surface p-3 shadow-sm shadow-slate-200/40 md:p-5">
            <div className="mb-3 grid grid-cols-7 gap-1 px-1">
              {WEEKDAYS.map((label) => (
                <p
                  key={label}
                  className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
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
                      className="min-h-16 rounded-xl bg-slate-50/50 sm:min-h-20"
                      aria-hidden
                    />
                  )
                }

                const count = cell.items.length
                return (
                  <Link
                    key={cell.day}
                    href={buildDayHref(month, year, cell.day)}
                    aria-label={`Dia ${cell.day}, ${count} compromisso(s)`}
                    aria-current={cell.isSelected ? "date" : undefined}
                    className={`min-h-16 rounded-xl border p-2 transition sm:min-h-20 ${
                      cell.isSelected
                        ? "border-accent bg-teal-50/60 shadow-sm"
                        : cell.isToday
                          ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50"
                          : "border-border/70 bg-background/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-sm font-semibold ${
                          cell.isToday ? "text-warning" : "text-foreground"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.tone ? (
                        <span
                          className={`mt-1 h-2 w-2 rounded-full ${toneDot[cell.tone]}`}
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    {count > 0 ? (
                      <p className="mt-2 text-[11px] font-medium text-muted">
                        {count} item{count === 1 ? "" : "s"}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-slate-300">—</p>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 px-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-danger" /> Atrasado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Hoje
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> Em 7 dias
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" /> Depois
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40 xl:sticky xl:top-24 xl:self-start">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">
                {formatDate(selectedDate.toISOString())}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectedItems.length === 0
                  ? "Nenhum compromisso neste dia"
                  : `${selectedItems.length} item(ns) · ${formatCurrency(selectedTotal)} pendente(s)`}
              </p>
            </div>

            <div className="space-y-2 p-3 md:p-4">
              {selectedItems.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                  Escolha outro dia ou abra{" "}
                  <Link
                    href={`/parcelas?month=${month}&year=${year}`}
                    className="font-semibold text-accent hover:underline"
                  >
                    A pagar este mês
                  </Link>
                  .
                </div>
              ) : (
                selectedItems.map((item) => {
                  const tone = getPayableTone(item, today)
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold">
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
                        <p className="font-semibold tabular-nums">
                          {formatCurrency(item.value)}
                        </p>
                      </div>
                      <Link
                        href={payableItemHref(item, month, year)}
                        className="mt-3 inline-flex rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50"
                      >
                        Abrir
                      </Link>
                    </article>
                  )
                })
              )}
            </div>

            <div className="border-t border-border px-5 py-4">
              <Link
                href={`/parcelas?month=${month}&year=${year}`}
                className="inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
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
