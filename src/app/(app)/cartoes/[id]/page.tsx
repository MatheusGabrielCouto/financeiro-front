import Link from "next/link"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { CreditCardPurchaseForm } from "@/components/credit-card-purchase-form"
import { CreditCardVisual } from "@/components/credit-card-visual"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { StatusBadge } from "@/components/status-badge"
import { ApiError } from "@/lib/api-server"
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getCurrentMonthYear,
} from "@/lib/format"
import {
  getCreditCardInvoice,
  getCreditCardLimit,
  getCreditCardRisk,
  getCreditCardStatement,
  getCreditCards,
} from "@/lib/finance-api"

type CartaoDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}

const CartaoDetailPage = async ({
  params,
  searchParams,
}: CartaoDetailPageProps) => {
  const { id } = await params
  const query = await searchParams
  const current = getCurrentMonthYear()
  const month = query.month ? Number(query.month) : current.month
  const year = query.year ? Number(query.year) : current.year

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12
  ) {
    redirect(`/cartoes/${id}`)
  }

  try {
    const cards = await getCreditCards()
    const card = cards.find((item) => item.id === id)
    if (!card) notFound()

    const [limit, risk, invoice, statement] = await Promise.all([
      getCreditCardLimit(id),
      getCreditCardRisk(id),
      getCreditCardInvoice(id, month, year),
      getCreditCardStatement(id, month, year),
    ])

    const pendingItems = invoice.installments.filter(
      (item) => item.status === "SCHEDULE"
    )
    const paidItems = invoice.installments.filter(
      (item) => item.status === "PAY"
    )
    const pendingTotal = pendingItems.reduce((sum, item) => sum + item.value, 0)
    const paidTotal = paidItems.reduce((sum, item) => sum + item.value, 0)
    const usedPct = Math.min(100, Math.round(risk.usagePercentage))
    const monthLabel = formatMonthLabel(month, year)

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-5 py-7 text-white md:px-8 md:py-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-10 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href="/cartoes"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/80 transition hover:text-teal-100"
                >
                  ← Cartões
                </Link>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  {card.name}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Fatura e limite para {monthLabel}
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                    Carregando...
                  </div>
                }
              >
                <div className="[&_button]:border-white/15 [&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/15 [&_div]:border-white/15 [&_div]:bg-white/5 [&_select]:text-white [&_span]:bg-teal-400/20 [&_span]:text-teal-100">
                  <MonthYearFilter
                    month={month}
                    year={year}
                    basePath={`/cartoes/${id}`}
                  />
                </div>
              </Suspense>
            </div>

            <div className="relative mt-7 grid items-start gap-6 xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
              <CreditCardVisual
                name={card.name}
                brand={card.brand}
                lastDigits={card.lastDigits}
                closingDay={card.closingDay}
                dueDay={card.dueDay}
                available={limit.available}
                usedPct={usedPct}
                pendingInvoice={pendingTotal}
                size="lg"
                className="max-w-none"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs text-slate-300">Disponível</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-emerald-300">
                    {formatCurrency(limit.available)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    de {formatCurrency(limit.limit)}
                  </p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs text-slate-300">Usado</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-amber-200">
                    {formatCurrency(limit.used)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {usedPct}% do limite
                  </p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs text-slate-300">A pagar</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
                    {formatCurrency(pendingTotal)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {pendingItems.length} parcela(s)
                  </p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs text-slate-300">Já pago</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-teal-200">
                    {formatCurrency(paidTotal)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {paidItems.length} quitada(s)
                  </p>
                </article>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm sm:col-span-2">
                  <p className="text-xs text-slate-300">Saúde do limite</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {risk.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  Fatura · {monthLabel}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {invoice.installments.length} parcela(s) · total{" "}
                  {formatCurrency(invoice.total)}
                </p>
              </div>
              {pendingTotal > 0 ? (
                <ProxyActionButton
                  path={`/credit-card/${id}/pay-invoice`}
                  method="POST"
                  body={{ month, year }}
                  label={`Pagar ${formatCurrency(pendingTotal)}`}
                  loadingLabel="Pagando..."
                  variant="primary"
                  confirmTitle="Pagar fatura"
                  confirmMessage={`Debitar ${formatCurrency(pendingTotal)} do saldo para quitar as parcelas de ${monthLabel}?`}
                  ariaLabel={`Pagar fatura de ${card.name}`}
                />
              ) : null}
            </div>

            <div className="p-3 md:p-4">
              {invoice.installments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
                  Nenhuma parcela nesta fatura.
                </div>
              ) : (
                <ul className="space-y-2">
                  {invoice.installments.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/40 px-4 py-3.5 transition hover:border-teal-200/60 dark:hover:border-teal-900/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {item.debtTitle}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          Parcela {item.order} ·{" "}
                          {formatDate(item.dateTransaction)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">
                          {formatCurrency(item.value)}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <CreditCardPurchaseForm cardId={id} />

            <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/40">
              <div className="border-b border-border/70 px-5 py-4">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  Compras do período
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {statement.purchases.length} compra(s) · pendente{" "}
                  {formatCurrency(statement.summary.totalPending)}
                </p>
              </div>
              <div className="scrollbar-thin max-h-[28rem] space-y-2 overflow-y-auto p-3 md:p-4">
                {statement.purchases.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
                    Sem compras neste filtro.
                  </div>
                ) : (
                  statement.purchases.map((purchase) => (
                    <article
                      key={purchase.debtId}
                      className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {purchase.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {purchase.installments.length} parcela(s) ·{" "}
                            {formatDate(purchase.purchaseDate)}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums">
                          {formatCurrency(purchase.total)}
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <ProxyActionButton
              path={`/credit-card/${id}`}
              method="DELETE"
              label="Excluir cartão"
              loadingLabel="Excluindo..."
              variant="danger"
              confirmTitle="Excluir cartão"
              confirmMessage={`Remover ${card.name}? Esta ação não pode ser desfeita.`}
              ariaLabel={`Excluir cartão ${card.name}`}
              redirectTo="/cartoes"
            />
          </div>
        </section>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
}

export default CartaoDetailPage
