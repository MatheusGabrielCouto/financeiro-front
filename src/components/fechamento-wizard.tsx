"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format"
import type { CsvCell } from "@/lib/csv"

export type ClosingOverdueItem = {
  id: string
  title: string
  value: number
  dueDate: string
  kind: "installment" | "recurring" | "planned"
  href: string
  installmentId?: string
  recurringId?: string
  plannedId?: string
}

export type ClosingReminderItem = {
  id: string
  title: string
  value: number
  notes: string
  priority: "LOW" | "MEDIUM" | "HIGH"
}

export type ClosingPlannedItem = {
  id: string
  title: string
  value: number
  dueDate: string
  status: string
}

type FechamentoWizardProps = {
  month: number
  year: number
  overdue: ClosingOverdueItem[]
  reminders: ClosingReminderItem[]
  plannedOpen: ClosingPlannedItem[]
  summary: {
    income: number
    expenses: number
    surplus: number
    pendingTotal: number
  }
  exportRows: CsvCell[][]
}

const steps = [
  {
    id: 1,
    title: "Atrasados",
    description: "Quite ou resolva o que já passou do vencimento",
  },
  {
    id: 2,
    title: "Pra pagar",
    description: "Marque o que já saiu da conta",
  },
  {
    id: 3,
    title: "Previstos",
    description: "Confirme ou pague os gastos previstos do mês",
  },
  {
    id: 4,
    title: "Sobra",
    description: "Olhe o resultado do mês antes de fechar",
  },
  {
    id: 5,
    title: "Exportar",
    description: "Arquive um resumo CSV do fechamento",
  },
] as const

