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
        <section className="rounded-2xl border border-border/80 bg-surface px-5 py-5 shadow-sm shadow-slate-200/40 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Estratégia
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
            Planejador de dívidas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Compare bola de neve e avalanche para escolher a ordem de quitação
            com base no quanto você consegue pagar por mês.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dividas"
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-slate-50"
            >
              Ver dívidas
            </Link>
            <Link
              href="/simulador"
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-slate-50"
            >
              Simulador de parcelas
            </Link>
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
