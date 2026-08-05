import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCardVisual } from "@/components/credit-card-visual"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import {
  getCreditCardInvoice,
  getCreditCardLimit,
  getCreditCards,
} from "@/lib/finance-api"
import { formatCurrency, getCurrentMonthYear } from "@/lib/format"

const CartoesPage = async () => {
  const current = getCurrentMonthYear()

  try {
    const cards = await getCreditCards()
    const summaries = await Promise.all(
      cards.map(async (card) => {
        const [limit, invoice] = await Promise.all([
          getCreditCardLimit(card.id).catch(() => null),
          getCreditCardInvoice(card.id, current.month, current.year).catch(
            () => null
          ),
        ])
        const pending =
          invoice?.installments
            .filter((item) => item.status === "SCHEDULE")
            .reduce((sum, item) => sum + item.value, 0) ?? 0
        return { card, limit, invoice, pending }
      })
    )

    const totalLimit = summaries.reduce(
      (sum, item) => sum + (item.limit?.limit ?? item.card.limit),
      0
    )
    const totalUsed = summaries.reduce(
      (sum, item) => sum + (item.limit?.used ?? 0),
      0
    )
    const totalPendingInvoices = summaries.reduce(
      (sum, item) => sum + item.pending,
      0
    )
    const totalAvailable = Math.max(0, totalLimit - totalUsed)
    const usage =
      totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-5 py-7 text-white md:px-8 md:py-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">
                  Carteira de crédito
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Seus cartões
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Limite, fatura e compras com o mesmo visual do plástico —
                  claro, direto e fácil de escanear.
                </p>
              </div>
              <Link
                href="/cartoes/novo"
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Novo cartão
              </Link>
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Disponível</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-emerald-300">
                  {formatCurrency(totalAvailable)}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Limite usado</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-amber-200">
                  {formatCurrency(totalUsed)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{usage}%</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Faturas abertas</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
                  {formatCurrency(totalPendingInvoices)}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                <p className="text-xs text-slate-300">Cartões</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-teal-200">
                  {cards.length}
                </p>
              </article>
            </div>
          </div>
        </section>

        {summaries.length === 0 ? (
          <section className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface px-5 py-14 text-center shadow-sm shadow-slate-200/30">
            <div className="mx-auto mb-6 w-full max-w-[22rem]">
              <CreditCardVisual
                name="Seu próximo cartão"
                brand="Financeiro"
                lastDigits="0000"
                size="md"
                className="max-w-none"
              />
            </div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Nenhum cartão ainda
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Cadastre o primeiro para acompanhar limite e fatura com um visual
              próximo do cartão real.
            </p>
            <Link
              href="/cartoes/novo"
              className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Adicionar cartão
            </Link>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2">
            {summaries.map(({ card, limit, pending }) => {
              const usedPct =
                limit && limit.limit > 0
                  ? Math.min(100, Math.round((limit.used / limit.limit) * 100))
                  : 0

              return (
                <article
                  key={card.id}
                  className="group flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface p-4 shadow-sm shadow-slate-200/40 transition hover:border-teal-200/70 dark:hover:border-teal-900/50 md:p-5"
                >
                  <Link
                    href={`/cartoes/${card.id}`}
                    aria-label={`Abrir cartão ${card.name}`}
                    tabIndex={0}
                    className="mx-auto block w-full max-w-[26rem] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <CreditCardVisual
                      name={card.name}
                      brand={card.brand}
                      lastDigits={card.lastDigits}
                      closingDay={card.closingDay}
                      dueDay={card.dueDay}
                      available={limit?.available ?? null}
                      usedPct={usedPct}
                      pendingInvoice={pending}
                      size="md"
                      className="max-w-none"
                      interactive
                    />
                  </Link>

                  <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
                    <div className="text-sm text-muted">
                      Limite {formatCurrency(limit?.limit ?? card.limit)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/cartoes/${card.id}`}
                        className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
                      >
                        Ver fatura
                      </Link>
                      <ProxyActionButton
                        path={`/credit-card/${card.id}`}
                        method="DELETE"
                        label="Excluir"
                        loadingLabel="Excluindo..."
                        variant="danger"
                        confirmTitle="Excluir cartão"
                        confirmMessage={`Remover ${card.name}? As compras vinculadas também podem ser afetadas.`}
                        ariaLabel={`Excluir cartão ${card.name}`}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default CartoesPage
