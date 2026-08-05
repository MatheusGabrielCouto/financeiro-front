"use client"

import { FormEvent, useMemo, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"
import { formatCurrency } from "@/lib/format"
import { formatInterestRateLabel } from "@/lib/overdue-interest"
import type { DebtPlannerMethod, DebtPlannerResponse } from "@/lib/types"

type DebtPlannerFormProps = {
  initialData: DebtPlannerResponse
}

const MethodCard = ({
  title,
  accent,
  method,
  isFaster,
}: {
  title: string
  accent: string
  method: DebtPlannerMethod
  isFaster: boolean
}) => (
  <article className={`rounded-2xl border bg-surface p-5 shadow-sm shadow-slate-200/40 ${accent}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{method.description}</p>
      </div>
      {isFaster ? (
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
          Mais rápido
        </span>
      ) : null}
    </div>

    <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
      {method.monthsToComplete}
      <span className="ml-1 text-base font-medium text-muted">meses</span>
    </p>

    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Ordem de quitação
      </p>
      <ol className="mt-2 space-y-1.5">
        {(method.payoffOrder ?? []).slice(0, 6).map((item, index) => (
          <li
            key={`${item.title}-${item.month}-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate">
              <span className="mr-2 font-semibold text-accent">{index + 1}.</span>
              {item.title}
            </span>
            <span className="shrink-0 text-xs text-muted">
              mês {item.month}
            </span>
          </li>
        ))}
      </ol>
      {(method.payoffOrder ?? []).length > 6 ? (
        <p className="mt-2 text-xs text-muted">
          + {(method.payoffOrder ?? []).length - 6} dívida(s)
        </p>
      ) : null}
    </div>

    {(method.monthlyBreakdown ?? []).length > 0 ? (
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Primeiros meses
        </p>
        <ul className="mt-2 space-y-1">
          {(method.monthlyBreakdown ?? []).slice(0, 4).map((row) => (
            <li
              key={row.month}
              className="flex items-center justify-between text-xs text-muted"
            >
              <span>Mês {row.month}</span>
              <span>
                pago {formatCurrency(row.paid)} · resta{" "}
                {formatCurrency(row.remaining)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </article>
)

export const DebtPlannerForm = ({ initialData }: DebtPlannerFormProps) => {
  const [payment, setPayment] = useState(initialData.monthlyPayment ?? 0)
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fasterMethod = useMemo(() => {
    if (!data.snowball || !data.avalanche) return null
    if (data.snowball.monthsToComplete === data.avalanche.monthsToComplete) {
      return "tie"
    }
    return data.snowball.monthsToComplete < data.avalanche.monthsToComplete
      ? "snowball"
      : "avalanche"
  }, [data])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const params =
        payment > 0 ? `?effectiveMonthlyPayment=${payment}` : ""
      const response = await fetch(
        `/api/proxy/spending-insights/debt-planner${params}`
      )
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof payload.message === "string"
            ? payload.message
            : "Não foi possível recalcular o plano"
        )
        return
      }

      setData(payload as DebtPlannerResponse)
    } catch {
      setError("Erro de conexão ao recalcular")
    } finally {
      setIsLoading(false)
    }
  }

  if (!data.snowball && !data.avalanche) {
    return (
      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 px-5 py-10 text-center">
        <p className="font-semibold text-success">{data.message}</p>
        <p className="mt-1 text-sm text-muted">
          Cadastre dívidas com parcelas em aberto para simular a quitação.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm">
          <p className="text-sm text-muted">Total em aberto</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(data.totalDebt)}
          </p>
        </article>
        <article className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm">
          <p className="text-sm text-muted">Pagamento mínimo</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(data.totalMinPayment ?? 0)}
          </p>
        </article>
        <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4 shadow-sm">
          <p className="text-sm text-muted">Pagamento do plano</p>
          <p className="mt-1 text-2xl font-semibold text-accent">
            {formatCurrency(data.monthlyPayment ?? 0)}
          </p>
        </article>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40"
      >
        <h2 className="text-base font-semibold">Quanto pode pagar por mês?</h2>
        <p className="mt-1 text-sm text-muted">
          Ajuste o valor mensal para comparar estratégias de quitação.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block min-w-[12rem] flex-1 space-y-1.5">
            <span className="text-sm font-medium">Pagamento mensal</span>
            <CurrencyInput
              value={payment}
              onValueChange={setPayment}
              ariaLabel="Pagamento mensal do planejador"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {isLoading ? "Calculando..." : "Recalcular"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {data.warning ? (
          <p className="mt-3 text-sm text-warning" role="status">
            {data.warning}
          </p>
        ) : null}
        <p className="mt-3 text-sm font-medium text-foreground">{data.message}</p>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.snowball ? (
          <MethodCard
            title="Bola de neve"
            accent="border-teal-200/70"
            method={data.snowball}
            isFaster={fasterMethod === "snowball"}
          />
        ) : null}
        {data.avalanche ? (
          <MethodCard
            title="Avalanche"
            accent="border-slate-200"
            method={data.avalanche}
            isFaster={fasterMethod === "avalanche"}
          />
        ) : null}
      </section>

      {(data.debts ?? []).length > 0 ? (
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm">
          <h2 className="text-base font-semibold">Dívidas no plano</h2>
          <ul className="mt-3 space-y-2">
            {(data.debts ?? []).map((debt) => (
              <li
                key={debt.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{debt.title}</p>
                  <p className="text-xs text-muted">
                    Juros {formatInterestRateLabel(debt.interestRate)} · mín.{" "}
                    {formatCurrency(debt.minPayment)}/mês
                  </p>
                </div>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(debt.remainingValue)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
