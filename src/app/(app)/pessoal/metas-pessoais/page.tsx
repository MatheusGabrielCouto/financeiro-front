import { redirect } from "next/navigation"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { IconTarget } from "@/components/icons"
import { PersonalGoalCard } from "@/components/personal-goal-card"
import { PersonalGoalForm } from "@/components/personal-goal-form"
import { ApiError } from "@/lib/api-server"
import { getPersonalGoalEntries, getPersonalGoals } from "@/lib/finance-api"

const MetasPessoaisPage = async () => {
  try {
    const goals = await getPersonalGoals({ includeArchived: true })
    const entriesByGoal = await Promise.all(
      goals.map((goal) => getPersonalGoalEntries(goal.id))
    )

    const activeGoals = goals.filter((goal) => !goal.archivedAt)
    const archivedGoals = goals.filter((goal) => goal.archivedAt)
    const completedCount = goals.filter((goal) => goal.progressPct >= 100).length
    const avgProgress =
      activeGoals.length === 0
        ? 0
        : Math.round(
            activeGoals.reduce((sum, goal) => sum + goal.progressPct, 0) /
              activeGoals.length
          )

    const entriesById = new Map(goals.map((goal, index) => [goal.id, entriesByGoal[index]]))

    const csvHeaders = ["Meta", "Unidade", "Atual", "Alvo", "Progresso (%)"]
    const csvRows = goals.map((goal) => [
      goal.title,
      goal.unit,
      goal.current,
      goal.target,
      goal.progressPct,
    ])

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/90">
                Vida pessoal
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Metas pessoais
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Metas de progresso sem relação com dinheiro — livros, km,
                sessões, o que fizer sentido pra você.
              </p>
            </div>

            <div className="relative mt-7 grid grid-cols-3 gap-3 sm:max-w-md">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Ativas</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {activeGoals.length}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Progresso médio</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {avgProgress}%
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Concluídas</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {completedCount}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-surface px-6 py-14 text-center shadow-sm shadow-slate-200/40">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <IconTarget className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold">Crie sua primeira meta</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Ler livros, correr km, o que quiser medir — cadastre ao lado
                  e vá somando o progresso.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">Suas metas</h2>
                  <p className="text-sm text-muted">
                    {activeGoals.length} ativa(s)
                    {archivedGoals.length > 0
                      ? `, ${archivedGoals.length} pausada(s)`
                      : ""}
                  </p>
                </div>
                <div className="space-y-4 p-3 md:p-4">
                  {activeGoals.length > 0 ? (
                    <ul className="space-y-3">
                      {activeGoals.map((goal) => (
                        <PersonalGoalCard
                          key={goal.id}
                          goal={goal}
                          recentEntries={(entriesById.get(goal.id) ?? []).slice(0, 3)}
                        />
                      ))}
                    </ul>
                  ) : null}

                  {archivedGoals.length > 0 ? (
                    <div>
                      <h3 className="mb-2 px-1 text-sm font-semibold text-muted">
                        Pausadas ({archivedGoals.length})
                      </h3>
                      <ul className="space-y-3">
                        {archivedGoals.map((goal) => (
                          <PersonalGoalCard
                            key={goal.id}
                            goal={goal}
                            recentEntries={(entriesById.get(goal.id) ?? []).slice(0, 3)}
                          />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 md:px-6">
                  <p className="text-sm text-muted">
                    Exporte o progresso de todas as metas.
                  </p>
                  <ExportDataButtons
                    filename="metas-pessoais"
                    title="Metas pessoais"
                    subtitle="Progresso por meta"
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
              <h2 className="text-base font-semibold">Nova meta</h2>
              <p className="mt-1 text-sm text-muted">
                Escolha uma unidade livre pra medir o progresso.
              </p>
              <div className="mt-4">
                <PersonalGoalForm />
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

export default MetasPessoaisPage
