import { redirect } from "next/navigation"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { IconJournal } from "@/components/icons"
import { JournalEditor } from "@/components/journal-editor"
import { JournalEntryCard } from "@/components/journal-entry-card"
import { JournalSearch } from "@/components/journal-search"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ApiError } from "@/lib/api-server"
import { formatDateKey, getCurrentMonthYear } from "@/lib/format"
import { getJournalEntries, getJournalEntry } from "@/lib/finance-api"
import { htmlToPlainText } from "@/lib/html-text"
import { getMoodOption } from "@/lib/journal-mood"
import type { JournalReportPdfData } from "@/lib/journal-report-pdf"

type DiarioPageProps = {
  searchParams: Promise<{
    month?: string
    year?: string
    date?: string
    search?: string
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

const todayKey = () => new Date().toISOString().slice(0, 10)

const isValidDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const DiarioPage = async ({ searchParams }: DiarioPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const search = params.search?.trim() ?? ""
  const targetDate =
    params.date && isValidDateKey(params.date) ? params.date : todayKey()

  if (
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isFinite(year) ||
    year < 2000 ||
    year > 2100
  ) {
    redirect(`/diario?month=${current.month}&year=${current.year}`)
  }

  try {
    const [entries, targetEntry] = await Promise.all([
      getJournalEntries(month, year, search || undefined),
      getJournalEntry(targetDate),
    ])

    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
    const isToday = targetDate === todayKey()
    const moodCounts = entries.reduce<Record<number, number>>((acc, entry) => {
      if (entry.mood) acc[entry.mood] = (acc[entry.mood] ?? 0) + 1
      return acc
    }, {})
    const bestMoodValue = Object.entries(moodCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0]
    const bestMood = bestMoodValue ? getMoodOption(Number(bestMoodValue)) : null

    const buildHref = (date: string) => {
      const p = new URLSearchParams()
      p.set("month", String(month))
      p.set("year", String(year))
      if (search) p.set("search", search)
      p.set("date", date)
      return `/diario?${p.toString()}`
    }

    const csvHeaders = ["Data", "Humor", "Conteúdo"]
    const csvRows = entries.map((entry) => [
      formatDateKey(entry.date),
      getMoodOption(entry.mood)?.label ?? "",
      htmlToPlainText(entry.content),
    ])

    const journalReportData: JournalReportPdfData = {
      monthLabel,
      entries: [...entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => {
          return {
            date: entry.date,
            moodLabel: getMoodOption(entry.mood)?.label ?? null,
            content: entry.content,
          }
        }),
    }

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200/90">
                Vida pessoal
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Diário
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Uma entrada por dia. Escreva como foi, marque o humor e volte
                quando quiser reler.
              </p>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3 sm:max-w-sm">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Entradas</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {entries.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">em {monthLabel}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Humor frequente</p>
                <p className="mt-2 text-xl sm:text-2xl">
                  {bestMood ? `${bestMood.emoji}` : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {bestMood?.label ?? "sem registros"}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Entradas</h2>
                  <p className="text-sm text-muted">{monthLabel}</p>
                </div>
                <MonthYearFilter month={month} year={year} basePath="/diario" />
              </div>

              <div className="space-y-3 p-3 md:p-4">
                <JournalSearch basePath="/diario" initialValue={search} />

                {entries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background px-6 py-14 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <IconJournal className="h-6 w-6" />
                    </span>
                    <p className="mt-4 font-semibold">
                      {search
                        ? "Nenhuma entrada encontrada"
                        : "Nenhuma entrada ainda"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                      {search
                        ? "Tente outro termo de busca."
                        : "Escreva sua primeira entrada ao lado."}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {entries.map((entry) => (
                      <JournalEntryCard
                        key={entry.id}
                        entry={entry}
                        href={buildHref(entry.date)}
                        active={entry.date === targetDate}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 md:px-6">
                <p className="text-sm text-muted">
                  Exporte as entradas de {monthLabel}.
                </p>
                <ExportDataButtons
                  filename={`diario-${year}-${String(month).padStart(2, "0")}`}
                  title={`Diário — ${monthLabel}`}
                  subtitle="Entradas do mês"
                  headers={csvHeaders}
                  rows={csvRows}
                  journalReportData={journalReportData}
                  csvLabel="Exportar CSV"
                  pdfLabel="Exportar PDF"
                />
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <JournalEditor
                date={targetDate}
                dateLabel={formatDateKey(targetDate)}
                isToday={isToday}
                initialContent={targetEntry?.content ?? ""}
                initialMood={targetEntry?.mood ?? null}
                hasEntry={Boolean(targetEntry)}
              />
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

export default DiarioPage
