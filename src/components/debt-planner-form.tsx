"use client"

import Link from "next/link"
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
  subtitle,
  method,
  isFaster,
  isTie,
  variant,
}: {
  title: string
  subtitle: string
  method: DebtPlannerMethod
  isFaster: boolean
  isTie: boolean
  variant: "snowball" | "avalanche"
}) => {
  const months = Math.max(method.monthsToComplete, 1)
  const order = method.payoffOrder ?? []
  const breakdown = method.monthlyBreakdown ?? []
  const maxPaid = Math.max(...breakdown.map((row) => row.paid), 1)
  const shell =
    variant === "snowball"
      ? "border-teal-200/70 dark:border-teal-900/50"
      : "border-slate-200/80 dark:border-slate-700/60"
  const glow =
    isFaster && !isTie
      ? "ring-1 ring-accent/25 shadow-md shadow-teal-900/5"
      : "shadow-sm shadow-slate-200/40"

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border bg-surface ${shell} ${glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          variant === "snowball" ? "bg-accent" : "bg-slate-400"
        }`}
      />

      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {subtitle}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {title}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted">
              {method.description}
            </p>
          </div>
          {isFaster && !isTie ? (
            <span className="rounded-lg bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
              Mais rápido
            </span>
          ) : null}
          {isTie ? (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Empate
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Tempo estimado</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight tabular-nums">
              {method.monthsToComplete}
              <span className="ml-1.5 text-base font-medium text-muted">
                {method.monthsToComplete === 1 ? "mês" : "meses"}
              </span>
            </p>
          </div>
          <div className="hidden min-w-[7rem] text-right sm:block">
            <p className="text-xs text-muted">Quitações</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {order.length}
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              variant === "snowball" ? "bg-accent" : "bg-slate-400"
            }`}
            style={{
              width: `${Math.min(100, Math.max(12, 100 / Math.sqrt(months)))}%`,
            }}
          />
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Ordem de quitação
          </p>
          {order.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sem ordem calculada.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {order.slice(0, 6).map((item, index) => (
                <li
                  key={`${item.title}-${item.month}-${index}`}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      variant === "snowball"
                        ? "bg-teal-50 text-accent dark:bg-teal-950/50"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-border/60 pb-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="shrink-0 text-xs tabular-nums text-muted">
                        mês {item.month}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {order.length > 6 ? (
            <p className="mt-2 text-xs text-muted">
              + {order.length - 6} dívida(s) na sequência
            </p>
          ) : null}
        </div>

        {breakdown.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-border/70 bg-slate-50/70 p-4 dark:bg-slate-900/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Primeiros meses
            </p>
            <ul className="mt-3 space-y-2.5">
              {breakdown.slice(0, 4).map((row) => (
                <li key={row.month}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground">
                      Mês {row.month}
                    </span>
                    <span className="tabular-nums text-muted">
                      {formatCurrency(row.paid)} pago ·{" "}
                      {formatCurrency(row.remaining)} resta
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        variant === "snowball" ? "bg-teal-400" : "bg-slate-400"
                      }`}
                      style={{
                        width: `${Math.max(6, (row.paid / maxPaid) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  )
}

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

  const monthDelta = useMemo(() => {
    if (!data.snowball || !data.avalanche || fasterMethod === "tie") return null
    return Math.abs(
      data.snowball.monthsToComplete - data.avalanche.monthsToComplete
    )
  }, [data, fasterMethod])

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
      <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 px-5 py-12 text-center dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-teal-950/20">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-success">
          {data.message}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Cadastre dívidas com parcelas em aberto para simular a quitação por
          bola de neve ou avalanche.
        </p>
        <Link
          href="/financeiro/dividas"
          className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Ir para dívidas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border/70 bg-surface px-4 py-3.5 shadow-sm shadow-slate-200/40">
          <p className="text-xs text-muted">Em aberto</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
            {formatCurrency(data.totalDebt)}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {(data.debts ?? []).length} dívida(s) no plano
          </p>
        </article>
        <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 px-4 py-3.5 shadow-sm shadow-slate-200/40 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-xs text-muted">Mínimo mensal</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-warning">
            {formatCurrency(data.totalMinPayment ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted">Soma das mínimas</p>
        </article>
        <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 px-4 py-3.5 shadow-sm shadow-slate-200/40 dark:border-teal-900/50 dark:bg-teal-950/20">
          <p className="text-xs text-muted">Pagamento do plano</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-accent">
            {formatCurrency(data.monthlyPayment ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted">Usado na simulação</p>
        </article>
      </section>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40"
      >
        <div className="border-b border-border/70 px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Quanto cabe no mês?
              </h2>
              <p className="mt-1 text-sm text-muted">
                Ajuste o pagamento mensal e compare as duas estratégias.
              </p>
            </div>
            {data.monthlyPayment != null && data.monthlyPayment > 0 ? (
              <div className="rounded-xl border border-teal-200/70 bg-teal-50/50 px-3 py-2 text-right dark:border-teal-900/50 dark:bg-teal-950/30">
                <p className="text-[11px] text-muted">Plano atual</p>
                <p className="text-sm font-semibold tabular-nums text-accent">
                  {formatCurrency(data.monthlyPayment)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="block min-w-[14rem] flex-1 space-y-1.5">
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
              aria-label="Recalcular plano de quitação"
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
            <p
              className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-sm text-warning dark:border-amber-900/50 dark:bg-amber-950/20"
              role="status"
            >
              {data.warning}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-muted">{data.message}</p>
        </div>

        {fasterMethod ? (
          <div className="bg-slate-50/80 px-5 py-3 text-sm dark:bg-slate-900/40 md:px-6">
            {fasterMethod === "tie" ? (
              <p>
                As duas estratégias levam o mesmo tempo com este pagamento.
              </p>
            ) : (
              <p>
                <span className="font-semibold text-accent">
                  {fasterMethod === "snowball" ? "Bola de neve" : "Avalanche"}
                </span>{" "}
                fecha{" "}
                <span className="font-semibold tabular-nums">
                  {monthDelta} {monthDelta === 1 ? "mês" : "meses"}
                </span>{" "}
                antes com o valor atual.
              </p>
            )}
          </div>
        ) : null}
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.snowball ? (
          <MethodCard
            title="Bola de neve"
            subtitle="Menor saldo primeiro"
            method={data.snowball}
            isFaster={fasterMethod === "snowball"}
            isTie={fasterMethod === "tie"}
            variant="snowball"
          />
        ) : null}
        {data.avalanche ? (
          <MethodCard
            title="Avalanche"
            subtitle="Maior juros primeiro"
            method={data.avalanche}
            isFaster={fasterMethod === "avalanche"}
            isTie={fasterMethod === "tie"}
            variant="avalanche"
          />
        ) : null}
      </section>

      {(data.debts ?? []).length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4 md:px-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Dívidas no plano
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Base usada nas simulações de quitação
              </p>
            </div>
            <Link
              href="/financeiro/dividas"
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              Gerenciar
            </Link>
          </div>
          <ul className="divide-y divide-border/70">
            {(data.debts ?? []).map((debt, index) => (
              <li
                key={debt.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-muted dark:bg-slate-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{debt.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Juros {formatInterestRateLabel(debt.interestRate)} · mín.{" "}
                      {formatCurrency(debt.minPayment)}/mês
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
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
