import Link from "next/link"
import { redirect } from "next/navigation"
import { CreateRecurringPaymentForm } from "@/components/recurring-forms"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { StatusBadge } from "@/components/status-badge"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, formatDate, formatMonthLabel, getCurrentMonthYear } from "@/lib/format"
import { getCategories, getRecurringPayments } from "@/lib/finance-api"

const wasPaidThisMonth = (lastProcessedAt: string | null) => {
  if (!lastProcessedAt) return false
  const date = new Date(lastProcessedAt)
  const now = new Date()
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

const RecorrentesPage = async () => {
  try {
    const [payments, categories] = await Promise.all([
      getRecurringPayments(),
      getCategories(),
    ])

    const { month, year } = getCurrentMonthYear()
    const monthLabel = formatMonthLabel(month, year)
    const paymentTotal = payments.reduce((sum, item) => sum + item.value, 0)
    const pending = payments.filter((item) => !wasPaidThisMonth(item.lastProcessedAt))
    const paid = payments.filter((item) => wasPaidThisMonth(item.lastProcessedAt))
    const pendingTotal = pending.reduce((sum, item) => sum + item.value, 0)
    const paidTotal = paid.reduce((sum, item) => sum + item.value, 0)
    const progress =
      paymentTotal > 0 ? Math.round((paidTotal / paymentTotal) * 100) : 100

    const sorted = [...payments].sort((a, b) => {
      const aPaid = wasPaidThisMonth(a.lastProcessedAt)
      const bPaid = wasPaidThisMonth(b.lastProcessedAt)
      if (aPaid !== bPaid) return aPaid ? 1 : -1
      return a.dayOfMonth - b.dayOfMonth
    })

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Despesas recorrentes
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Contas fixas
              </h1>
              <p className="mt-2 text-sm text-muted">
                Aqui ficam as contas que se repetem todo mês — aluguel, internet,
                streaming, academias e outros gastos fixos.{" "}
                <span className="font-medium text-foreground">
                  Não cadastre salário nesta tela.
                </span>{" "}
                O salário e outras receitas ficam em{" "}
                <Link
                  href="/financeiro/receitas-fixas"
                  className="font-semibold text-accent hover:underline"
                >
                  Receitas fixas
                </Link>
                .
              </p>
            </div>
            <Link
              href="/financeiro/receitas-fixas"
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              Ir para receitas fixas
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm text-muted">A pagar em {monthLabel}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(pendingTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">{pending.length} conta(s)</p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-sm text-muted">Já pagas no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(paidTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">{paid.length} quitada(s)</p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Total mensal de contas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(paymentTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">{payments.length} cadastrada(s)</p>
            </article>
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm text-muted">Progresso do mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {progress}%
              </p>
              <p className="mt-1 text-xs text-muted">das contas fixas</p>
            </article>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Quitação das contas fixas</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Suas contas fixas</h2>
              <p className="text-sm text-muted">
                Pague o mês atual com um clique ou exclua o que não usa mais.
              </p>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {sorted.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-14 text-center">
                  <p className="font-semibold">Nenhuma conta fixa cadastrada</p>
                  <p className="mt-1 text-sm text-muted">
                    Cadastre aluguel, internet, luz, streaming e outras despesas
                    que se repetem.
                  </p>
                </div>
              ) : (
                sorted.map((payment) => {
                  const paidThisMonth = wasPaidThisMonth(payment.lastProcessedAt)
                  return (
                    <article
                      key={payment.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-4 md:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">
                              {payment.title}
                            </h3>
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-warning dark:bg-amber-950/40">
                              Conta fixa
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            Todo dia {payment.dayOfMonth}
                            {payment.category
                              ? ` · ${payment.category.title}`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {paidThisMonth
                              ? `Paga este mês${
                                  payment.lastProcessedAt
                                    ? ` em ${formatDate(payment.lastProcessedAt)}`
                                    : ""
                                }`
                              : "Pendente neste mês"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold tabular-nums">
                              {formatCurrency(payment.value)}
                            </p>
                            <div className="mt-1 flex justify-end">
                              <StatusBadge
                                status={paidThisMonth ? "PAY" : "SCHEDULE"}
                              />
                            </div>
                          </div>

                          {!paidThisMonth ? (
                            <ProxyActionButton
                              path={`/recurring-payment/${payment.id}/pay`}
                              method="POST"
                              label="Pagar"
                              loadingLabel="Pagando..."
                              variant="primary"
                              ariaLabel={`Pagar conta fixa ${payment.title}`}
                            />
                          ) : null}
                          <ProxyActionButton
                            path={`/recurring-payment/${payment.id}`}
                            method="DELETE"
                            label="Excluir"
                            variant="danger"
                            confirmTitle="Excluir conta fixa"
                            confirmMessage={`Você está prestes a excluir "${payment.title}". Esta ação não pode ser desfeita.`}
                            ariaLabel={`Excluir conta fixa ${payment.title}`}
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
              <h2 className="text-base font-semibold">Nova conta fixa</h2>
              <p className="mt-1 text-sm text-muted">
                Despesa mensal que você precisa pagar todo mês.
              </p>
              <div className="mt-5">
                <CreateRecurringPaymentForm categories={categories} />
              </div>
            </div>

            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm font-semibold text-accent">Receitas ficam à parte</p>
              <p className="mt-1 text-sm text-muted">
                Salário, freelance recorrente e outras entradas mensais são
                cadastrados em Receitas fixas — não aqui.
              </p>
              <Link
                href="/financeiro/receitas-fixas"
                className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Cadastrar salário / receita
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

export default RecorrentesPage
