import { redirect } from "next/navigation"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { IconStudy } from "@/components/icons"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { StudySubjectCard } from "@/components/study-subject-card"
import { StudySubjectForm } from "@/components/study-subject-form"
import { ApiError } from "@/lib/api-server"
import { getStudySessions, getStudySubjects } from "@/lib/finance-api"
import { computeStudyStreak } from "@/lib/study-streak"

const EstudosPage = async () => {
  try {
    const subjects = await getStudySubjects({ includeArchived: true })
    const sessionsBySubject = await Promise.all(
      subjects.map((subject) => getStudySessions(subject.id))
    )

    const activeSubjects = subjects.filter((subject) => !subject.archivedAt)
    const totalWeekHours =
      Math.round((subjects.reduce((sum, subject) => sum + subject.weekMinutes, 0) / 60) * 10) /
      10
    const avgProgress =
      activeSubjects.length === 0
        ? 0
        : Math.round(
            activeSubjects.reduce((sum, subject) => sum + subject.weekProgressPct, 0) /
              activeSubjects.length
          )
    const archivedSubjects = subjects.filter((subject) => subject.archivedAt)
    const streak = computeStudyStreak(sessionsBySubject.flat().map((session) => session.date))

    const sessionsById = new Map(
      subjects.map((subject, index) => [subject.id, sessionsBySubject[index]])
    )

    const csvHeaders = ["Matéria", "Meta semanal (h)", "Horas na semana", "Progresso (%)"]
    const csvRows = subjects.map((subject) => [
      subject.title,
      subject.weeklyGoalHours,
      Math.round((subject.weekMinutes / 60) * 10) / 10,
      subject.weekProgressPct,
    ])

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                Vida pessoal
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Estudos
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Estudo por conta própria, no seu ritmo — acompanhe horas por
                matéria, o que praticou e use o Pomodoro para manter o foco.
              </p>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3 sm:max-w-lg sm:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Matérias ativas</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {activeSubjects.length}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Horas na semana</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {totalWeekHours}h
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Progresso médio</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {avgProgress}%
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Sequência</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {streak}d
                </p>
              </article>
            </div>
          </div>
        </section>

        <PomodoroTimer subjects={activeSubjects} />

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            {subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-surface px-6 py-14 text-center shadow-sm shadow-slate-200/40">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <IconStudy className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold">Crie sua primeira matéria</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Defina uma meta semanal de horas e comece a registrar suas
                  sessões de estudo.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">Suas matérias</h2>
                  <p className="text-sm text-muted">
                    {activeSubjects.length} ativa(s)
                    {archivedSubjects.length > 0
                      ? `, ${archivedSubjects.length} pausada(s)`
                      : ""}
                  </p>
                </div>
                <div className="space-y-4 p-3 md:p-4">
                  {activeSubjects.length > 0 ? (
                    <ul className="space-y-3">
                      {activeSubjects.map((subject) => (
                        <StudySubjectCard
                          key={subject.id}
                          subject={subject}
                          sessions={sessionsById.get(subject.id) ?? []}
                        />
                      ))}
                    </ul>
                  ) : null}

                  {archivedSubjects.length > 0 ? (
                    <div>
                      <h3 className="mb-2 px-1 text-sm font-semibold text-muted">
                        Pausadas ({archivedSubjects.length})
                      </h3>
                      <ul className="space-y-3">
                        {archivedSubjects.map((subject) => (
                          <StudySubjectCard
                            key={subject.id}
                            subject={subject}
                            sessions={sessionsById.get(subject.id) ?? []}
                          />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 md:px-6">
                  <p className="text-sm text-muted">
                    Exporte o progresso de todas as matérias.
                  </p>
                  <ExportDataButtons
                    filename="estudos"
                    title="Estudos"
                    subtitle="Progresso semanal por matéria"
                    headers={csvHeaders}
                    rows={csvRows}
                    csvLabel="Exportar CSV"
                    pdfLabel="Exportar PDF"
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Nova matéria</h2>
              <p className="mt-1 text-sm text-muted">
                Defina a meta semanal de horas — dá pra ajustar depois.
              </p>
              <div className="mt-4">
                <StudySubjectForm />
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

export default EstudosPage
