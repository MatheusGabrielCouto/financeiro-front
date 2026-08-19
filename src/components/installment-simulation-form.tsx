"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"
import { formatCurrency } from "@/lib/format"
import type { InstallmentSimulationResult } from "@/lib/types"

const INSTALLMENT_PRESETS = [3, 6, 10, 12, 18, 24]

const statusMeta = {
  approved: {
    label: "Cabe no orçamento",
    hint: "A parcela deixa sobra positiva no mês",
    className:
      "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30",
    badge: "bg-emerald-100 text-success dark:bg-emerald-900/40",
    accent: "text-success",
    bar: "bg-emerald-400",
  },
  caution: {
    label: "Fica apertado",
    hint: "Dá para seguir, mas a margem fica estreita",
    className:
      "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30",
    badge: "bg-amber-100 text-warning dark:bg-amber-900/40",
    accent: "text-warning",
    bar: "bg-amber-400",
  },
  rejected: {
    label: "Não recomendado",
    hint: "A parcela compromete demais a sobra do mês",
    className:
      "border-red-200/80 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/30",
    badge: "bg-red-100 text-danger dark:bg-red-900/40",
    accent: "text-danger",
    bar: "bg-red-400",
  },
} as const

export const InstallmentSimulationForm = () => {
  const [name, setName] = useState("")
  const [totalValue, setTotalValue] = useState(0)
  const [installments, setInstallments] = useState("12")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<InstallmentSimulationResult | null>(null)

  const installmentCount = Number(installments)
  const preview =
    totalValue > 0 && installmentCount > 0
      ? totalValue / installmentCount
      : 0

  const breakdownMax = useMemo(() => {
    if (!result) return 1
    return Math.max(
      ...result.monthlyBreakdown
        .slice(0, 8)
        .map((row) => Math.abs(row.surplusWithParcel)),
      1
    )
  }, [result])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const count = Number(installments)
    if (!name.trim()) {
      setError("Informe o nome da compra")
      return
    }
    if (totalValue <= 0) {
      setError("Informe o valor total")
      return
    }
    if (!Number.isFinite(count) || count < 1 || count > 60) {
      setError("Parcelas devem ser entre 1 e 60")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/proxy/installment-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          installments: count,
          totalValue,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível simular"
        )
        return
      }

      const data = (await response.json()) as InstallmentSimulationResult
      setResult(data)
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreset = (count: number) => {
    setInstallments(String(count))
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <form
        onSubmit={handleSubmit}
        className="h-fit space-y-5 rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6 xl:sticky xl:top-24"
        aria-label="Simular parcelamento"
      >
        <div>
          <h2 className="text-base font-semibold">Dados da compra</h2>
          <p className="mt-1 text-sm text-muted">
            Preencha e simule o impacto da parcela no fluxo do mês.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">O que você quer comprar?</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Notebook, Sofá, Curso"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
            aria-label="Nome da compra"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Valor total</span>
          <CurrencyInput
            required
            value={totalValue}
            onValueChange={setTotalValue}
            ariaLabel="Valor total da compra"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium">Parcelas</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos de parcelas">
            {INSTALLMENT_PRESETS.map((count) => {
              const active = Number(installments) === count
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePreset(count)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-accent text-white"
                      : "border border-border bg-background text-foreground hover:border-accent/30 hover:bg-accent-soft/40"
                  }`}
                  aria-pressed={active}
                  aria-label={`${count} parcelas`}
                >
                  {count}x
                </button>
              )
            })}
          </div>
          <label className="block space-y-1.5">
            <span className="sr-only">Quantidade de parcelas</span>
            <input
              required
              type="number"
              min={1}
              max={60}
              value={installments}
              onChange={(event) => setInstallments(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              aria-label="Quantidade de parcelas"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/30">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Parcela estimada
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
                {preview > 0 ? formatCurrency(preview) : "—"}
              </p>
            </div>
            <p className="text-xs text-muted">
              {installmentCount > 0 ? `${installmentCount}x` : "defina as parcelas"}
            </p>
          </div>
        </div>

        {error ? (
          <p
            className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-danger dark:border-red-900/40 dark:bg-red-950/40"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {isLoading ? "Simulando..." : "Simular parcelas"}
        </button>
      </form>

      <div className="space-y-4">
        {!result ? (
          <section className="rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center shadow-sm shadow-slate-200/30">
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
              O resultado aparece aqui
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Informe a compra, o valor e as parcelas. A simulação mostra se a
              sobra do mês aguenta o comprometimento.
            </p>
            <div className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-muted">
              <p className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
                1. Preencha os dados à esquerda
              </p>
              <p className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
                2. Use atalhos 6x, 12x, 24x se quiser
              </p>
              <p className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
                3. Veja recomendação, margem e primeiros meses
              </p>
            </div>
          </section>
        ) : (
          <>
            <article
              className={`rounded-2xl border p-5 shadow-sm md:p-6 ${statusMeta[result.recommendation.status].className}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[result.recommendation.status].badge}`}
                >
                  {statusMeta[result.recommendation.status].label}
                </span>
                <span className="text-sm text-muted">
                  {statusMeta[result.recommendation.status].hint}
                </span>
              </div>

              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
                {result.simulation.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {result.recommendation.message}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-900/50">
                  <p className="text-xs text-muted">Parcela</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {formatCurrency(result.simulation.monthlyPayment)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    em {result.simulation.installments}x
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-900/50">
                  <p className="text-xs text-muted">Total</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {formatCurrency(result.simulation.totalValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-900/50">
                  <p className="text-xs text-muted">Da renda</p>
                  <p
                    className={`mt-1 text-xl font-semibold tabular-nums ${statusMeta[result.recommendation.status].accent}`}
                  >
                    {result.impact.percentOfIncome}%
                  </p>
                </div>
              </div>
            </article>

            <section className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Renda mensal",
                  value: formatCurrency(result.userSituation.monthlyIncome),
                },
                {
                  label: "Sobra atual",
                  value: formatCurrency(result.userSituation.monthlySurplus),
                },
                {
                  label: "Sobra após parcela",
                  value: formatCurrency(result.userSituation.surplusAfterParcel),
                  highlight:
                    result.userSituation.surplusAfterParcel >= 0
                      ? "text-success"
                      : "text-danger",
                },
                {
                  label: "Score estimado",
                  value: String(result.userSituation.financialScore),
                },
              ].map((card) => (
                <article
                  key={card.label}
                  className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm shadow-slate-200/30"
                >
                  <p className="text-sm text-muted">{card.label}</p>
                  <p
                    className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight ${card.highlight ?? "text-foreground"}`}
                  >
                    {card.value}
                  </p>
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-base font-semibold">Sobra nos primeiros meses</h3>
                <p className="text-sm text-muted">
                  Comparativo visual com a nova parcela
                </p>
              </div>
              <ul className="space-y-3 p-4 md:p-5">
                {result.monthlyBreakdown.slice(0, 8).map((row) => {
                  const positive = row.surplusWithParcel >= 0
                  const width = Math.max(
                    (Math.abs(row.surplusWithParcel) / breakdownMax) * 100,
                    row.surplusWithParcel ? 4 : 0
                  )
                  return (
                    <li key={row.label}>
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-xs text-muted">
                          parcela {formatCurrency(row.newParcel)} · obrigações{" "}
                          {formatCurrency(row.obligations)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              positive ? "bg-emerald-400" : "bg-red-400"
                            }`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span
                          className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${
                            positive ? "text-success" : "text-danger"
                          }`}
                        >
                          {formatCurrency(row.surplusWithParcel)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            {result.recommendation.status !== "rejected" ? (
              <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 dark:border-teal-900/40 dark:bg-teal-950/30">
                <p className="text-sm font-semibold text-accent">Próximo passo</p>
                <p className="mt-1 text-sm text-muted">
                  Se a compra fizer sentido, registre como dívida parcelada para
                  acompanhar no painel.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/financeiro/dividas/nova"
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                  >
                    Criar dívida
                  </Link>
                  <Link
                    href="/financeiro/planejador"
                    className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    Ver planejador
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm">
                <p className="text-sm font-semibold">Melhore a margem antes</p>
                <p className="mt-1 text-sm text-muted">
                  Ajuste receitas, quite pendências ou revise o prazo da compra.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/financeiro/receitas-fixas"
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    Receitas fixas
                  </Link>
                  <Link
                    href="/financeiro/parcelas"
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    Pagar pendências
                  </Link>
                  <Link
                    href="/financeiro/insights"
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    Ver insights
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
