import Link from "next/link"
import { redirect } from "next/navigation"
import { CreateRecurringIncomeForm } from "@/components/recurring-forms"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import { formatCurrency } from "@/lib/format"
import { getRecurringIncomes } from "@/lib/finance-api"

const ReceitasFixasPage = async () => {
  try {
    const incomes = await getRecurringIncomes()
    const incomeTotal = incomes.reduce((sum, item) => sum + item.value, 0)
    const sorted = [...incomes].sort((a, b) => a.dayOfMonth - b.dayOfMonth)

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Entradas recorrentes
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Receitas fixas
              </h1>
              <p className="mt-2 text-sm text-muted">
                Cadastre aqui o{" "}
                <span className="font-medium text-foreground">salário</span> e
                outras entradas que se repetem todo mês. Isso alimenta a previsão
                de sobra no Início e nos relatórios.
              </p>
            </div>
            <Link
              href="/recorrentes"
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
            >
              Ir para contas fixas
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
              <p className="text-sm text-muted">Total de receitas fixas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {formatCurrency(incomeTotal)}
              </p>
              <p className="mt-1 text-xs text-muted">por mês</p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
              <p className="text-sm text-muted">Fontes cadastradas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {incomes.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                salário, benefícios e afins
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Suas entradas fixas</h2>
              <p className="text-sm text-muted">
                Valores creditados automaticamente conforme o dia cadastrado.
              </p>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {sorted.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-14 text-center">
                  <p className="font-semibold">Nenhuma receita fixa cadastrada</p>
                  <p className="mt-1 text-sm text-muted">
                    Comece pelo salário para o app projetar sua sobra do mês.
                  </p>
                </div>
              ) : (
                sorted.map((income) => (
                  <article
                    key={income.id}
                    className="rounded-2xl border border-border/80 bg-background/50 p-4 md:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">
                            {income.title}
                          </h3>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-success">
                            Receita fixa
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          Todo dia {income.dayOfMonth}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold tabular-nums text-success">
                          +{formatCurrency(income.value)}
                        </p>
                        <ProxyActionButton
                          path={`/recurring-income/${income.id}`}
                          method="DELETE"
                          label="Excluir"
                          variant="danger"
                          confirmTitle="Excluir receita fixa"
                          confirmMessage={`Você está prestes a excluir "${income.title}". Esta ação não pode ser desfeita.`}
                          ariaLabel={`Excluir receita fixa ${income.title}`}
                        />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Nova receita fixa</h2>
              <p className="mt-1 text-sm text-muted">
                Ex.: Salário, vale-alimentação, aluguel recebido.
              </p>
              <div className="mt-5">
                <CreateRecurringIncomeForm />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5">
              <p className="text-sm font-semibold text-warning">Contas ficam à parte</p>
              <p className="mt-1 text-sm text-muted">
                Aluguel, internet e outras despesas recorrentes são cadastradas
                em Contas fixas.
              </p>
              <Link
                href="/recorrentes"
                className="mt-4 inline-flex rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
              >
                Cadastrar conta fixa
              </Link>
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

export default ReceitasFixasPage
