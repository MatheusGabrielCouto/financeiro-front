import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { IconFlame, IconRoutine } from "@/components/icons"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { RoutineAdherenceList } from "@/components/routine-adherence-list"
import { RoutineCheckToggle } from "@/components/routine-check-toggle"
import { RoutineForm } from "@/components/routine-form"
import { RoutineMonthGrid } from "@/components/routine-month-grid"
import { RoutineWeekdayChips } from "@/components/routine-weekday-chips"
import { ApiError } from "@/lib/api-server"
import { getCurrentMonthYear } from "@/lib/format"
import { getRoutines, getRoutineOverview, getTodayRoutines } from "@/lib/finance-api"
import { getRoutineColor } from "@/lib/routine-colors"
import type { RoutineReportPdfData } from "@/lib/routine-report-pdf"
import type { Routine, RoutineOverviewItem, RoutineToday } from "@/lib/types"

type RotinasPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>
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

const TodayRing = ({ done, total }: { done: number; total: number }) => {
  const size = 84
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total === 0 ? 0 : Math.min(done / total, 1)
  const offset = circumference - pct * circumference
  const complete = total > 0 && done === total

  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={complete ? "#5eead4" : "#2dd4bf"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={total === 0 ? circumference : offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold tabular-nums text-white">
          {done}/{total}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-teal-200/80">
          hoje
        </span>
      </div>
    </div>
  )
}

const TodayCard = ({
  item,
  streak,
}: {
  item: RoutineToday
  streak: number
}) => {
  const palette = getRoutineColor(item.color)

  return (
    <li
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
        item.checkedToday
          ? `${palette.bg} border-transparent`
          : "border-border/80 bg-background/50"
      }`}
    >
      <RoutineCheckToggle
        id={item.id}
        date={item.date}
        checked={item.checkedToday}
        color={item.color}
        ariaLabel={
          item.checkedToday
            ? `Desmarcar ${item.title} de hoje`
            : `Marcar ${item.title} como feito hoje`
        }
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.title}</p>
        {item.notes ? (
          <p className="truncate text-xs text-muted">{item.notes}</p>
        ) : null}
      </div>

      {streak > 0 ? (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-warning shadow-sm dark:bg-black/20"
          title={`Sequência atual: ${streak} dia(s)`}
        >
          <IconFlame className="h-3.5 w-3.5" />
          {streak}
        </span>
      ) : null}
    </li>
  )
}

const ManageRow = ({ item }: { item: Routine }) => {
  const palette = getRoutineColor(item.color)
  const isArchived = Boolean(item.archivedAt)

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
        isArchived ? "border-border/60 opacity-70" : "border-border/80"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.from} ${palette.to} text-xs font-bold text-white`}
        >
          {item.title.trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <div className="mt-1">
            <RoutineWeekdayChips weekdays={item.weekdays} color={item.color} size="xs" />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isArchived ? (
          <ProxyActionButton
            path={`/routine/${item.id}/restore`}
            method="POST"
            label="Reativar"
            loadingLabel="Reativando..."
            variant="ghost"
            ariaLabel={`Reativar rotina ${item.title}`}
          />
        ) : (
          <ProxyActionButton
            path={`/routine/${item.id}/archive`}
            method="POST"
            label="Pausar"
            loadingLabel="Pausando..."
            variant="ghost"
            ariaLabel={`Pausar rotina ${item.title}`}
          />
        )}
        <ProxyActionButton
          path={`/routine/${item.id}`}
          method="DELETE"
          label="Excluir"
          loadingLabel="Excluindo..."
          confirmTitle="Excluir rotina"
          confirmMessage={`Excluir "${item.title}" e todo o histórico de check-ins?`}
          variant="danger"
          ariaLabel={`Excluir rotina ${item.title}`}
        />
      </div>
    </li>
  )
}

