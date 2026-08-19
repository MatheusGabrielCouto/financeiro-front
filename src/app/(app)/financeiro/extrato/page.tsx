import { Suspense } from "react"
import { redirect } from "next/navigation"
import { CreateTransactionForm } from "@/components/create-transaction-form"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { ExtratoMovements } from "@/components/extrato-movements"
import { MonthYearFilter } from "@/components/month-year-filter"
import { QuickTransactionLauncher } from "@/components/quick-transaction-launcher"
import { ApiError } from "@/lib/api-server"
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import {
  getAmount,
  getCategories,
  getTransactions,
} from "@/lib/finance-api"
import type { Transaction } from "@/lib/types"

type ExtratoPageProps = {
  searchParams: Promise<{ month?: string; year?: string; tipo?: string }>
}

const typeLabel = (type: Transaction["type"]) => {
  if (type === "CREDIT") return "Entrada"
  if (type === "PAY") return "Pagamento"
  return "Saída"
}

const ExtratoPage = async ({ searchParams }: ExtratoPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const tipo = params.tipo

  if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) {
    redirect(`/financeiro/extrato?month=${current.month}&year=${current.year}`)
  }

  try {
    const [amount, categories, transactions] = await Promise.all([
      getAmount(),
      getCategories(),
      getTransactions(month, year),
    ])

    const sorted = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const filtered = sorted.filter((item) => {
      if (!tipo || tipo === "todos") return true
      if (tipo === "entradas") return item.type === "CREDIT"
      if (tipo === "saidas") return item.type === "DEBIT" || item.type === "PAY"
      return true
    })

    const income = sorted
      .filter((item) => item.type === "CREDIT")
      .reduce((sum, item) => sum + item.value, 0)
    const outflow = sorted
      .filter((item) => item.type !== "CREDIT")
      .reduce((sum, item) => sum + item.value, 0)
    const net = income - outflow
    const monthLabel = formatMonthLabel(month, year)
    const csvHeaders = [
      "Data",
      "Tipo",
      "Descrição",
      "Valor",
      "Categorias",
      "Recorrente",
    ]
    const csvRows = filtered.map((item) => [
      new Date(item.createdAt).toISOString(),
      typeLabel(item.type),
      item.message,
      item.type === "CREDIT" ? item.value : -item.value,
      item.categories.map((category) => category.title).join(" | "),
      item.isRecurring ? "sim" : "não",
    ])
    const csvFilename = `extrato-${year}-${String(month).padStart(2, "0")}.csv`

    const filterHref = (nextTipo: string) => {
      const query = new URLSearchParams({
        month: String(month),
        year: String(year),
      })
      if (nextTipo !== "todos") query.set("tipo", nextTipo)
      return `/financeiro/extrato?${query.toString()}`
    }

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Extrato
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                {monthLabel}
              </h1>
              <p className="mt-1 text-sm text-muted">
                Só o que já entrou ou saiu na conta — não desconta o que ainda
                está em aberto.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <Suspense fallback={<div className="text-sm text-muted">Carregando...</div>}>
                <MonthYearFilter month={month} year={year} basePath="/financeiro/extrato" />
              </Suspense>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ExportDataButtons
                  filename={csvFilename}
                  title={`Extrato — ${monthLabel}`}
                  subtitle="Somente lançamentos do extrato (não desconta compromissos em aberto)"
                  headers={csvHeaders}
                  rows={csvRows}
                  csvLabel="CSV"
                  pdfLabel="PDF"
                />
                <QuickTransactionLauncher categories={categories} variant="toolbar" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm text-muted">Saldo atual</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {formatCurrency(amount.amount)}
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-sm text-muted">Entradas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                + {formatCurrency(income)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {sorted.filter((item) => item.type === "CREDIT").length} lançamento(s)
              </p>
            </article>
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm text-muted">Já saiu</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                − {formatCurrency(outflow)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {sorted.filter((item) => item.type !== "CREDIT").length} lançamento(s)
                no extrato
              </p>
            </article>
            <article
              className={`rounded-2xl border p-4 ${
                net >= 0
                  ? "border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50"
                  : "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/30"
              }`}
            >
              <p className="text-sm text-muted">Resultado do extrato</p>
              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
                  net >= 0 ? "text-foreground" : "text-danger"
                }`}
              >
                {net >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(net))}
              </p>
              <p className="mt-1 text-xs text-muted">
                Entradas − já saiu (sem o em aberto)
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Movimentações</h2>
                <p className="text-sm text-muted">
                  {filtered.length} de {sorted.length} lançamento(s)
                </p>
              </div>
              <div
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1 dark:bg-slate-900/50"
                role="group"
                aria-label="Filtrar por tipo"
              >
                {[
                  { id: "todos", label: "Todos" },
                  { id: "entradas", label: "Entradas" },
                  { id: "saidas", label: "Saídas" },
                ].map((filter) => {
                  const isActive =
                    (filter.id === "todos" && (!tipo || tipo === "todos")) ||
                    tipo === filter.id
                  return (
                    <a
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
                    </a>
                  )
                })}
              </div>
            </div>

            <Suspense
              fallback={
                <div className="p-6 text-sm text-muted">Carregando movimentos...</div>
              }
            >
              <ExtratoMovements
                transactions={filtered}
                categories={categories}
              />
            </Suspense>
          </div>

          <CreateTransactionForm categories={categories} />
        </section>

        <QuickTransactionLauncher categories={categories} variant="fab" />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default ExtratoPage
