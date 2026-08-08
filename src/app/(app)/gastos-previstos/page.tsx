import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { CreatePlannedExpenseForm } from "@/components/planned-expense-form"
import { MonthYearFilter } from "@/components/month-year-filter"
import { PlannedExpenseRow } from "@/components/planned-expense-row"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, getCurrentMonthYear } from "@/lib/format"
import {
  getCategories,
  getPlannedExpenses,
} from "@/lib/finance-api"

type GastosPrevistosPageProps = {
  searchParams: Promise<{
    month?: string
    year?: string
    status?: string
  }>
}

const GastosPrevistosPage = async ({
  searchParams,
}: GastosPrevistosPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year
  const statusFilter = params.status

  if (
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isFinite(year)
  ) {
    redirect(
      `/gastos-previstos?month=${current.month}&year=${current.year}`
    )
  }

  try {
    const [items, categories] = await Promise.all([
      getPlannedExpenses({
        month,
        year,
        status:
          statusFilter === "SCHEDULED" ||
          statusFilter === "PAID" ||
          statusFilter === "CANCELLED"
            ? statusFilter
            : undefined,
      }),
      getCategories(),
    ])

    const openItems = items.filter((item) => item.status === "SCHEDULED")
    const openTotal = openItems.reduce((sum, item) => sum + item.value, 0)
    const paidTotal = items
      .filter((item) => item.status === "PAID")
      .reduce((sum, item) => sum + item.value, 0)

    const filterHref = (status?: string) => {
      const search = new URLSearchParams({
        month: String(month),
        year: String(year),
      })
      if (status) search.set("status", status)
      return `/gastos-previstos?${search.toString()}`
    }

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Compromissos pontuais
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Gastos previstos
              </h1>
              <p className="mt-2 text-sm text-muted">
                Cadastre despesas futuras que não são parceladas — como passagem,
                matrícula ou presente. Elas entram na sobra do mês e, ao pagar,
                viram lançamento no extrato.
              </p>
            </div>
            <Suspense fallback={<div className="text-sm text-muted">...</div>}>
              <MonthYearFilter
                month={month}
                year={year}
                basePath="/gastos-previstos"
              />
            </Suspense>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm text-muted">Em aberto no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(openTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {openItems.length} gasto(s)
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-sm text-muted">Já pagos no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(paidTotal)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Total listado</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(openTotal + paidTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">{items.length} item(ns)</p>
            </article>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Lista do período</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Filtre por status para focar no que ainda falta pagar
                </p>
              </div>
              <div
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1 dark:bg-slate-900/50"
                role="group"
                aria-label="Filtrar gastos previstos"
              >
                {[
                  { id: undefined, label: "Todos" },
                  { id: "SCHEDULED", label: "Previstos" },
                  { id: "PAID", label: "Pagos" },
                ].map((option) => {
                  const active =
                    (option.id ?? "all") === (statusFilter ?? "all")
                  return (
                    <Link
                      key={option.label}
                      href={filterHref(option.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {option.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 px-4 py-10 text-center dark:bg-slate-900/50">
                <p className="font-medium">Nenhum gasto previsto neste filtro</p>
                <p className="mt-1 text-sm text-muted">
                  Ex.: passagem no mês que vem — cadastre ao lado.
                </p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {items.map((item) => (
                  <PlannedExpenseRow
                    key={item.id}
                    item={item}
                    categories={categories}
                  />
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Novo gasto</h2>
              <p className="mt-1 text-sm text-muted">
                Ideal para compras únicas futuras
              </p>
              <div className="mt-4">
                <CreatePlannedExpenseForm categories={categories} />
              </div>
            </div>
            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/35 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm font-semibold text-teal-950 dark:text-teal-200">Dica</p>
              <p className="mt-1 text-xs leading-relaxed text-teal-900/80 dark:text-teal-100/70">
                O gasto também aparece na planilha anual e no detalhamento do
                mês. Se quiser guardar dinheiro aos poucos, use também uma
                caixinha.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/planejamento"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Ver planilha
                </Link>
                <Link
                  href="/caixinhas"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Caixinhas
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default GastosPrevistosPage
