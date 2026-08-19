import Link from "next/link"
import { redirect } from "next/navigation"
import { DebtPlannerForm } from "@/components/debt-planner-form"
import { ApiError } from "@/lib/api-server"
import { getDebtPlanner } from "@/lib/finance-api"

const PlanejadorPage = async () => {
  try {
    const planner = await getDebtPlanner()

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                  Estratégia de quitação
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Planejador
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Compare bola de neve e avalanche e escolha a ordem que te faz
                  sair das dívidas mais rápido — com o valor que cabe no mês.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/financeiro/dividas"
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Ver dívidas
                </Link>
                <Link
                  href="/financeiro/simulador"
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Simulador
                </Link>
              </div>
            </div>
          </div>
        </section>

        <DebtPlannerForm initialData={planner} />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    throw error
  }
}

export default PlanejadorPage
