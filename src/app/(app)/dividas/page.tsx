import Link from "next/link"
import { redirect } from "next/navigation"
import { DeleteDebtButton } from "@/components/delete-debt-button"
import { IconPlus } from "@/components/icons"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, formatDate } from "@/lib/format"
import { getDebts } from "@/lib/finance-api"
import type { Debt } from "@/lib/types"

type DividasPageProps = {
  searchParams: Promise<{ status?: string }>
}

const getDebtTotals = (debt: Debt) => {
  const remaining = debt.installments
    .filter((item) => item.status === "SCHEDULE")
    .reduce((sum, item) => sum + item.value, 0)
  const paidTotal = debt.installments
    .filter((item) => item.status === "PAY")
    .reduce((sum, item) => sum + item.value, 0)
  const total = debt.installments.reduce((sum, item) => sum + item.value, 0)
  const next = [...debt.installments]
    .filter((item) => item.status === "SCHEDULE")
    .sort(
      (a, b) =>
        new Date(a.dateTransaction).getTime() -
        new Date(b.dateTransaction).getTime()
    )[0]
  const paidCount = debt.installments.filter((item) => item.status === "PAY").length
  const progress = total > 0 ? Math.round((paidTotal / total) * 100) : 100
  const isSettled = remaining <= 0

  return { remaining, paidTotal, total, next, paidCount, progress, isSettled }
}

const DividasPage = async ({ searchParams }: DividasPageProps) => {
  const params = await searchParams
  const status = params.status ?? "todas"

  try {
    const debts = await getDebts()
    const enriched = debts.map((debt) => ({
      debt,
      ...getDebtTotals(debt),
    }))

    const totalRemaining = enriched.reduce((sum, item) => sum + item.remaining, 0)
    const totalPaid = enriched.reduce((sum, item) => sum + item.paidTotal, 0)
    const activeCount = enriched.filter((item) => !item.isSettled).length
    const settledCount = enriched.filter((item) => item.isSettled).length

    const filtered = enriched.filter((item) => {
      if (status === "ativas") return !item.isSettled
      if (status === "quitadas") return item.isSettled
      return true
    })

    const filterHref = (nextStatus: string) => {
      if (nextStatus === "todas") return "/dividas"
      return `/dividas?status=${nextStatus}`
    }

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Dívidas
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Seus compromissos
              </h1>
              <p className="mt-1 text-sm text-muted">
                Acompanhe o que falta pagar e o andamento de cada dívida.
              </p>
            </div>
            <Link
              href="/dividas/nova"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
            >
              <IconPlus className="h-4 w-4" />
              Nova dívida
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Ainda falta</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="mt-1 text-xs text-muted">{activeCount} dívida(s) ativa(s)</p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
              <p className="text-sm text-muted">Já pago</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(totalPaid)}
              </p>
              <p className="mt-1 text-xs text-muted">em todas as dívidas</p>
            </article>
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4">
              <p className="text-sm text-muted">Em andamento</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {activeCount}
              </p>
              <p className="mt-1 text-xs text-muted">compromissos abertos</p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Quitadas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {settledCount}
              </p>
              <p className="mt-1 text-xs text-muted">já finalizadas</p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Lista de dívidas</h2>
              <p className="text-sm text-muted">
                {filtered.length} de {debts.length} compromisso(s)
              </p>
            </div>
            <div
              className="inline-flex rounded-xl border border-border bg-slate-50 p-1"
              role="group"
              aria-label="Filtrar dívidas"
            >
              {[
                { id: "todas", label: "Todas" },
                { id: "ativas", label: "Ativas" },
                { id: "quitadas", label: "Quitadas" },
              ].map((filter) => {
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

          <div className="p-3 md:p-4">
            {debts.length === 0 ? (
              <div className="rounded-xl bg-background px-4 py-14 text-center">
                <p className="font-semibold">Nenhuma dívida cadastrada</p>
                <p className="mt-1 text-sm text-muted">
                  Cadastre financiamentos, empréstimos ou compras parceladas.
                </p>
                <Link
                  href="/dividas/nova"
                  className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Cadastrar primeira dívida
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-background px-4 py-12 text-center">
                <p className="font-semibold">Nenhuma dívida neste filtro</p>
                <p className="mt-1 text-sm text-muted">
                  Tente outro filtro para ver seus compromissos.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map(
                  ({
                    debt,
                    remaining,
                    total,
                    next,
                    paidCount,
                    progress,
                    isSettled,
                  }) => (
                    <li
                      key={debt.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-4 md:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/dividas/${debt.id}`}
                              className="truncate text-base font-semibold hover:text-accent"
                            >
                              {debt.title}
                            </Link>
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                isSettled
                                  ? "bg-emerald-50 text-success"
                                  : "bg-amber-50 text-warning"
                              }`}
                            >
                              {isSettled ? "Quitada" : "Em andamento"}
                            </span>
                          </div>
                          {debt.description ? (
                            <p className="mt-1 max-w-2xl truncate text-sm text-muted">
                              {debt.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dividas/${debt.id}`}
                            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50"
                          >
                            Ver detalhes
                          </Link>
                          <DeleteDebtButton
                            debtId={debt.id}
                            debtTitle={debt.title}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted">Ainda falta</p>
                          <p className="mt-0.5 font-semibold text-warning">
                            {formatCurrency(remaining)}
                          </p>
                          <p className="text-xs text-muted">
                            de {formatCurrency(total)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Progresso</p>
                          <p className="mt-0.5 font-semibold">
                            {paidCount}/{debt.installments.length} parcelas · {progress}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Próxima parcela</p>
                          {next ? (
                            <>
                              <p className="mt-0.5 font-semibold">
                                {formatCurrency(next.value)}
                              </p>
                              <p className="text-xs text-muted">
                                {formatDate(next.dateTransaction)}
                              </p>
                            </>
                          ) : (
                            <p className="mt-0.5 font-semibold text-success">
                              Nenhuma pendente
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                          <span>Andamento</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isSettled ? "bg-emerald-500" : "bg-accent"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  )
                )}
              </ul>
            )}
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

export default DividasPage
