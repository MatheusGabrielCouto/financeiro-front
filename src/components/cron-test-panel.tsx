"use client"

import { useState } from "react"

type CronJob =
  | "due_items"
  | "overdue_debts"
  | "recurring_income"
  | "pantry"
  | "due_soon"
  | "low_balance"
  | "unpaid_mid"
  | "caixinha_goals"

type CronRunResponse = {
  success: boolean
  scope: string
  dryRun: boolean
  scheduleHint?: string
  results: Record<string, Record<string, unknown>>
}

const JOB_LABELS: Record<CronJob, string> = {
  due_items: "Vencimentos (amanhã)",
  overdue_debts: "Dívidas em atraso",
  recurring_income: "Receitas recorrentes",
  pantry: "Estoque baixo",
  due_soon: "Vencimentos (em 3 dias)",
  low_balance: "Saldo / fluxo apertado",
  unpaid_mid: "Pendências do mês (15/fim)",
  caixinha_goals: "Metas de caixinha",
}

const STAT_LABELS: Record<string, string> = {
  recurringFound: "Contas fixas",
  installmentsFound: "Parcelas",
  plannedExpensesFound: "Gastos previstos",
  incomesFound: "Receitas",
  itemsFound: "Itens",
  goalsFound: "Metas",
  usersChecked: "Usuários verificados",
  usersMatched: "Usuários elegíveis",
  usersNotified: "Usuários notificados",
  usersProcessed: "Usuários processados",
  skippedNoToken: "Sem push token",
  skippedWrongDay: "Fora do dia (15/fim)",
  totalCredited: "Total creditado",
  dryRun: "Dry-run",
}

const formatStatValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "sim" : "não"
  if (typeof value === "number") return String(value)
  if (value == null) return "—"
  return String(value)
}

export const CronTestPanel = () => {
  const [selected, setSelected] = useState<CronJob[]>([
    "due_items",
    "overdue_debts",
    "recurring_income",
    "pantry",
    "due_soon",
    "low_balance",
    "unpaid_mid",
    "caixinha_goals",
  ])
  const [dryRun, setDryRun] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CronRunResponse | null>(null)

  const handleToggleJob = (job: CronJob) => {
    setSelected((current) =>
      current.includes(job)
        ? current.filter((item) => item !== job)
        : [...current, job]
    )
  }

  const handleRun = async () => {
    setError(null)
    setResult(null)

    if (selected.length === 0) {
      setError("Selecione ao menos uma cron")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/notifications/cron/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: selected,
          dryRun,
          allUsers: false,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível executar as crons"
        )
        return
      }

      setResult(data as CronRunResponse)
    } catch {
      setError("Erro de conexão com a API")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
      <h2 className="text-base font-semibold">Testar crons</h2>
      <p className="mt-1 text-sm text-muted">
        Dispara agora as rotinas diárias (08:00) só para a sua conta. Confira o
        push no celular.
      </p>

      <div className="mt-4 space-y-2">
        {(Object.keys(JOB_LABELS) as CronJob[]).map((job) => (
          <label
            key={job}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(job)}
              onChange={() => handleToggleJob(job)}
              className="h-4 w-4 shrink-0 accent-[var(--accent)]"
              aria-label={JOB_LABELS[job]}
            />
            <span className="min-w-0 font-medium text-foreground">
              {JOB_LABELS[job]}
            </span>
          </label>
        ))}
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(event) => setDryRun(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
          aria-label="Simular receita recorrente sem creditar saldo"
        />
        <span className="min-w-0">
          <span className="block font-medium text-foreground">
            Dry-run na receita recorrente
          </span>
          <span className="block text-xs text-muted">
            Recomendado. Se desmarcar, a cron credita o salário no saldo de
            verdade.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={handleRun}
        disabled={isLoading || selected.length === 0}
        className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        aria-label="Executar crons selecionadas"
      >
        {isLoading ? "Executando..." : "Rodar crons agora"}
      </button>

      {error ? (
        <p className="mt-3 break-words text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 min-w-0 space-y-3 overflow-hidden rounded-xl border border-teal-100 bg-teal-50/40 p-3 text-sm">
          <div className="min-w-0 space-y-1">
            <p className="break-words font-semibold text-accent">
              Executado · {result.scope}
              {result.dryRun ? " · dry-run" : ""}
            </p>
            {result.scheduleHint ? (
              <p className="break-words text-xs text-muted">
                {result.scheduleHint}
              </p>
            ) : null}
          </div>

          <ul className="min-w-0 space-y-2">
            {Object.entries(result.results).map(([job, stats]) => (
              <li
                key={job}
                className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-white px-3 py-2.5"
              >
                <p className="break-words font-semibold text-foreground">
                  {JOB_LABELS[job as CronJob] ?? job}
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {Object.entries(stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex min-w-0 items-baseline justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs"
                    >
                      <dt className="min-w-0 shrink text-muted">
                        {STAT_LABELS[key] ?? key}
                      </dt>
                      <dd className="shrink-0 font-semibold tabular-nums text-foreground">
                        {formatStatValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          <p className="break-words text-xs text-muted">
            Se usuários notificados for 0, pode não haver item elegível
            hoje/amanhã, ou o app ainda não registrou push token.
          </p>
        </div>
      ) : null}
    </div>
  )
}
