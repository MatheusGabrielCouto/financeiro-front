import Link from "next/link"
import { redirect } from "next/navigation"
import {
  CaixinhaMoveForm,
  CreateCaixinhaForm,
} from "@/components/caixinha-forms"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  getAmount,
  getEmergencyReserve,
  getFuturePurchaseProjections,
} from "@/lib/finance-api"

type CaixinhasPageProps = {
  searchParams: Promise<{ status?: string }>
}

const ProgressRing = ({
  progress,
  reached,
}: {
  progress: number
  reached: boolean
}) => {
  const size = 64
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const capped = Math.min(Math.max(progress, 0), 100)
  const offset = circumference - (capped / 100) * circumference
  const color = reached ? "#10b981" : "#0f766e"

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold tabular-nums">{capped}%</span>
      </div>
    </div>
  )
}

const CaixinhasPage = async ({ searchParams }: CaixinhasPageProps) => {
  const params = await searchParams
  const status = params.status ?? "todas"

  try {
    const [projections, reserve, amount] = await Promise.all([
      getFuturePurchaseProjections(),
      getEmergencyReserve(6),
      getAmount(),
    ])

    const totalSaved = projections.reduce((sum, item) => sum + item.valueAdded, 0)
    const totalGoals = projections.reduce((sum, item) => sum + item.value, 0)
    const reached = projections.filter((item) => item.isGoalReached).length
    const inProgress = projections.length - reached
    const overallProgress =
      totalGoals > 0 ? Math.round((totalSaved / totalGoals) * 100) : 0

    const filtered = projections
      .filter((item) => {
        if (status === "andamento") return !item.isGoalReached
        if (status === "concluidas") return item.isGoalReached
        return true
      })
      .sort((a, b) => {
        if (a.isGoalReached !== b.isGoalReached) {
          return a.isGoalReached ? 1 : -1
        }
        return (
          new Date(a.dateAcquisition).getTime() -
          new Date(b.dateAcquisition).getTime()
        )
      })

    const filterHref = (nextStatus: string) => {
      if (nextStatus === "todas") return "/caixinhas"
      return `/caixinhas?status=${nextStatus}`
    }

    const filters = [
      { id: "todas", label: "Todas" },
      { id: "andamento", label: "Em andamento" },
      { id: "concluidas", label: "Concluídas" },
    ]

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  Metas de economia
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Caixinhas
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Separe dinheiro do saldo livre para cada objetivo. Guardar
                  reserva o valor; retirar devolve ao saldo disponível.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/insights"
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Ver insights
                </Link>
              </div>
            </div>

            <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-300">Guardado</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {formatCurrency(totalSaved)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  de {formatCurrency(totalGoals)} em metas
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-300">Progresso</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {overallProgress}%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-teal-300"
                    style={{ width: `${Math.min(overallProgress, 100)}%` }}
                  />
                </div>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-300">Em andamento</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {inProgress}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {reached} concluída(s)
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-300">Saldo livre</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-teal-200">
                  {formatCurrency(amount.amount)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  disponível para guardar
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Reserva de emergência</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">{reserve.message}</p>
            </div>
            <p className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-accent">
              {reserve.progressPercent.toFixed(0)}% da meta
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-border/80 bg-background/60 p-3">
              <p className="text-xs text-muted">Saldo livre atual</p>
              <p className="mt-1 font-semibold">
                {formatCurrency(reserve.currentReserve)}
              </p>
            </article>
            <article className="rounded-xl border border-border/80 bg-background/60 p-3">
              <p className="text-xs text-muted">
                Recomendado ({reserve.monthsTarget} meses)
              </p>
              <p className="mt-1 font-semibold">
                {formatCurrency(reserve.recommendedReserve)}
              </p>
            </article>
            <article className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
              <p className="text-xs text-muted">Ainda falta</p>
              <p className="mt-1 font-semibold text-warning">
                {formatCurrency(reserve.missing)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                cobertura atual: {reserve.monthsCovered.toFixed(1)} mês(es)
              </p>
            </article>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${Math.min(reserve.progressPercent, 100)}%`,
              }}
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Suas caixinhas</h2>
                <p className="text-sm text-muted">
                  {filtered.length} de {projections.length} meta(s)
                </p>
              </div>
              <div
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1"
                role="group"
                aria-label="Filtrar caixinhas"
              >
                {filters.map((filter) => {
                  const isActive = status === filter.id
                  return (
                    <Link
                      key={filter.id}
                      href={filterHref(filter.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {filter.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {projections.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-14 text-center">
                  <p className="font-semibold">Nenhuma caixinha ainda</p>
                  <p className="mt-1 text-sm text-muted">
                    Crie sua primeira meta ao lado para começar a guardar.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-12 text-center">
                  <p className="font-semibold">Nenhuma caixinha neste filtro</p>
                  <p className="mt-1 text-sm text-muted">
                    Tente outro filtro para ver suas metas.
                  </p>
                </div>
              ) : (
                filtered.map((item) => {
                  const progress =
                    item.value > 0
                      ? Math.round((item.valueAdded / item.value) * 100)
                      : 100

                  return (
                    <article
                      key={item.id}
                      className={`rounded-2xl border bg-background/50 p-4 md:p-5 ${
                        item.isGoalReached
                          ? "border-emerald-200/80"
                          : "border-border/80"
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-4">
                        <ProgressRing
                          progress={progress}
                          reached={item.isGoalReached}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">
                              {item.name}
                            </h3>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                item.isGoalReached
                                  ? "bg-emerald-50 text-success"
                                  : "bg-teal-50 text-accent"
                              }`}
                            >
                              {item.isGoalReached
                                ? "Meta atingida"
                                : "Em andamento"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            Alvo em {formatDate(item.dateAcquisition)}
                            {item.monthsUntilTarget > 0
                              ? ` · ${item.monthsUntilTarget} mês(es)`
                              : item.isGoalReached
                                ? ""
                                : " · prazo próximo"}
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted">Guardado</p>
                              <p className="mt-0.5 font-semibold text-accent">
                                {formatCurrency(item.valueAdded)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted">Meta</p>
                              <p className="mt-0.5 font-semibold">
                                {formatCurrency(item.value)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted">Falta</p>
                              <p className="mt-0.5 font-semibold text-warning">
                                {formatCurrency(
                                  Math.max(item.remainingValue, 0)
                                )}
                              </p>
                            </div>
                          </div>

                          {!item.isGoalReached &&
                          item.suggestedMonthlyToReachByDate > 0 ? (
                            <p className="mt-3 rounded-xl bg-teal-50/60 px-3 py-2 text-xs text-muted">
                              Sugestão: guardar cerca de{" "}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(
                                  item.suggestedMonthlyToReachByDate
                                )}
                              </span>
                              /mês para bater a data alvo
                              {item.averageMonthlyDeposit > 0 ? (
                                <>
                                  {" "}
                                  · ritmo atual{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(item.averageMonthlyDeposit)}
                                  </span>
                                  /mês
                                </>
                              ) : null}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <CaixinhaMoveForm
                              caixinhaId={item.id}
                              caixinhaName={item.name}
                              mode="deposit"
                              availableBalance={amount.amount}
                            />
                            {item.valueAdded > 0 ? (
                              <CaixinhaMoveForm
                                caixinhaId={item.id}
                                caixinhaName={item.name}
                                mode="withdraw"
                                maxValue={item.valueAdded}
                              />
                            ) : null}
                            {item.valueAdded === 0 ? (
                              <ProxyActionButton
                                path={`/future-purchase/${item.id}`}
                                method="DELETE"
                                label="Excluir"
                                variant="danger"
                                confirmTitle="Excluir caixinha"
                                confirmMessage={`Você está prestes a excluir "${item.name}". Esta ação não pode ser desfeita.`}
                                ariaLabel={`Excluir caixinha ${item.name}`}
                              />
                            ) : (
                              <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-muted">
                                Retire o saldo para excluir
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <CreateCaixinhaForm />
            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5">
              <p className="text-sm font-semibold text-accent">Como funciona</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                <li>Guardar move dinheiro do saldo livre para a meta.</li>
                <li>Retirar devolve o valor ao saldo disponível.</li>
                <li>Para excluir, a caixinha precisa estar zerada.</li>
              </ul>
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

export default CaixinhasPage
