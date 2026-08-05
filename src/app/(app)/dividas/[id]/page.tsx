import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { DeleteDebtButton } from "@/components/delete-debt-button"
import { EditDebtForm } from "@/components/edit-debt-form"
import { OverdueInterestHint } from "@/components/overdue-interest-hint"
import { StatusBadge } from "@/components/status-badge"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, formatDate } from "@/lib/format"
import { formatInterestRateLabel } from "@/lib/overdue-interest"
import { getCategories, getDebt } from "@/lib/finance-api"

type DebtDetailPageProps = {
  params: Promise<{ id: string }>
}

const DebtDetailPage = async ({ params }: DebtDetailPageProps) => {
  const { id } = await params

  try {
    const [debt, categories] = await Promise.all([
      getDebt(id),
      getCategories(),
    ])

    if (!debt) {
      notFound()
    }

    const remaining = debt.installments
      .filter((item) => item.status === "SCHEDULE")
      .reduce((sum, item) => sum + item.value, 0)
    const paidTotal = debt.installments
      .filter((item) => item.status === "PAY")
      .reduce((sum, item) => sum + item.value, 0)
    const total = debt.installments.reduce((sum, item) => sum + item.value, 0)
    const paidCount = debt.installments.filter((item) => item.status === "PAY").length
    const progress = total > 0 ? Math.round((paidTotal / total) * 100) : 100
    const isSettled = remaining <= 0
    const next = [...debt.installments]
      .filter((item) => item.status === "SCHEDULE")
      .sort(
        (a, b) =>
          new Date(a.dateTransaction).getTime() -
          new Date(b.dateTransaction).getTime()
      )[0]

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <Link
            href="/dividas"
            className="text-sm font-medium text-accent hover:underline"
          >
            ← Voltar para dívidas
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                  {debt.title}
                </h1>
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
                <p className="mt-2 max-w-2xl text-sm text-muted">{debt.description}</p>
              ) : null}
              {debt.interestRate > 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Taxa de juros:{" "}
                  <span className="font-medium text-foreground">
                    {formatInterestRateLabel(
                      debt.interestRate,
                      debt.interestRateType
                    )}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <EditDebtForm debt={debt} categories={categories} />
              <Link
                href="/parcelas"
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
              >
                Ir para parcelas
              </Link>
              <DeleteDebtButton
                debtId={debt.id}
                debtTitle={debt.title}
                redirectTo="/dividas"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Ainda falta</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(remaining)}
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
              <p className="text-sm text-muted">Já pago</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(paidTotal)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Total da dívida</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(total)}
              </p>
            </article>
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4">
              <p className="text-sm text-muted">Progresso</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {progress}%
              </p>
              <p className="mt-1 text-xs text-muted">
                {paidCount} de {debt.installments.length} parcelas
              </p>
            </article>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Andamento da quitação</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  isSettled ? "bg-emerald-500" : "bg-accent"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {next ? (
              <p className="mt-3 text-sm text-muted">
                Próxima parcela:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(next.value)}
                </span>{" "}
                em {formatDate(next.dateTransaction)}
              </p>
            ) : (
              <p className="mt-3 text-sm font-medium text-success">
                Esta dívida não tem parcelas pendentes.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Parcelas</h2>
            <p className="text-sm text-muted">
              Histórico e vencimentos deste compromisso
            </p>
          </div>

          <div className="overflow-x-auto p-2 md:p-3">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Vencimento</th>
                  <th className="px-3 py-2.5 font-medium">Valor</th>
                  <th className="px-3 py-2.5 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {debt.installments.map((installment) => (
                  <tr
                    key={installment.id}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-3 font-medium">{installment.order}</td>
                    <td className="px-3 py-3 text-muted">
                      {formatDate(installment.dateTransaction)}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        {formatCurrency(installment.value)}
                        <OverdueInterestHint
                          value={installment.value}
                          dueDate={installment.dateTransaction}
                          interestRate={debt.interestRate}
                          interestRateType={debt.interestRateType}
                          status={installment.status}
                        />
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={installment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default DebtDetailPage
