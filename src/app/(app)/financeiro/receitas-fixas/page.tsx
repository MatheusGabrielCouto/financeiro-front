import Link from "next/link"
import { redirect } from "next/navigation"
import { CreateRecurringIncomeForm } from "@/components/recurring-forms"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import { getRecurringIncomes } from "@/lib/finance-api"

const wasReceivedThisMonth = (lastProcessedAt: string | null) => {
  if (!lastProcessedAt) return false
  const date = new Date(lastProcessedAt)
  const now = new Date()
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

const ReceitasFixasPage = async () => {
  try {
    const incomes = await getRecurringIncomes()
    const { month, year } = getCurrentMonthYear()
    const monthLabel = formatMonthLabel(month, year)
    const incomeTotal = incomes.reduce((sum, item) => sum + item.value, 0)
    const pending = incomes.filter(
      (item) => !wasReceivedThisMonth(item.lastProcessedAt)
    )
    const received = incomes.filter((item) =>
      wasReceivedThisMonth(item.lastProcessedAt)
    )
    const pendingTotal = pending.reduce((sum, item) => sum + item.value, 0)
    const receivedTotal = received.reduce((sum, item) => sum + item.value, 0)
    const progress =
      incomeTotal > 0 ? Math.round((receivedTotal / incomeTotal) * 100) : 100

    const sorted = [...incomes].sort((a, b) => {
      const aReceived = wasReceivedThisMonth(a.lastProcessedAt)
      const bReceived = wasReceivedThisMonth(b.lastProcessedAt)
      if (aReceived !== bReceived) return aReceived ? 1 : -1
      return a.dayOfMonth - b.dayOfMonth
    })

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Entradas recorrentes
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Receitas fixas
              </h1>
              <p className="mt-2 text-sm text-muted">
                Cadastre aqui o{" "}
                <span className="font-medium text-foreground">salário</span> e
                outras entradas que se repetem todo mês. O valor só entra na
                conta quando você tocar em{" "}
                <span className="font-medium text-foreground">Recebi</span> —
                útil se cair adiantado ou atrasar alguns dias.
              </p>
            </div>
            <Link
              href="/financeiro/recorrentes"
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              Ir para contas fixas
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm text-muted">A receber em {monthLabel}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(pendingTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {pending.length} fonte(s)
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-sm text-muted">Já recebidas no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(receivedTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {received.length} confirmada(s)
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Total mensal previsto</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(incomeTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {incomes.length} cadastrada(s)
              </p>
            </article>
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm text-muted">Progresso do mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {progress}%
              </p>
              <p className="mt-1 text-xs text-muted">das receitas fixas</p>
            </article>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Confirmação das receitas fixas</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Suas entradas fixas</h2>
              <p className="text-sm text-muted">
                Confirme o recebimento do mês com um clique ou exclua o que não
                usa mais.
              </p>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {sorted.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-14 text-center">
                  <p className="font-semibold">
                    Nenhuma receita fixa cadastrada
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Comece pelo salário para o app projetar sua sobra do mês.
                  </p>
                </div>
              ) : (
                sorted.map((income) => {
                  const receivedThisMonth = wasReceivedThisMonth(
                    income.lastProcessedAt
                  )
                  return (
                    <article
                      key={income.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-4 md:p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">
                            {income.title}
                          </h3>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-success dark:bg-emerald-950/40">
                            Receita fixa
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          Todo dia {income.dayOfMonth}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {receivedThisMonth
                            ? `Recebida este mês${
                                income.lastProcessedAt
                                  ? ` em ${formatDate(income.lastProcessedAt)}`
                                  : ""
                              }`
                            : "Pendente neste mês — toque em Recebi quando cair"}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold tabular-nums text-success">
                            +{formatCurrency(income.value)}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                              receivedThisMonth
                                ? "bg-emerald-50 text-success dark:bg-emerald-950/40"
                                : "bg-amber-50 text-warning dark:bg-amber-950/40"
                            }`}
                          >
                            {receivedThisMonth ? "Recebida" : "Pendente"}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {!receivedThisMonth ? (
                            <ProxyActionButton
                              path={`/recurring-income/${income.id}/receive`}
                              method="POST"
                              label="Recebi"
                              loadingLabel="Confirmando..."
                              variant="primary"
                              ariaLabel={`Confirmar recebimento de ${income.title}`}
                            />
                          ) : null}
                          <ProxyActionButton
                            path={`/recurring-income/${income.id}`}
                            method="DELETE"
                            label="Excluir"
                            variant="danger"
                            confirmTitle="Excluir receita fixa"
                            confirmMessage={`Você está prestes a excluir "${income.title}". Esta ação não pode ser desfeita.`}
                            ariaLabel={`Excluir receita fixa ${income.title}`}
                          />
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Nova receita fixa</h2>
              <p className="mt-1 text-sm text-muted">
                Ex.: Salário, vale-alimentação, aluguel recebido.
              </p>
              <div className="mt-5">
                <CreateRecurringIncomeForm />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-warning">
                Contas ficam à parte
              </p>
              <p className="mt-1 text-sm text-muted">
                Aluguel, internet e outras despesas recorrentes são cadastradas
                em Contas fixas.
              </p>
              <Link
                href="/financeiro/recorrentes"
                className="mt-4 inline-flex rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                Cadastrar conta fixa
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

export default ReceitasFixasPage
