import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { CreatePlannedExpenseForm } from "@/components/planned-expense-form"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import { formatCurrency, formatDate, getCurrentMonthYear } from "@/lib/format"
import {
  getCategories,
  getPlannedExpenses,
} from "@/lib/finance-api"
import type { PlannedExpense } from "@/lib/types"

type GastosPrevistosPageProps = {
  searchParams: Promise<{
    month?: string
    year?: string
    status?: string
  }>
}

const statusLabel = (status: PlannedExpense["status"]) => {
  if (status === "PAID") return "Pago"
  if (status === "CANCELLED") return "Cancelado"
  return "Previsto"
}

const statusClass = (status: PlannedExpense["status"]) => {
  if (status === "PAID") return "bg-emerald-50 text-success"
  if (status === "CANCELLED") return "bg-slate-100 text-muted"
  return "bg-amber-50 text-warning"
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
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Em aberto no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(openTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {openItems.length} gasto(s)
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
              <p className="text-sm text-muted">Já pagos no mês</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(paidTotal)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
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
                className="inline-flex rounded-xl border border-border bg-slate-50 p-1"
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
              <div className="mt-6 rounded-xl bg-slate-50 px-4 py-10 text-center">
                <p className="font-medium">Nenhum gasto previsto neste filtro</p>
                <p className="mt-1 text-sm text-muted">
                  Ex.: passagem no mês que vem — cadastre ao lado.
                </p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{item.title}</p>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${statusClass(
                              item.status
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {formatDate(item.dueDate)}
                          {item.category
                            ? ` · ${item.category.title}`
                            : ""}
                          {item.notes ? ` · ${item.notes}` : ""}
                        </p>
                      </div>
                      <p className="text-base font-semibold tabular-nums text-danger">
                        {formatCurrency(item.value)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.status === "SCHEDULED" ? (
                        <>
                          <ProxyActionButton
                            path={`/planned-expense/${item.id}/pay`}
                            method="POST"
                            label="Pagar agora"
                            loadingLabel="Pagando..."
                            variant="primary"
                            ariaLabel={`Pagar gasto previsto ${item.title}`}
                          />
                          <ProxyActionButton
                            path={`/planned-expense/${item.id}`}
                            method="PATCH"
                            label="Cancelar"
                            loadingLabel="Cancelando..."
                            variant="ghost"
                            body={{ status: "CANCELLED" }}
                            ariaLabel={`Cancelar gasto previsto ${item.title}`}
                          />
                          <ProxyActionButton
                            path={`/planned-expense/${item.id}`}
                            method="DELETE"
                            label="Excluir"
                            variant="danger"
                            confirmTitle="Excluir gasto previsto"
                            confirmMessage={`Você está prestes a excluir "${item.title}". Esta ação não pode ser desfeita.`}
                            ariaLabel={`Excluir gasto previsto ${item.title}`}
                          />
                        </>
                      ) : null}
                      {item.status === "CANCELLED" ? (
                        <ProxyActionButton
                          path={`/planned-expense/${item.id}`}
                          method="DELETE"
                          label="Excluir"
                          variant="danger"
                          confirmTitle="Excluir gasto previsto"
                          confirmMessage={`Você está prestes a excluir "${item.title}". Esta ação não pode ser desfeita.`}
                          ariaLabel={`Excluir gasto previsto ${item.title}`}
                        />
                      ) : null}
                    </div>
                  </li>
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
            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/35 p-4">
              <p className="text-sm font-semibold text-teal-950">Dica</p>
              <p className="mt-1 text-xs leading-relaxed text-teal-900/80">
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