export const FechamentoWizard = ({
  month,
  year,
  overdue,
  reminders,
  plannedOpen,
  summary,
  exportRows,
}: FechamentoWizardProps) => {
  const [step, setStep] = useState(1)
  const [surplusAck, setSurplusAck] = useState(false)
  const [exported, setExported] = useState(false)
  const monthLabel = formatMonthLabel(month, year)
  const filename = `fechamento-${year}-${String(month).padStart(2, "0")}.csv`

  const completion = useMemo(
    () => ({
      1: overdue.length === 0,
      2: reminders.length === 0,
      3: plannedOpen.length === 0,
      4: surplusAck,
      5: exported,
    }),
    [overdue.length, reminders.length, plannedOpen.length, surplusAck, exported]
  )

  const doneCount = Object.values(completion).filter(Boolean).length
  const progress = Math.round((doneCount / steps.length) * 100)

  const handleSelectStep = (next: number) => setStep(next)

  const handleNext = () => setStep((current) => Math.min(5, current + 1))
  const handlePrev = () => setStep((current) => Math.max(1, current - 1))

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Ritual do mês
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
          Fechamento de {monthLabel}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Cinco passos rápidos: atrasados → pra pagar → previstos → sobra →
          exportar. Reutiliza o que você já cadastrou.
        </p>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
            <span>
              {doneCount} de {steps.length} passos ok
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ol className="mt-5 grid gap-2 sm:grid-cols-5">
          {steps.map((item) => {
            const done = completion[item.id]
            const active = step === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelectStep(item.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-accent bg-teal-50/70 dark:bg-teal-950/40"
                      : done
                        ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/30"
                        : "border-border bg-background/60 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  }`}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Passo ${item.id}: ${item.title}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {done ? "Ok" : `Passo ${item.id}`}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.title}</p>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">
            {steps[step - 1]?.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {steps[step - 1]?.description}
          </p>
        </div>

        <div className="space-y-3 p-4 md:p-5">
          {step === 1 ? (
            overdue.length === 0 ? (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-10 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="font-semibold text-success">Sem atrasados</p>
                <p className="mt-1 text-sm text-muted">
                  Pode seguir para a lista pra pagar.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {overdue.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200/70 bg-red-50/30 p-4 dark:border-red-900/60 dark:bg-red-950/20"
                  >
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        Venceu em {formatDate(item.dueDate)} ·{" "}
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.installmentId ? (
                        <ProxyActionButton
                          path={`/installment/${item.installmentId}`}
                          method="PATCH"
                          label="Pagar"
                          loadingLabel="..."
                          variant="primary"
                          ariaLabel={`Pagar ${item.title}`}
                        />
                      ) : null}
                      {item.recurringId ? (
                        <ProxyActionButton
                          path={`/recurring-payment/${item.recurringId}/pay`}
                          method="POST"
                          label="Pagar"
                          loadingLabel="..."
                          variant="primary"
                          ariaLabel={`Pagar ${item.title}`}
                        />
                      ) : null}
                      {item.plannedId ? (
                        <ProxyActionButton
                          path={`/planned-expense/${item.plannedId}/pay`}
                          method="POST"
                          label="Pagar"
                          loadingLabel="..."
                          variant="primary"
                          ariaLabel={`Pagar ${item.title}`}
                        />
                      ) : null}
                      <Link
                        href={item.href}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        Abrir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {step === 2 ? (
            reminders.length === 0 ? (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-10 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="font-semibold text-success">Lista limpa</p>
                <p className="mt-1 text-sm text-muted">
                  Nenhum item aberto em Pra pagar.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {reminders.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/50 p-4"
                  >
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatCurrency(item.value)}
                        {item.notes ? ` · ${item.notes}` : ""}
                      </p>
                    </div>
                    <ProxyActionButton
                      path={`/payment-reminder/${item.id}/done`}
                      method="POST"
                      label="Feito"
                      loadingLabel="..."
                      variant="ghost"
                      ariaLabel={`Marcar ${item.title} como feito`}
                    />
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {step === 3 ? (
            plannedOpen.length === 0 ? (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-10 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="font-semibold text-success">Previstos em dia</p>
                <p className="mt-1 text-sm text-muted">
                  Nenhum gasto previsto aberto neste mês.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {plannedOpen.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/50 p-4"
                  >
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(item.dueDate)} · {formatCurrency(item.value)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ProxyActionButton
                        path={`/planned-expense/${item.id}/pay`}
                        method="POST"
                        label="Pagar"
                        loadingLabel="..."
                        variant="primary"
                        ariaLabel={`Pagar ${item.title}`}
                      />
                      <Link
                        href="/gastos-previstos"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        Abrir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/40">
                  <p className="text-sm text-muted">Receitas</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums">
                    {formatCurrency(summary.income)}
                  </p>
                </article>
                <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <p className="text-sm text-muted">Saídas</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-warning">
                    {formatCurrency(summary.expenses)}
                  </p>
                </article>
                <article
                  className={`rounded-2xl border p-4 ${
                    summary.surplus >= 0
                      ? "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/30"
                      : "border-red-200/70 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20"
                  }`}
                >
                  <p className="text-sm text-muted">Sobra</p>
                  <p
                    className={`mt-2 text-xl font-semibold tabular-nums ${
                      summary.surplus >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatCurrency(summary.surplus)}
                  </p>
                </article>
              </div>
              <p className="text-sm text-muted">
                Ainda há {formatCurrency(summary.pendingTotal)} em compromissos
                pendentes neste mês.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSurplusAck(true)}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                  aria-label="Confirmar revisão da sobra"
                >
                  {surplusAck ? "Sobra revisada" : "Marcar sobra como revisada"}
                </button>
                <Link
                  href={`/relatorios?month=${month}&year=${year}`}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  Abrir relatórios
                </Link>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Exporte o resumo do fechamento em CSV ou PDF, ou baixe o mês
                completo em Relatórios / Extrato.
              </p>
              <div className="flex flex-wrap gap-2">
                <ExportDataButtons
                  filename={filename}
                  title={`Fechamento — ${monthLabel}`}
                  subtitle="Resumo do ritual de fechamento do mês"
                  headers={["Seção", "Item", "Valor", "Detalhe"]}
                  rows={exportRows}
                  csvLabel="Resumo CSV"
                  pdfLabel="Resumo PDF"
                  onExported={() => setExported(true)}
                />
                <button
                  type="button"
                  onClick={() => setExported(true)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  aria-label="Marcar exportação como concluída"
                >
                  {exported ? "Exportação ok" : "Já exportei / concluir"}
                </button>
                <Link
                  href={`/extrato?month=${month}&year=${year}`}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  Extrato
                </Link>
              </div>
              {doneCount === steps.length ? (
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="font-semibold text-success">Mês fechado</p>
                  <p className="mt-1 text-sm text-muted">
                    Bom trabalho — o ritual de {monthLabel} está completo.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-900/50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={step === 5}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      </section>
    </div>
  )
}
