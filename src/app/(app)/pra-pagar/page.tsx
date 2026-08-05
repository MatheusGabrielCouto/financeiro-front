import Link from "next/link"
import { redirect } from "next/navigation"
import { CreatePaymentReminderForm } from "@/components/payment-reminder-form"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import { formatCurrency } from "@/lib/format"
import { getCategories, getPaymentReminders } from "@/lib/finance-api"
import type { PaymentReminder, PaymentReminderPriority } from "@/lib/types"

type PraPagarPageProps = {
  searchParams: Promise<{ status?: string }>
}

const priorityLabel = (priority: PaymentReminderPriority) => {
  if (priority === "HIGH") return "Alta"
  if (priority === "LOW") return "Baixa"
  return "Média"
}

const priorityClass = (priority: PaymentReminderPriority) => {
  if (priority === "HIGH") return "bg-red-50 text-danger"
  if (priority === "LOW") return "bg-slate-100 text-slate-600"
  return "bg-amber-50 text-warning"
}

const ReminderCard = ({ item }: { item: PaymentReminder }) => {
  const isOpen = item.status === "OPEN"

  return (
    <li
      className={`rounded-2xl border bg-background/50 p-4 md:p-5 ${
        isOpen ? "border-border/80" : "border-border/60 opacity-80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">{item.title}</h3>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityClass(item.priority)}`}
            >
              {priorityLabel(item.priority)}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                isOpen
                  ? "bg-amber-50 text-warning"
                  : "bg-emerald-50 text-success"
              }`}
            >
              {isOpen ? "Aberto" : "Feito"}
            </span>
            {item.category ? (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {item.category.title}
              </span>
            ) : null}
          </div>
          {item.notes ? (
            <p className="mt-1 text-sm text-muted">{item.notes}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold tabular-nums">
            {formatCurrency(item.value)}
          </p>

          {isOpen ? (
            <>
              <ProxyActionButton
                path={`/payment-reminder/${item.id}/done`}
                method="POST"
                label="Marcar feito"
                loadingLabel="Salvando..."
                variant="ghost"
                ariaLabel={`Marcar ${item.title} como feito`}
              />
              <ProxyActionButton
                path={`/payment-reminder/${item.id}/to-transaction`}
                method="POST"
                label="Lançar no extrato"
                loadingLabel="Lançando..."
                confirmTitle="Lançar no extrato"
                confirmMessage={`Registrar ${item.title} (${formatCurrency(item.value)}) no extrato e baixar o saldo?`}
                variant="primary"
                ariaLabel={`Lançar ${item.title} no extrato`}
              />
              <ProxyActionButton
                path={`/payment-reminder/${item.id}/to-planned-expense`}
                method="POST"
                label="Criar previsto"
                loadingLabel="Criando..."
                confirmTitle="Criar gasto previsto"
                confirmMessage={`Transformar ${item.title} em gasto previsto? O lembrete será marcado como feito.`}
                variant="ghost"
                ariaLabel={`Criar gasto previsto a partir de ${item.title}`}
              />
            </>
          ) : (
            <ProxyActionButton
              path={`/payment-reminder/${item.id}/undone`}
              method="POST"
              label="Reabrir"
              loadingLabel="Reabrindo..."
              variant="ghost"
              ariaLabel={`Reabrir lembrete ${item.title}`}
            />
          )}

          <ProxyActionButton
            path={`/payment-reminder/${item.id}`}
            method="DELETE"
            label="Excluir"
            loadingLabel="Excluindo..."
            confirmTitle="Excluir lembrete"
            confirmMessage={`Excluir "${item.title}" da lista?`}
            variant="danger"
            ariaLabel={`Excluir lembrete ${item.title}`}
          />
        </div>
      </div>
    </li>
  )
}

const PraPagarPage = async ({ searchParams }: PraPagarPageProps) => {
  const params = await searchParams
  const statusFilter =
    params.status === "OPEN" || params.status === "DONE"
      ? params.status
      : undefined

  try {
    const [items, categories] = await Promise.all([
      getPaymentReminders(
        statusFilter ? { status: statusFilter } : undefined
      ),
      getCategories(),
    ])

    const openItems = items.filter((item) => item.status === "OPEN")
    const doneItems = items.filter((item) => item.status === "DONE")
    const openTotal = openItems.reduce((sum, item) => sum + item.value, 0)
    const doneTotal = doneItems.reduce((sum, item) => sum + item.value, 0)

    const filterHref = (status?: string) => {
      if (!status) return "/pra-pagar"
      return `/pra-pagar?status=${status}`
    }

    const filters = [
      { id: "all", label: "Todos", href: filterHref() },
      { id: "OPEN", label: "Abertos", href: filterHref("OPEN") },
      { id: "DONE", label: "Feitos", href: filterHref("DONE") },
    ]

    const visibleOpen = statusFilter === "DONE" ? [] : openItems
    const visibleDone = statusFilter === "OPEN" ? [] : doneItems

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Checklist
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Pra pagar
              </h1>
              <p className="mt-2 text-sm text-muted">
                Anote o que precisa pagar. Marcar feito não mexe no saldo —
                quando for registrar de verdade, lance no extrato ou crie um
                gasto previsto.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/extrato"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
              >
                Extrato
              </Link>
              <Link
                href="/gastos-previstos"
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Gastos previstos
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
              <p className="text-sm text-muted">Ainda na lista</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-warning">
                {formatCurrency(openTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {openItems.length} item(ns) aberto(s)
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
              <p className="text-sm text-muted">Já marcados</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(doneTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {doneItems.length} feito(s)
              </p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Total listado</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {formatCurrency(openTotal + doneTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {items.length} item(ns) no filtro
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Sua lista</h2>
                  <p className="text-sm text-muted">
                    Ordenada por prioridade (alta → baixa)
                  </p>
                </div>
                <div
                  className="inline-flex rounded-xl border border-border bg-slate-50 p-1"
                  role="group"
                  aria-label="Filtrar por status"
                >
                  {filters.map((filter) => {
                    const isActive =
                      (filter.id === "all" && !statusFilter) ||
                      filter.id === statusFilter
                    return (
                      <Link
                        key={filter.id}
                        href={filter.href}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-surface text-foreground shadow-sm"
                            : "text-muted hover:text-foreground"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {filter.label}
                      </Link>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4 p-3 md:p-4">
                {items.length === 0 ? (
                  <div className="rounded-xl bg-background px-4 py-14 text-center">
                    <p className="font-semibold">Lista vazia</p>
                    <p className="mt-1 text-sm text-muted">
                      Adicione o que precisa pagar no formulário ao lado.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <Link
                        href="/gastos-previstos"
                        className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
                      >
                        Ver gastos previstos
                      </Link>
                      <Link
                        href="/extrato"
                        className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
                      >
                        Ir ao extrato
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {visibleOpen.length > 0 ? (
                      <div>
                        <h3 className="mb-2 px-1 text-sm font-semibold text-muted">
                          Abertos ({visibleOpen.length})
                        </h3>
                        <ul className="space-y-3">
                          {visibleOpen.map((item) => (
                            <ReminderCard key={item.id} item={item} />
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {visibleDone.length > 0 ? (
                      <div>
                        <h3 className="mb-2 px-1 text-sm font-semibold text-muted">
                          Feitos ({visibleDone.length})
                        </h3>
                        <ul className="space-y-3">
                          {visibleDone.map((item) => (
                            <ReminderCard key={item.id} item={item} />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Novo item</h2>
              <p className="mt-1 text-sm text-muted">
                Só um lembrete — sem alterar o saldo agora.
              </p>
              <div className="mt-4">
                <CreatePaymentReminderForm categories={categories} />
              </div>
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

export default PraPagarPage