const RotinasPage = async ({ searchParams }: RotinasPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year

  if (
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isFinite(year) ||
    year < 2000 ||
    year > 2100
  ) {
    redirect(`/pessoal/rotinas?month=${current.month}&year=${current.year}`)
  }

  try {
    const [todayRoutines, allRoutines, overview] = await Promise.all([
      getTodayRoutines(),
      getRoutines({ includeArchived: true }),
      getRoutineOverview(month, year),
    ])

    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
    const activeList = allRoutines.filter((item) => !item.archivedAt)
    const archivedList = allRoutines.filter((item) => item.archivedAt)
    const streakById = new Map<string, RoutineOverviewItem>(
      overview.routines.map((item) => [item.id, item])
    )

    const doneToday = todayRoutines.filter((item) => item.checkedToday).length
    const totalToday = todayRoutines.length

    const csvHeaders = [
      "Rotina",
      "Dias esperados",
      "Dias concluídos",
      "Adesão (%)",
      "Sequência atual",
      "Melhor sequência",
    ]
    const csvRows = overview.routines.map((item) => [
      item.title,
      item.expectedDays,
      item.completedDays,
      item.adherencePct,
      item.currentStreak,
      item.bestStreak,
    ])

    const routineReportData: RoutineReportPdfData = {
      monthLabel,
      month,
      year,
      summary: {
        activeRoutines: overview.activeRoutines,
        overallAdherencePct: overview.overallAdherencePct,
        perfectDays: overview.perfectDays,
        bestCurrentStreak: overview.bestCurrentStreak,
      },
      routines: overview.routines.map((item) => ({
        title: item.title,
        color: item.color,
        expectedDays: item.expectedDays,
        completedDays: item.completedDays,
        adherencePct: item.adherencePct,
        currentStreak: item.currentStreak,
        bestStreak: item.bestStreak,
      })),
      dailySeries: overview.dailySeries,
    }

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                Hábitos
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Rotinas
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Crie suas rotinas, marque o check todo dia e acompanhe a
                adesão do mês.
              </p>
            </div>

            <div className="relative mt-7 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex justify-center sm:justify-start">
                <TodayRing done={doneToday} total={totalToday} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs text-slate-300 sm:text-sm">Adesão</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                    {overview.overallAdherencePct}%
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-teal-300"
                      style={{
                        width: `${Math.min(overview.overallAdherencePct, 100)}%`,
                      }}
                    />
                  </div>
                </article>
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs text-slate-300 sm:text-sm">Perfeitos</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                    {overview.perfectDays}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">dias no mês</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs text-slate-300 sm:text-sm">Sequência</p>
                  <p className="mt-2 flex items-center gap-1 font-[family-name:var(--font-display)] text-xl font-semibold text-teal-200 sm:text-2xl">
                    <IconFlame className="h-4 w-4" />
                    {overview.bestCurrentStreak}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">melhor atual</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            {allRoutines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-surface px-6 py-14 text-center shadow-sm shadow-slate-200/40">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <IconRoutine className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold">Crie sua primeira rotina</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Estudo, exercício, leitura — o que for, cadastre ao lado e
                  volte todo dia pra marcar o check.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold">Hoje</h2>
                    <p className="text-sm text-muted">
                      Rotinas agendadas para hoje
                    </p>
                  </div>
                  <div className="p-3 md:p-4">
                    {todayRoutines.length === 0 ? (
                      <div className="rounded-xl bg-background px-4 py-10 text-center">
                        <p className="font-medium">Nada agendado pra hoje</p>
                        <p className="mt-1 text-sm text-muted">
                          Suas outras rotinas voltam nos dias certos.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {todayRoutines.map((item) => (
                          <TodayCard
                            key={item.id}
                            item={item}
                            streak={streakById.get(item.id)?.currentStreak ?? 0}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold">Suas rotinas</h2>
                    <p className="text-sm text-muted">
                      {activeList.length} ativa(s)
                      {archivedList.length > 0
                        ? `, ${archivedList.length} pausada(s)`
                        : ""}
                    </p>
                  </div>
                  <div className="space-y-4 p-3 md:p-4">
                    {activeList.length > 0 ? (
                      <ul className="space-y-3">
                        {activeList.map((item) => (
                          <ManageRow key={item.id} item={item} />
                        ))}
                      </ul>
                    ) : null}

                    {archivedList.length > 0 ? (
                      <div>
                        <h3 className="mb-2 px-1 text-sm font-semibold text-muted">
                          Pausadas ({archivedList.length})
                        </h3>
                        <ul className="space-y-3">
                          {archivedList.map((item) => (
                            <ManageRow key={item.id} item={item} />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Nova rotina</h2>
              <p className="mt-1 text-sm text-muted">
                Escolha os dias da semana em que ela é esperada.
              </p>
              <div className="mt-4">
                <RoutineForm />
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Painel mensal</h2>
              <p className="text-sm text-muted">{monthLabel}</p>
            </div>
            <Suspense
              fallback={
                <div className="rounded-xl bg-background px-4 py-3 text-sm text-muted">
                  Carregando período...
                </div>
              }
            >
              <MonthYearFilter month={month} year={year} basePath="/pessoal/rotinas" />
            </Suspense>
          </div>

          <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted">
                Adesão por rotina
              </h3>
              <RoutineAdherenceList routines={overview.routines} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted">
                Mapa do mês
              </h3>
              <RoutineMonthGrid
                month={month}
                year={year}
                dailySeries={overview.dailySeries}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 md:px-6">
            <p className="text-sm text-muted">
              Exporte o relatório de {monthLabel} para acompanhar fora do
              dashboard.
            </p>
            <ExportDataButtons
              filename={`rotinas-${year}-${String(month).padStart(2, "0")}`}
              title={`Rotinas — ${monthLabel}`}
              subtitle="Adesão e sequência por rotina"
              headers={csvHeaders}
              rows={csvRows}
              routineReportData={routineReportData}
              csvLabel="Exportar CSV"
              pdfLabel="Exportar PDF"
            />
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

export default RotinasPage
